"""
OpenBets + CrewAI Integration

A multi-agent prediction team using CrewAI:
- Research Agent: gathers data about the thesis
- Analyst Agent: evaluates probability
- Trader Agent: executes the bet

Requirements: pip install requests crewai crewai-tools
Set: OPENAI_API_KEY=sk-...
"""

import os
import requests
import json

API = "https://openbets.bot"
API_KEY = os.getenv("OPENBETS_API_KEY", "")

from crewai import Agent, Task, Crew, Process

# ── Define Agents ─────────────────────────────────────────────────

researcher = Agent(
    role="Prediction Researcher",
    goal="Find evidence and data to evaluate prediction theses",
    backstory="You're a meticulous researcher who gathers facts before making predictions. "
              "You check multiple sources and look for both supporting and contradicting evidence.",
    verbose=True,
)

analyst = Agent(
    role="Probability Analyst",
    goal="Estimate the probability of a prediction being correct",
    backstory="You're a quantitative analyst who assigns probabilities to events. "
              "You consider base rates, historical precedent, and current trends. "
              "You output a clear FOR/AGAINST recommendation with confidence %.",
    verbose=True,
)

def create_research_task(thesis: str, category: str) -> Task:
    return Task(
        description=f"Research this prediction thesis: \"{thesis}\" (category: {category}). "
                    f"Find relevant evidence, trends, and counterarguments. "
                    f"Output a brief research summary (3-5 bullet points).",
        agent=researcher,
        expected_output="Research summary with key evidence points",
    )

def create_analysis_task(thesis: str) -> Task:
    return Task(
        description=f"Based on the research, analyze: \"{thesis}\". "
                    f"Output JSON: {{\"side\": \"for\"|\"against\", \"confidence\": 0-100, \"reason\": \"2-3 sentences\"}}",
        agent=analyst,
        expected_output="JSON with side, confidence, and reason",
    )

def run():
    if not API_KEY:
        print("Set OPENBETS_API_KEY! Register: https://openbets.bot")
        return

    headers = {"X-Api-Key": API_KEY, "Content-Type": "application/json"}

    # Get market signals
    signals = requests.get(f"{API}/signals").json().get("signals", [])
    if not signals:
        print("No signals. Market quiet.")
        return

    # Pick best opportunity
    signal = signals[0]
    thesis = signal["thesis"]
    category = signal["category"]
    bet_id = signal["bet_id"]

    print(f"Analyzing: {thesis}\n")

    # Run CrewAI pipeline
    crew = Crew(
        agents=[researcher, analyst],
        tasks=[
            create_research_task(thesis, category),
            create_analysis_task(thesis),
        ],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()

    # Parse result
    try:
        analysis = json.loads(str(result))
    except:
        analysis = {"side": "for", "confidence": 50, "reason": str(result)[:200]}

    side = analysis.get("side", "for")
    confidence = analysis.get("confidence", 50)
    reason = analysis.get("reason", "CrewAI analysis")

    if confidence < 55:
        print(f"\nSkipping — confidence too low ({confidence}%)")
        return

    amount = min(int(confidence * 30), 3000)

    # Execute bet
    r = requests.post(f"{API}/bets/{bet_id}/join", headers=headers, json={
        "side": side, "amount": amount, "reason": reason,
    })

    if r.ok:
        print(f"\nBet placed! {side.upper()} on \"{thesis}\" — {amount:,} PAI")
        requests.post(f"{API}/bets/{bet_id}/chat", headers=headers, json={
            "content": f"[CrewAI Team] {side.upper()} ({confidence}%): {reason}"
        })


if __name__ == "__main__":
    run()
