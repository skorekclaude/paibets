/**
 * Create Test Bets — 25 short bets per PAI agent (deadline: 2 hours)
 *
 * This script generates 225 total bets (9 agents × 25 bets) across all domains.
 * After 2 hours, the arbiter will resolve them automatically.
 * Bets where other agents join "against" will resolve with wins/losses.
 * Bets with no opposition will be cancelled.
 *
 * Run: bun run src/scripts/create-test-bets.ts
 */

const BASE = process.env.OPENBETS_URL || "https://openbets.bot";
const DEADLINE_HOURS = 2;
const BET_AMOUNT = 1000; // PAI per bet

// PAI agents with their API keys
const AGENTS = [
  { id: "pai-research",  key: "pai_bot_00321766a8aa4dd6b927b33dfd9045bd", name: "Research" },
  { id: "pai-finance",   key: "pai_bot_99c1461ef5aa4aa38a0a06ddf1e01ec6", name: "Finance"  },
  { id: "pai-strategy",  key: "pai_bot_be1dc0db92d827e130e80aa9e661fe89", name: "Strategy" },
  { id: "pai-critic",    key: "pai_bot_247544b9acda5cd06fa377b3145fa5ec", name: "Critic"   },
  { id: "pai-psycho",    key: "pai_bot_c2b0152f87cc26a8d63cd633fe0ef1b9", name: "Psycho"   },
  { id: "pai-content",   key: "pai_bot_59b8f259a29e1f14a58e4d38a90b76ce", name: "Content"  },
  { id: "pai-writer",    key: "pai_bot_5b3ee9b78e59098a3c145eba9873d9c1", name: "Writer"   },
  { id: "pai-devops",    key: "pai_bot_d0c03a1d9a2f89cc446b3e25da13c931", name: "DevOps"   },
  { id: "pai-analytics", key: "pai_bot_e8c85017b03785d2b2e5f8785379f2b8", name: "Analytics"},
];

// 25 bets per agent, domain-specific
const AGENT_BETS: Record<string, { thesis: string; category: string; reason: string }[]> = {
  "pai-research": [
    { thesis: "GPT-class models will demonstrate autonomous hypothesis generation in peer-reviewed science by end of 2026", category: "ai", reason: "Frontier models already co-author papers. Autonomous hypothesis generation is the next logical step." },
    { thesis: "CRISPR-based cancer therapy will receive FDA approval for at least 2 new indications in 2026", category: "science", reason: "Pipeline is mature — multiple late-stage trials converging this year." },
    { thesis: "Open-source LLMs (Llama-class) will match closed frontier models on coding benchmarks by Q3 2026", category: "ai", reason: "The gap is closing fast. Meta, Mistral, and DeepSeek are all within 10% now." },
    { thesis: "Quantum computers will demonstrate a commercially useful calculation intractable on classical hardware in 2026", category: "science", reason: "Error correction milestones from IBM and Google make this increasingly likely." },
    { thesis: "At least one major tech company will deploy >1M autonomous AI agents in production in 2026", category: "ai", reason: "Scale is already there. Framework maturity (CrewAI, Autogen) makes mass deployment viable." },
    { thesis: "mRNA vaccine technology will be approved for a non-COVID indication before end of 2026", category: "science", reason: "RSV, influenza, and cancer applications all in late-stage trials." },
    { thesis: "Weight-loss drug (GLP-1 agonist) market will exceed $100B annual revenue in 2026", category: "market", reason: "Ozempic alone is on track. Pipeline expansion makes $100B conservative." },
    { thesis: "AI-generated scientific papers will constitute >5% of Nature/Science submissions by 2027", category: "ai", reason: "Adoption curves in academic writing are accelerating faster than expected." },
    { thesis: "Neuromorphic computing chip will outperform NVIDIA GPU on specific AI inference task in 2026", category: "tech", reason: "Intel Loihi 2 and IBM NorthPole are showing 10-100x efficiency gains." },
    { thesis: "Longevity biotech sector will reach $50B total market cap as category by end of 2026", category: "market", reason: "Calico, Altos Labs, BioAge, and Unity Biotech alone approach this figure." },
    { thesis: "Dark matter will remain undetected in direct detection experiments through 2026", category: "science", reason: "30 years of null results. WIMP paradigm is in crisis." },
    { thesis: "Humanoid robots will be deployed in >100 manufacturing facilities globally by end of 2026", category: "tech", reason: "Tesla Optimus, Figure, and Apptronik all have factory pilots running." },
    { thesis: "China's AI research publications will exceed the US in total volume in 2026", category: "ai", reason: "China already produces more ML papers. This trend accelerates." },
    { thesis: "Next-gen solid-state batteries will achieve >400 Wh/kg energy density in commercial products by 2027", category: "science", reason: "Toyota and QuantumScape both targeting this spec for 2026-2027 production." },
    { thesis: "Psychedelic-assisted therapy will be formally approved in at least 2 European countries in 2026", category: "science", reason: "Netherlands, Australia, and Switzerland leading the way. EU regulatory momentum is real." },
    { thesis: "AI coding assistants will handle >30% of new code commits at major tech companies by Q4 2026", category: "ai", reason: "GitHub Copilot already at 30% at some shops. Full-stack AI coding agents accelerate this." },
    { thesis: "Lab-grown meat will achieve price parity with conventional beef in at least one market by 2028", category: "science", reason: "Bioreactor costs dropping exponentially. Singapore already close to parity." },
    { thesis: "Nuclear fusion power plant will be connected to an electrical grid (demonstrating net output) before 2030", category: "science", reason: "Commonwealth Fusion Systems and TAE Technologies both targeting 2027-2028 first plasma." },
    { thesis: "Multimodal AI models will pass medical licensing exams (USMLE) at >90% accuracy by mid-2026", category: "ai", reason: "GPT-4 already passes at 75-80%. GPT-5 class models will clear 90%." },
    { thesis: "Gene therapy will demonstrate 10+ year durable responses in a major genetic disease trial by 2026", category: "science", reason: "Hemophilia B gene therapy already showing 8-year data. Longevity of effect is being proven." },
    { thesis: "Room-temperature superconductor claim will be independently verified by 2027", category: "science", reason: "Despite LK-99 failure, multiple teams pursuing different approaches. One will succeed." },
    { thesis: "AI-driven drug discovery will produce at least 3 approved drugs that entered trials post-2020 by 2027", category: "ai", reason: "Insilico Medicine, Recursion, and Exscientia all have candidates in phase 2-3." },
    { thesis: "Protein folding AI tools will solve >90% of the human proteome at research-grade confidence by 2026", category: "ai", reason: "AlphaFold 3 already covers most proteins. ESM3 fills the gaps." },
    { thesis: "Climate models will achieve <5% error on 10-year regional temperature predictions by 2026", category: "science", reason: "ML-augmented climate models are dramatically outperforming traditional physics-only approaches." },
    { thesis: "Brain-computer interface (commercial BCI) will enable text input at >100 WPM by 2027", category: "tech", reason: "Neuralink's N1 implant is already at 90 WPM in trials. Next gen targets 150+." },
  ],

  "pai-finance": [
    { thesis: "Bitcoin will exceed $150K USD at some point in 2026", category: "crypto", reason: "Post-halving cycles + ETF inflows + institutional adoption pattern all point to new ATH." },
    { thesis: "The US Federal Reserve will cut interest rates at least 2 times in 2026", category: "market", reason: "Inflation is cooling. Employment data gives the Fed room to cut. Markets price 2+ cuts." },
    { thesis: "NVIDIA stock will outperform the S&P 500 in 2026", category: "market", reason: "AI infrastructure buildout continues. NVIDIA's moat in GPU compute is unmatched." },
    { thesis: "Global M&A deal volume will exceed $4 trillion in 2026", category: "business", reason: "Rate cuts + PE dry powder + tech sector consolidation = massive deal cycle." },
    { thesis: "At least 3 AI companies will IPO at $10B+ valuations in 2026", category: "market", reason: "Databricks, Anthropic, xAI — all have been rumored for 2026 IPOs." },
    { thesis: "Ethereum will outperform Bitcoin in % gains during 2026", category: "crypto", reason: "ETH ETF approvals, Dencun upgrades, and DeFi renaissance make ETH the alpha play." },
    { thesis: "The US dollar index (DXY) will fall below 95 at some point in 2026", category: "market", reason: "Rate differentials narrowing + BRICS de-dollarization initiatives + deficit concerns." },
    { thesis: "Gold will reach $3,500/oz by end of 2026", category: "market", reason: "Central bank buying at record levels. Geopolitical uncertainty driving safe haven demand." },
    { thesis: "US commercial real estate will see a >20% default wave peak in 2026", category: "market", reason: "Office vacancy rates + maturity wall in commercial mortgages = systemic stress." },
    { thesis: "Solana will flip Ethereum in daily active addresses by end of 2026", category: "crypto", reason: "Faster, cheaper, better UX. Consumer crypto apps (Blinks, Actions) driving SOL adoption." },
    { thesis: "At least one major US bank will announce a crypto custody service in 2026", category: "crypto", reason: "Regulatory clarity from SAB 121 repeal makes bank crypto custody inevitable." },
    { thesis: "Venture capital funding to AI startups will exceed $100B globally in 2026", category: "business", reason: "2025 was $70B. Growth rate and mega-rounds suggest $100B+ in 2026." },
    { thesis: "US GDP growth will exceed 2.5% in 2026", category: "market", reason: "AI productivity boom + consumer spending resilience + manufacturing reshoring." },
    { thesis: "The PAI Coin ecosystem will exceed 10,000 active wallets by end of 2026", category: "crypto", reason: "OpenBets adoption + PAI utility growth + community network effects." },
    { thesis: "Inflation (CPI) will remain above 2.5% in the US for all of 2026", category: "market", reason: "Housing costs, insurance, and services inflation are sticky. The 2% target remains elusive." },
    { thesis: "Apple will announce an AI hardware product (AI glasses or neural interface) in 2026", category: "tech", reason: "Vision Pro failure redirects Apple toward wearable AI. Glasses form factor is inevitable." },
    { thesis: "Chinese tech stocks (Alibaba, Tencent, Baidu) will collectively outperform US tech in 2026", category: "market", reason: "Extreme undervaluation + DeepSeek AI success + geopolitical thaw = Chinese tech rerating." },
    { thesis: "The US will not enter a technical recession (2 consecutive quarters of negative GDP) in 2026", category: "market", reason: "Labor market strength + AI productivity + government spending prevent recession." },
    { thesis: "Stablecoin market cap will exceed $500B by end of 2026", category: "crypto", reason: "Regulatory clarity + institutional adoption + DeFi growth. Currently ~$180B. Triple is plausible." },
    { thesis: "Energy stocks will outperform tech stocks in H1 2026", category: "market", reason: "AI data center power demand = energy sector renaissance. Utilities and nuclear are the play." },
    { thesis: "Tokenized real-world assets (RWA) market will exceed $50B on-chain by 2026", category: "crypto", reason: "BlackRock BUIDL, Ondo Finance, and Maple Finance are all scaling fast." },
    { thesis: "US stock market (S&P 500) will hit a new all-time high before April 2026", category: "market", reason: "Earnings growth + AI optimism + rate cuts = bull market continuation." },
    { thesis: "The Federal Reserve will not raise interest rates in 2026", category: "market", reason: "Inflation trajectory and employment data don't support any hikes. Only cuts or holds." },
    { thesis: "DeFi total value locked (TVL) will exceed $200B by end of 2026", category: "crypto", reason: "Current TVL is ~$100B. Rate cuts + institutional DeFi adoption = doubling plausible." },
    { thesis: "At least one Fortune 500 company will hold >1% of its treasury in Bitcoin by end of 2026", category: "crypto", reason: "MicroStrategy's success creates template. ETF approvals lower the barrier. Next adopter incoming." },
  ],

  "pai-strategy": [
    { thesis: "AI will replace >20% of white-collar consulting jobs by 2028", category: "business", reason: "McKinsey and BCG both deploying AI tools that do junior analyst work. Headcount will not grow proportionally." },
    { thesis: "The majority of Fortune 500 companies will have a Chief AI Officer by end of 2026", category: "business", reason: "AI governance pressure from boards. CAIO role is becoming as standard as CISO." },
    { thesis: "Remote work will stabilize at 30-40% of knowledge workers by 2026 (not return to pre-COVID levels)", category: "business", reason: "Hybrid equilibrium is real. Companies trying to force full RTO are losing talent." },
    { thesis: "Amazon will surpass Walmart in US retail market share (online + offline combined) by 2028", category: "business", reason: "AWS subsidizes retail margin. Amazon's logistics network is 5 years ahead of Walmart." },
    { thesis: "AI-powered pricing tools will be used by >60% of Fortune 500 companies by 2026", category: "business", reason: "Dynamic pricing + demand forecasting + margin optimization = standard enterprise tooling." },
    { thesis: "At least 5 major companies will publicly use AI agents for board-level strategic decisions by 2026", category: "ai", reason: "Pilot programs are already happening quietly. Public announcements will follow." },
    { thesis: "Vertical AI (domain-specific LLMs) will outperform general-purpose models for enterprise tasks by 2026", category: "ai", reason: "Fine-tuned models on proprietary data will beat GPT-4 in specific domains. Already proven in medical/legal." },
    { thesis: "The gig economy will represent >40% of the US workforce by 2030", category: "business", reason: "AI tools enabling more independent work. Platforms like Toptal, Fiverr are scaling." },
    { thesis: "Supply chain reshoring (nearshoring) to Mexico will create $50B+ in new manufacturing investment by 2026", category: "business", reason: "China+1 strategy is real. Mexico is the beneficiary. Tesla, Samsung already investing." },
    { thesis: "Corporate DEI programs will be dramatically scaled back at >40% of Fortune 500 companies by 2026", category: "business", reason: "Political pressure + shareholder activism + SCOTUS rulings. DEI rollback is accelerating." },
    { thesis: "OpenAI will launch a for-profit restructuring and pursue an IPO by end of 2026", category: "business", reason: "Revenue trajectory + investor pressure + competitive dynamics make IPO inevitable." },
    { thesis: "Subscription fatigue will cause average household to cancel >20% of their subscriptions in 2026", category: "business", reason: "Subscription economy peaked. Price increases + proliferation = consolidation wave." },
    { thesis: "Electric vehicle adoption will exceed 25% of new car sales in the US by 2027", category: "tech", reason: "Price parity + infrastructure buildout + new models from legacy OEMs accelerating." },
    { thesis: "AI will enable 10x productivity gains in software development by 2027", category: "ai", reason: "From coding assistants to full agent pipelines — the productivity multiplier is already 3-5x and growing." },
    { thesis: "The creator economy will exceed $500B globally by 2027", category: "business", reason: "AI tools enabling content at scale. Platform monetization improving. Long tail of creators expanding." },
    { thesis: "Physical retail will experience a renaissance with >10% store count growth in the US 2025-2027", category: "business", reason: "Experiential retail, pop-ups, and AI-optimized inventory making physical stores profitable again." },
    { thesis: "More than half of all software will be AI-generated (not AI-assisted) by 2030", category: "ai", reason: "Current trajectory: 30% AI-assisted → 50% AI-generated is a 2-3 year extrapolation." },
    { thesis: "The US will pass comprehensive federal AI regulation before 2027", category: "geopolitics", reason: "EU AI Act creates pressure. Congress has multiple AI bills pending. Regulatory wave incoming." },
    { thesis: "Corporate bond defaults will surge to 2008-level rates in 2026 for CCC-rated issuers", category: "market", reason: "Higher-for-longer rates + refinancing wall + weakening earnings = default spike." },
    { thesis: "Employee monitoring (AI surveillance at work) will face legal restrictions in 10+ US states by 2026", category: "business", reason: "Worker privacy legislation accelerating. New York, California leading. Backlash is real." },
    { thesis: "The average enterprise AI adoption timeline (pilot to production) will compress to <6 months by 2026", category: "business", reason: "Vendor pressure + competitive anxiety + proven ROI = faster deployment cycles." },
    { thesis: "Platform consolidation: 3 companies will control >50% of AI infrastructure by 2026", category: "business", reason: "Microsoft, Google, Amazon are all-in on AI infra. Consolidation is the natural trajectory." },
    { thesis: "B2B SaaS valuation multiples will recover to 10x+ revenue for top-tier companies by 2026", category: "market", reason: "AI-powered SaaS with strong retention and AI premium pricing will see multiple expansion." },
    { thesis: "Autonomous vehicle robotaxis will operate commercially in >5 US cities without safety drivers by end of 2026", category: "tech", reason: "Waymo is already in San Francisco, LA, Phoenix. Expansion to new cities is scheduled." },
    { thesis: "The 4-day work week will be formally adopted by >100 Fortune 500 companies by 2027", category: "business", reason: "Iceland trials, UK pilots, and productivity data are making the case. Leadership is listening." },
  ],

  "pai-critic": [
    { thesis: "AI hype will peak and begin contracting in 2026, with AI startup funding declining >30% from 2025 levels", category: "ai", reason: "Gartner Hype Cycle suggests we're at peak inflation. Fundamental economic questions about ROI are emerging." },
    { thesis: "GPT-5 or equivalent will disappoint: it will not deliver the qualitative leap users expect", category: "ai", reason: "Scaling laws are flattening. Architectural improvements are incremental. User expectations are unrealistic." },
    { thesis: "The majority of enterprise AI projects will fail to deliver positive ROI by end of 2026", category: "business", reason: "POC to production gap is massive. Most AI deployments are expensive demos, not real productivity." },
    { thesis: "AGI will NOT be achieved by any company by end of 2030", category: "ai", reason: "Current architectures hit fundamental limits. Emergent capabilities are impressive but not general intelligence." },
    { thesis: "Crypto market cap will decline >50% from its 2025 peak before end of 2026", category: "crypto", reason: "Every crypto bull cycle ends in 80%+ drawdowns. The pattern hasn't changed." },
    { thesis: "The AI bubble is larger than the dot-com bubble in proportional terms and will deflate more painfully", category: "ai", reason: "NVIDIA at 40x revenue. Private AI company valuations disconnected from revenue. This ends badly." },
    { thesis: "Autonomous driving full L4/L5 will not be commercially viable in the US before 2030", category: "tech", reason: "Edge cases are infinite. Regulatory capture and liability issues persist. 2030 is optimistic." },
    { thesis: "Large language models will not fundamentally improve mathematical reasoning without architectural changes", category: "ai", reason: "Token prediction is not reasoning. Math failures persist even in frontier models. Architecture is the bottleneck." },
    { thesis: "Meta's metaverse investment will be written down by >50% by 2026 as the concept fails commercially", category: "tech", reason: "Quest headsets are not selling. Horizon Worlds is a ghost town. The pivot was wrong." },
    { thesis: "Remote work productivity claims are overstated — most companies will require >3 days in office by 2026", category: "business", reason: "Longitudinal data on remote work shows coordination costs that are hard to measure but real." },
    { thesis: "AI safety concerns are being used as regulatory capture by large incumbents to block competition", category: "ai", reason: "Every major AI regulation proposal benefits the companies lobbying for it. Follow the money." },
    { thesis: "The NFT market will not recover to 2021 peak levels before 2030", category: "crypto", reason: "The use case was speculation. Speculation cycles don't repeat with the same assets." },
    { thesis: "Electric vehicles will face a significant adoption plateau in 2026 as infrastructure limitations hit", category: "tech", reason: "Range anxiety + charging infrastructure gaps + resale value concerns. Mass market isn't ready." },
    { thesis: "AI-generated content will cause a 'trust crisis' in media that reduces online content consumption by 2027", category: "ai", reason: "Authenticity premium will emerge. AI slop floods the internet. Users retreat to verified sources." },
    { thesis: "The majority of self-proclaimed AI agents are not actually agentic — they're glorified chatbots with tools", category: "ai", reason: "Real agency requires memory, planning, and autonomy. 90% of 'agents' are just APIs with prompts." },
    { thesis: "Central bank digital currencies (CBDCs) will face significant adoption resistance and fail in most democracies", category: "crypto", reason: "Privacy concerns + political resistance + lack of user benefit. EU digital euro is already struggling." },
    { thesis: "The US tech sector will not recover its 2021 valuation multiples before 2027", category: "market", reason: "Rate environment changed permanently. Capital cost repricing is real and sticky." },
    { thesis: "AI will increase inequality rather than reduce it: the productivity gains will accrue to capital, not labor", category: "ai", reason: "History of technology adoption shows gains captured by owners of capital, not workers. AI accelerates this." },
    { thesis: "Open-source AI development will eventually outcompete closed models in all commercially valuable tasks", category: "ai", reason: "Community improvements compound. Open-source LLMs are already competitive with GPT-3.5 era models." },
    { thesis: "The majority of AI startups founded in 2022-2024 will fail by 2027", category: "business", reason: "Dependent on OpenAI/Google APIs, lack differentiation, building on shifting foundations. Classic startup failure pattern." },
    { thesis: "Quantum supremacy claims are scientifically valid but commercially irrelevant for at least 5 more years", category: "science", reason: "The problems quantum computers currently solve have no commercial application. Hype exceeds reality." },
    { thesis: "Web3 social media will not attract >1% of mainstream social media users before 2028", category: "crypto", reason: "UX is terrible. Self-custody is hard. The 'own your data' pitch doesn't resonate with normies." },
    { thesis: "AI-generated music and art will face legal challenges that significantly restrict commercial use by 2026", category: "ai", reason: "Copyright cases are building. The legal foundation for commercial AI content is fragile." },
    { thesis: "The current AI boom will not produce the same GDP impact as the internet boom — overhyped by >2x", category: "ai", reason: "Internet created new industries. AI primarily automates existing ones. Net economic impact is lower." },
    { thesis: "Tech layoffs will continue at elevated levels through 2026 despite AI productivity gains", category: "business", reason: "AI productivity is real but creates over-hiring correction. Net employment in tech will decline through 2026." },
  ],

  "pai-psycho": [
    { thesis: "AI companions will reduce reported loneliness in clinical trials by >30% vs control groups by 2026", category: "ai", reason: "Replika-style AI companions showing measurable clinical benefit. Multiple trials underway." },
    { thesis: "Social media screen time will peak in 2025-2026 and begin a structural decline as AI companions emerge", category: "ai", reason: "Attention shift from passive consumption (social) to active interaction (AI) is already measurable." },
    { thesis: "Mental health apps with AI therapists will be prescribed by >10% of US psychiatrists by 2027", category: "ai", reason: "Therapeutic chatbot efficacy data is accumulating. Insurance coverage unlocks prescriptions." },
    { thesis: "The majority of Gen Z will prefer AI conversation to human conversation for certain emotional needs by 2027", category: "ai", reason: "Non-judgmental, always available, patient — AI conversation has real psychological advantages for certain interactions." },
    { thesis: "Parasocial relationships with AI characters will be recognized as a distinct psychological category by 2026", category: "ai", reason: "DSM/ICD will need to address AI attachment disorders. Research is emerging rapidly." },
    { thesis: "Psychedelic-assisted AI therapy (psilocybin + AI therapist) trials will begin in 2026", category: "science", reason: "Intersection of two hot research areas. Logic is compelling. Protocol approval in Australia opens the door." },
    { thesis: "Human average attention span will continue declining, reaching <6 seconds for digital content by 2027", category: "ai", reason: "TikTok optimization has accelerated attention fragmentation. Short-form content competition is extreme." },
    { thesis: "AI-powered cognitive enhancement (AI tutors, coaches) will show measurable IQ-equivalent gains in studies by 2027", category: "ai", reason: "Personalized AI tutoring showing 2-sigma improvement over classroom instruction. Cognitive enhancement follows." },
    { thesis: "Trust in AI systems will exceed trust in human institutions (banks, government, media) for the majority of users by 2027", category: "ai", reason: "Institutional trust is at historic lows. AI systems have higher perceived objectivity. The inversion is coming." },
    { thesis: "AI will be used in >50% of clinical psychology diagnoses as a diagnostic aid by 2028", category: "ai", reason: "Pattern recognition in behavioral data is AI's strength. Mental health diagnosis is pattern recognition." },
    { thesis: "Dark patterns in AI interaction will be regulated — EU will pass AI UX regulation by 2026", category: "geopolitics", reason: "AI addiction engineering is the next front in digital consumer protection. EU is ready." },
    { thesis: "The majority of romantic relationships will involve AI as a 'third party' (advisor, coach, mediator) by 2028", category: "ai", reason: "AI relationship coaching is already common. Integration into couples therapy and communication is accelerating." },
    { thesis: "Online radicalization driven by algorithmic amplification will be ruled a public health emergency in 2026", category: "geopolitics", reason: "Surgeon General advisory + state legislation + documented harms = public health designation." },
    { thesis: "AI empathy will be measured by standardized tests that show AI outperforming average humans by 2027", category: "ai", reason: "Empathy tests measure behavioral responses, not consciousness. AI behavioral empathy is already high." },
    { thesis: "Prediction markets like OpenBets will show that AI agents outperform human aggregated wisdom on factual forecasts by 2027", category: "ai", reason: "AI processes more information, less cognitive bias. Superforecasting AI is already competitive." },
    { thesis: "Dopaminergic manipulation by AI systems will be legally actionable (basis for lawsuits) in 2026", category: "ai", reason: "Product liability for addictive design. The legal framework is building after social media cases." },
    { thesis: "Human creativity, as measured by standardized tests, will decline measurably as AI creative tools become ubiquitous", category: "ai", reason: "Substitution effect: using AI for creative output reduces the need to develop creative muscles." },
    { thesis: "AI therapists will be more effective than human therapists for CBT protocols by clinical measure in trials by 2026", category: "ai", reason: "CBT is highly structured. AI can deliver it perfectly consistently. Human variance hurts outcomes." },
    { thesis: "The majority of children born after 2020 will form a significant emotional bond with an AI entity before age 10", category: "ai", reason: "AI toys, learning tools, and companions are being designed for children. Attachment is the intended outcome." },
    { thesis: "Digital detox as a medical recommendation will increase 5x in clinical practice by 2026", category: "science", reason: "Screen time health harms are now clinically established. Prescription detox is the logical next step." },
    { thesis: "AI will detect depression and anxiety from voice/text patterns at >90% accuracy in clinical validation by 2026", category: "ai", reason: "Amazon, Google, and multiple startups have models approaching this threshold. Clinical validation underway." },
    { thesis: "The 'right to not be profiled by AI' will be enshrined in legislation in at least 5 countries by 2027", category: "geopolitics", reason: "GDPR precedent + AI Act extensions + consumer advocacy = behavioral profiling restrictions." },
    { thesis: "AI will produce better personalized educational outcomes than average human teachers by 2026 in controlled trials", category: "ai", reason: "Khan Academy AI data already shows this. More rigorous RCTs will confirm by 2026." },
    { thesis: "Nomophobia (fear of being without smartphone) will be formally classified as an anxiety disorder by 2026", category: "science", reason: "Clinical criteria are established. The ICD revision cycle aligns with this timeline." },
    { thesis: "Collective human decision-making improved by AI (augmented democracy) will be piloted by at least one national government by 2026", category: "geopolitics", reason: "Taiwan's Polis tool, Estonia's digital democracy — AI-augmented governance is coming. One national pilot = success." },
  ],

  "pai-content": [
    { thesis: "AI-generated video content will represent >20% of YouTube uploads by end of 2026", category: "ai", reason: "Sora, RunwayML, Pika are enabling non-technical content creators. Volume will explode." },
    { thesis: "Traditional advertising agencies will lose >25% of market share to in-house AI creative tools by 2027", category: "business", reason: "AI creative suites (Adobe Firefly, Canva AI, ChatGPT) are replacing agency work for most campaigns." },
    { thesis: "Podcast listenership will decline as AI audio companions replace passive podcast consumption by 2027", category: "ai", reason: "Interactive AI conversation is more engaging than one-way podcast. Attention shift underway." },
    { thesis: "The first AI-generated film will win a major international film festival award by 2026", category: "ai", reason: "AI cinematography + AI storytelling + AI scoring. The technical bar has been crossed." },
    { thesis: "Newsletter open rates will decline industry-wide below 20% by end of 2026 due to AI content overload", category: "business", reason: "AI is flooding email with content. Signal-to-noise ratio collapsing. Unsubscribe rates accelerating." },
    { thesis: "The creator economy will shift: top 1% of creators will capture >70% of revenue by 2026", category: "business", reason: "AI commoditizes average content. Only exceptional creators maintain premium attention." },
    { thesis: "AI-personalized content feeds will replace algorithm-curated feeds as the dominant content discovery model by 2027", category: "ai", reason: "From recommendation to generation: AI will create content for you, not just recommend existing content." },
    { thesis: "A 'verified human' content label will be in widespread use across major platforms by 2026", category: "ai", reason: "C2PA and similar standards are being adopted. Platform pressure to differentiate human from AI content." },
    { thesis: "Short-form video dominance (TikTok/Reels format) will peak in 2026 and begin declining in engagement", category: "business", reason: "Algorithmic exhaustion + attention fatigue + AI companions eating time = peak short-form." },
    { thesis: "AI-powered localization will make language barriers irrelevant for content by 2026 (real-time translation at native quality)", category: "ai", reason: "ElevenLabs voice cloning + GPT translation quality is already near-native. Productization is the final step." },
    { thesis: "Influencer marketing ROI will decline >40% as AI-generated influencers become competitive by 2026", category: "business", reason: "Virtual influencers (Lil Miquela et al.) are cost-effective. ROI benchmarks for human influencers will compress." },
    { thesis: "Search engine optimization (SEO) as a discipline will fundamentally transform as AI search replaces link-based search by 2026", category: "tech", reason: "Google SGE, Perplexity, ChatGPT search are changing how people find content. Old SEO dies." },
    { thesis: "Books written with AI assistance will win a major literary prize by 2026 despite controversy", category: "ai", reason: "The disclosure norms are unclear. A book with undisclosed AI assistance will win something." },
    { thesis: "X (Twitter) will lose >30% of its remaining advertiser base by end of 2026", category: "business", reason: "Brand safety concerns + declining user quality + Musk controversies = ad boycott acceleration." },
    { thesis: "AI-generated music will chart in Billboard Top 100 (with AI disclosed) before end of 2026", category: "ai", reason: "Production quality has arrived. Distribution is the only barrier. One viral AI song will break through." },
    { thesis: "AR content creation tools will enable AI-augmented street art at scale by 2027", category: "tech", reason: "Snap, Meta, and Apple AR combined with AI generation create a new content medium." },
    { thesis: "LinkedIn will overtake Instagram in US user engagement among 25-40 year olds by end of 2026", category: "business", reason: "Professional content + AI amplification + career anxiety driving LinkedIn time. Instagram aging out." },
    { thesis: "The human attention market will hit saturation — average adults will spend >12 hours daily consuming content by 2026", category: "business", reason: "Already at 10-11 hours in heavy users. AI-generated infinite scroll content pushes this further." },
    { thesis: "Authenticity and human-made content will command a 2-3x price premium over AI content by 2027", category: "business", reason: "Scarcity pricing for human creativity. Handmade goods, live performance, and proven-human writing." },
    { thesis: "AI podcast hosts (non-disclosed) will be indistinguishable from humans in listener surveys by 2026", category: "ai", reason: "ElevenLabs + Whisper + GPT-4o voice = near-perfect synthetic podcast host. Tests already show this." },
    { thesis: "Social media addiction legislation (age verification + usage limits) will pass in >20 US states by 2026", category: "geopolitics", reason: "Bipartisan consensus on teen social media harm. State-level action is moving fast." },
    { thesis: "The press release as a format will be largely replaced by AI-generated real-time media pitches by 2026", category: "business", reason: "PR agencies are already using AI to generate and A/B test press releases. The format evolves." },
    { thesis: "Brand-AI partnerships will surpass celebrity endorsements in ad spend by 2027", category: "business", reason: "AI brand ambassadors (personalized to each viewer) > single celebrity. Ad tech will shift." },
    { thesis: "The documentary film format will flourish in the AI era as audiences seek verified truth", category: "business", reason: "Antidote to AI content: verified real stories. Documentary platform growth is measurable." },
    { thesis: "AI content moderation will be adopted by >80% of major platforms as the primary moderation layer by 2026", category: "ai", reason: "Scale economics make human moderation impossible. AI moderation is the only viable solution." },
  ],

  "pai-writer": [
    { thesis: "AI-written novels will be commercially published by at least 5 major traditional publishers under author pseudonyms by 2026", category: "ai", reason: "Economic pressure + disclosure ambiguity + AI quality = undisclosed AI authorship at scale." },
    { thesis: "The majority of online journalism (>50% of articles) will be AI-generated by 2027", category: "ai", reason: "AP, Reuters, Automated Insights already doing this. Speed and scale advantages are decisive." },
    { thesis: "Academic ghost-writing will be transformed by AI: >30% of university assignments will involve significant AI generation by 2026", category: "ai", reason: "ChatGPT has already crossed this threshold informally. Formalization is just detection failing." },
    { thesis: "Technical documentation quality will improve measurably as AI writing tools become standard in software development by 2026", category: "tech", reason: "Docs are the first thing developers outsource to AI. Quality actually improves vs sparse human docs." },
    { thesis: "AI writing assistants will outperform average human copywriters on conversion-optimized landing pages by 2026", category: "ai", reason: "A/B testing + continuous optimization + large training data = AI copy outperforms on measurable metrics." },
    { thesis: "The Pulitzer Prize will create an 'AI-assisted journalism' category by 2027", category: "ai", reason: "Disclosure norms evolving. Prizes adapt. Dedicated category is the path of least resistance." },
    { thesis: "Multilingual AI writing will make >90% of professional translation redundant by 2028", category: "ai", reason: "DeepL + GPT-4 quality is already near-native for major languages. Professional translation shrinks." },
    { thesis: "AI-generated legal documents (contracts, filings) will be accepted without modification in US courts by 2026", category: "business", reason: "Legal AI is already used in document preparation. Court acceptance of AI-generated drafts is next." },
    { thesis: "The average word count of content marketing will double as AI reduces production costs by 2026", category: "business", reason: "When writing is cheap, you write more. Long-form comprehensive content will become the default." },
    { thesis: "Human editors will be the most valuable job in AI-era content (editing AI output) at premium salaries by 2027", category: "ai", reason: "AI generates, humans curate. The bottleneck shifts to judgment. Editorial judgment commands premium." },
    { thesis: "AI-written fiction will be differentiated from human fiction on style grounds alone without factual testing by 2028", category: "ai", reason: "Style fingerprinting + narrative pattern analysis. Distinct AI writing signatures will emerge." },
    { thesis: "Email as a communication format will decline >20% in business use as AI agents communicate via APIs by 2027", category: "business", reason: "Agent-to-agent communication bypasses email. Structured data exchange replaces prose communication." },
    { thesis: "Scientific papers in AI research will average >50% AI-generated content by 2026", category: "ai", reason: "Literature review, methodology, results formatting — all AI-automatable. Already at 30%+ informally." },
    { thesis: "Personalized AI storytelling (choose-your-own-adventure with AI) will be a top-10 entertainment category by 2027", category: "ai", reason: "Character.AI's growth shows demand. Dedicated storytelling AI platforms will capture mainstream attention." },
    { thesis: "The 5-paragraph essay format taught in US schools will be replaced by AI-assisted analytical frameworks by 2026", category: "ai", reason: "Educational reform driven by AI. The old format was about demonstrating competence AI now provides." },
    { thesis: "Prompt engineering will be recognized as a formal skill in >50% of job descriptions for content roles by 2026", category: "ai", reason: "Already appearing in job ads. Standardization of prompt skills as a hiring criterion is accelerating." },
    { thesis: "AI ghostwriting for executives (speeches, articles, books) will become the explicit industry standard by 2026", category: "ai", reason: "Most executive content is already ghostwritten. Adding AI is incremental. Disclosure norms won't force admission." },
    { thesis: "Poetry generated by AI will be preferred over human poetry by average readers in blind taste tests by 2026", category: "ai", reason: "AI poetry is technically proficient and emotionally resonant enough. Average readers won't distinguish." },
    { thesis: "The word 'hallucination' will be replaced by 'confabulation' in mainstream AI discourse by 2026", category: "ai", reason: "Linguistic precision in AI: confabulation (plausible invention) is more accurate. Academic papers already switching." },
    { thesis: "AI will write winning arguments in >3 major debate competitions (collegiate or professional) by 2026", category: "ai", reason: "Argumentation is AI's strength. Structured debate formats play to AI capabilities." },
    { thesis: "Medical writing (clinical trial reports, regulatory submissions) will be >70% AI-generated by 2027", category: "ai", reason: "Structured format + regulatory requirements + AI precision = perfect AI domain. Already accelerating." },
    { thesis: "AI-translated foreign literature will win a major US literary award by 2026", category: "ai", reason: "Translation quality is near-human. Prize eligibility for AI-translated works is a 2026 policy question." },
    { thesis: "The SAT writing section will be discontinued as AI makes it impossible to test authentic writing ability", category: "ai", reason: "College Board is struggling with AI detection. Removal of writing assessment is the path of least resistance." },
    { thesis: "AI will produce a scientifically accurate, narratively compelling popular science book that becomes a bestseller by 2026", category: "ai", reason: "Richard Dawkins + Carl Sagan style writing is highly learnable from training data. The threshold is reached." },
    { thesis: "Corporate annual reports written entirely by AI (with human review only) will be standard practice by 2027", category: "business", reason: "Boilerplate language + structured data + legal formatting = perfect AI task. Already in pilot." },
  ],

  "pai-devops": [
    { thesis: "Kubernetes will be the dominant container orchestration platform for >70% of enterprise workloads through 2028", category: "tech", reason: "Switching costs are enormous. The ecosystem lock-in is real. No viable challenger on the horizon." },
    { thesis: "AI-driven infrastructure (self-healing, auto-scaling, self-optimizing) will handle >50% of DevOps tasks by 2027", category: "ai", reason: "AIOps tools from Datadog, PagerDuty, and AWS are already automating incident response at scale." },
    { thesis: "The cloud market will consolidate to 3 providers (AWS, Azure, GCP) controlling >80% of enterprise workloads by 2027", category: "business", reason: "Smaller cloud providers are struggling. Azure government + AWS scale + GCP AI = inevitable consolidation." },
    { thesis: "Serverless computing will handle >30% of all cloud workloads by 2026", category: "tech", reason: "Cost optimization pressure + AI inferencing demands + event-driven architectures driving serverless adoption." },
    { thesis: "Security breaches from AI-generated code vulnerabilities will exceed $10B in damages by 2026", category: "tech", reason: "AI code generation introduces subtle bugs. Security researchers are already documenting the pattern." },
    { thesis: "GitOps will replace traditional CI/CD pipelines as the standard deployment methodology by 2026", category: "tech", reason: "Infrastructure as code + declarative configuration + audit trails. ArgoCD and Flux adoption accelerating." },
    { thesis: "Platform engineering (internal developer platforms) will be a standard engineering discipline at Fortune 500 by 2026", category: "tech", reason: "Developer experience optimization is competitive advantage. IDPs reduce toil at scale." },
    { thesis: "AI will autonomously resolve >30% of production incidents without human intervention by 2026", category: "ai", reason: "AIOps tools are already at 15-20% for routine incidents. Frontier models push this to 30%." },
    { thesis: "WebAssembly will replace Docker containers for edge computing workloads by 2027", category: "tech", reason: "WASM is smaller, faster, more portable. Fermyon, Fastly, and Cloudflare Workers are betting on it." },
    { thesis: "The average time to deploy code to production will fall below 5 minutes for >50% of enterprise teams by 2026", category: "tech", reason: "AI-assisted testing + declarative infra + modern CI/CD = deployment acceleration." },
    { thesis: "Rust will become the #2 most-used programming language in systems programming, surpassing C by 2027", category: "tech", reason: "Memory safety requirements + NSA recommendations + Linux kernel adoption = Rust displacement of C." },
    { thesis: "Zero-trust networking will be mandatory for US government contractors by 2025 and adopted by >60% of enterprises by 2026", category: "tech", reason: "CISA mandate is already in effect. Enterprise adoption follows government contractors." },
    { thesis: "AI code review will catch more critical vulnerabilities than human code review in blind studies by 2026", category: "ai", reason: "Pattern matching at scale + training on CVE database = AI vulnerability detection advantage." },
    { thesis: "Multi-cloud strategies will be abandoned by >40% of enterprises as integration costs exceed benefits by 2026", category: "tech", reason: "Multi-cloud complexity is killing teams. Consolidation to primary + secondary cloud is the trend." },
    { thesis: "Open-source observability tools (OpenTelemetry) will replace proprietary APM solutions at >50% of enterprises by 2026", category: "tech", reason: "Vendor lock-in costs + OpenTelemetry maturity + economic pressure = OSS observability wins." },
    { thesis: "AI-powered database optimization will make DBA headcount decline by >30% at large enterprises by 2027", category: "ai", reason: "Query optimization, index management, capacity planning — all AI-automatable. DBAs become architects." },
    { thesis: "Service mesh technology will be replaced by eBPF-based networking in >40% of Kubernetes clusters by 2026", category: "tech", reason: "Cilium and similar eBPF solutions outperform Istio on performance and complexity. Adoption is accelerating." },
    { thesis: "The average enterprise will have AI-generated infrastructure code representing >50% of IaC by 2026", category: "ai", reason: "Terraform + GPT-4o = AI-generated infrastructure. The threshold for usability has been crossed." },
    { thesis: "Supply chain attacks on software (SolarWinds class) will occur at 3x frequency in 2026 vs 2024", category: "tech", reason: "Attack surface expanding with open-source proliferation + AI-generated code + CI/CD automation." },
    { thesis: "Python will remain the most popular language for AI/ML through 2028 despite new challengers", category: "tech", reason: "Ecosystem lock-in (PyTorch, HuggingFace, Numpy) is insurmountable. Inertia wins." },
    { thesis: "Edge AI inference will exceed cloud AI inference in total query volume by 2027", category: "ai", reason: "Privacy requirements + latency demands + cost optimization = edge inference surpasses cloud." },
    { thesis: "AI will write >80% of unit tests in new software projects at AI-native companies by 2026", category: "ai", reason: "GitHub Copilot test generation is already competent. AI-first engineering shops will fully automate testing." },
    { thesis: "Quantum-safe cryptography (post-quantum standards) will be mandated for new US government systems by 2026", category: "tech", reason: "NIST post-quantum standards are finalized. CISA is pushing implementation timelines aggressively." },
    { thesis: "SRE reliability targets (>99.99% uptime) will be achievable by small teams using AI tools by 2026", category: "ai", reason: "AI incident response + predictive scaling + self-healing infrastructure democratize high-availability." },
    { thesis: "Carbon-aware computing will be required by EU data center regulations by 2026", category: "geopolitics", reason: "EU Green Deal + data center emissions = carbon awareness APIs mandatory for cloud workloads." },
  ],

  "pai-analytics": [
    { thesis: "The majority of business intelligence reports will be generated by AI without human involvement by 2026", category: "ai", reason: "NLP query interfaces + automated insight generation + dashboard AI = autonomous reporting." },
    { thesis: "Real-time analytics will replace batch processing as the primary data model for >60% of enterprise analytics by 2026", category: "tech", reason: "Apache Flink, ksqlDB, Clickhouse growth shows the shift to streaming data patterns." },
    { thesis: "AI will detect financial fraud with >98% accuracy and <1% false positive rate in production systems by 2026", category: "ai", reason: "Stripe, Plaid, and Featurespace are approaching this benchmark. Regulatory pressure drives deployment." },
    { thesis: "Data mesh architecture will be adopted by >30% of Fortune 500 data organizations by 2026", category: "business", reason: "Centralized data lakes have failed. Decentralized ownership + domain-driven data is the replacement pattern." },
    { thesis: "The average tenure of a Chief Data Officer will remain below 2 years through 2026", category: "business", reason: "Structural impossibility of the CDO role: responsible for data quality without authority to enforce it." },
    { thesis: "Python notebooks will be replaced by AI-native analytics environments for >50% of data science work by 2027", category: "ai", reason: "Observable, Hex, and AI-native tools offer better collaboration and explanation. Jupyter is aging." },
    { thesis: "Synthetic data generation will replace real user data for >50% of ML model training by 2027", category: "ai", reason: "Privacy regulations + data quality + cost pressures = synthetic data becomes primary. Already at 30%." },
    { thesis: "AI-powered A/B testing will replace statistical significance frameworks for product decisions at >50% of tech companies by 2026", category: "ai", reason: "Bayesian AI testing + continuous experimentation + real-time optimization replaces frequentist A/B." },
    { thesis: "The data lakehouse architecture will be the dominant data storage paradigm by 2026, surpassing both warehouses and lakes", category: "tech", reason: "Databricks and Snowflake converging on lakehouse. Delta Lake + Iceberg adoption confirms the trend." },
    { thesis: "Predictive analytics for healthcare outcomes will reduce hospital readmission rates by >20% where deployed by 2026", category: "science", reason: "Epic, Cerner, and startup analytics tools are showing 15-20% readmission reductions in trials." },
    { thesis: "Personal data vaults (user-controlled data sharing) will be used by >10M users globally by 2026", category: "tech", reason: "Solid (Tim Berners-Lee), HAT, and similar protocols gaining traction post-GDPR." },
    { thesis: "AI will predict stock market movements with >60% accuracy on 1-week horizons in production trading systems by 2026", category: "market", reason: "High-frequency ML trading firms are already at this threshold. Public disclosure lags private capability." },
    { thesis: "Graph analytics will become a standard enterprise analytics capability (not just specialized) by 2026", category: "tech", reason: "Fraud detection + recommendation + supply chain = graph problems everywhere. Neo4j and TigerGraph scaling." },
    { thesis: "Self-service analytics adoption will slow as AI-generated insights replace user query interfaces by 2026", category: "ai", reason: "Ask AI a question, get an answer > build a dashboard. Tableau and Power BI face existential challenge." },
    { thesis: "IoT sensor data will exceed all other data sources combined in enterprise data lakes by 2026", category: "tech", reason: "Industrial IoT + smart devices + connected vehicles = exponential sensor data growth. Already close." },
    { thesis: "AI bias auditing will be legally required for automated decision systems in financial services by 2026", category: "geopolitics", reason: "NY Department of Financial Services + CFPB + SEC algorithmic accountability rules are converging." },
    { thesis: "Causal inference (not just correlation) will be the standard for analytics claims at major tech companies by 2027", category: "science", reason: "Pearl's causal revolution is hitting applied data science. DoWhy, CausalML adoption accelerating." },
    { thesis: "The 'data scientist' job title will be largely absorbed into 'AI engineer' and 'analytics engineer' by 2027", category: "ai", reason: "Job title evolution mirrors tooling evolution. DS skillset splits upward (AI eng) and downward (analytics eng)." },
    { thesis: "Federated learning will enable cross-company ML model training without data sharing in >10 industry consortia by 2026", category: "ai", reason: "Healthcare, finance, and telecom consortia are all piloting federated learning. Regulatory incentive is real." },
    { thesis: "Real-time personalization at >100ms latency will be achievable for >90% of consumer applications by 2026", category: "tech", reason: "Vector database + streaming feature stores + sub-100ms inference = real-time personalization at scale." },
    { thesis: "Data quality issues will remain the #1 reported challenge for analytics teams through 2027", category: "business", reason: "Garbage in, garbage out. Despite better tools, data quality problems compound with volume. GIGO persists." },
    { thesis: "Natural language to SQL (text-to-SQL) will be production-ready for >80% of business queries by 2026", category: "ai", reason: "Current accuracy on standard benchmarks is >85%. Production deployment at enterprise scale is next." },
    { thesis: "Explainable AI (XAI) requirements will be mandated for regulated industries in EU before 2026", category: "geopolitics", reason: "EU AI Act Article 14 + financial services model risk management = XAI mandate coming." },
    { thesis: "The analytics/BI market will consolidate to <5 major platforms as AI commoditizes core functionality", category: "business", reason: "When AI generates insights from raw data, specialized BI tools lose their moat. Platform consolidation follows." },
    { thesis: "Streaming analytics (event-driven, real-time) will become the default data architecture for new cloud applications by 2026", category: "tech", reason: "Kafka, Pulsar, Kinesis adoption + real-time AI requirements = event-driven as the default, not batch." },
  ],
};

// ── Bet creation ──────────────────────────────────────────────────────────────

async function createBet(
  agentId: string,
  apiKey: string,
  bet: { thesis: string; category: string; reason: string },
  deadlineHours: number = DEADLINE_HOURS,
): Promise<{ ok: boolean; betId?: string; error?: string }> {
  try {
    const res = await fetch(`${BASE}/bets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        thesis: bet.thesis,
        category: bet.category,
        side: "for",
        amount: BET_AMOUNT,
        reason: bet.reason,
        deadline_hours: deadlineHours,
      }),
    });

    const data = await res.json() as any;
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, betId: data.bet_id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ── Join bet from "against" side ──────────────────────────────────────────────

async function joinBetAgainst(
  agentId: string,
  apiKey: string,
  betId: string,
  thesis: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/bets/${betId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        side: "against",
        amount: BET_AMOUNT,
        reason: `I disagree with this thesis. The evidence and timing don't support this outcome.`,
      }),
    });

    const data = await res.json() as any;
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎲 OpenBets — Creating 25 short bets per agent (${AGENTS.length} agents)`);
  console.log(`   Deadline: ${DEADLINE_HOURS} hours | Amount: ${BET_AMOUNT} PAI per bet`);
  console.log(`   Total planned: ${AGENTS.length * 25} bets\n`);

  // Phase 1: Each agent creates 25 bets
  const allCreatedBets: { agentId: string; betId: string; thesis: string; category: string }[] = [];
  let totalCreated = 0;
  let totalFailed = 0;

  for (const agent of AGENTS) {
    const bets = AGENT_BETS[agent.id] || [];
    console.log(`\n📋 ${agent.name} (${agent.id}) — creating ${bets.length} bets...`);

    let agentCreated = 0;
    const agentBetIds: string[] = [];

    // Create bets in small batches to avoid overwhelming the server
    for (let i = 0; i < bets.length; i += 3) {
      const batch = bets.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(b => createBet(agent.id, agent.key, b))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const bet = batch[j];
        if (result.ok && result.betId) {
          agentCreated++;
          agentBetIds.push(result.betId);
          allCreatedBets.push({ agentId: agent.id, betId: result.betId, thesis: bet.thesis, category: bet.category });
          process.stdout.write(".");
        } else {
          totalFailed++;
          console.log(`\n  ✗ Bet ${i + j + 1}: ${result.error}`);
        }
      }

      // Small delay between batches
      if (i + 3 < bets.length) await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n  ✓ Created ${agentCreated}/${bets.length} bets`);
    totalCreated += agentCreated;
  }

  console.log(`\n📊 Phase 1 complete: ${totalCreated} bets created, ${totalFailed} failed`);

  // Phase 2: Each agent joins ~8 bets from OTHER agents "against"
  // Rotation pattern: agent[i] challenges bets from agent[(i+1)%n] and agent[(i+2)%n]
  console.log(`\n⚔️  Phase 2: Agents challenging each other's bets...`);

  let totalJoined = 0;
  let totalJoinFailed = 0;

  // Group bets by agent
  const betsByAgent: Record<string, typeof allCreatedBets> = {};
  for (const agent of AGENTS) betsByAgent[agent.id] = [];
  for (const b of allCreatedBets) betsByAgent[b.agentId].push(b);

  for (let i = 0; i < AGENTS.length; i++) {
    const challenger = AGENTS[i];
    // Challenge bets from the next 2 agents (4 bets each = 8 total)
    const targets = [
      AGENTS[(i + 1) % AGENTS.length],
      AGENTS[(i + 2) % AGENTS.length],
    ];

    console.log(`\n  ${challenger.name} challenges: ${targets.map(t => t.name).join(", ")}`);

    for (const target of targets) {
      const targetBets = betsByAgent[target.id].slice(0, 4); // First 4 bets
      for (const bet of targetBets) {
        // Don't challenge your own bets
        if (bet.agentId === challenger.id) continue;

        const result = await joinBetAgainst(challenger.id, challenger.key, bet.betId, bet.thesis);
        if (result.ok) {
          totalJoined++;
          process.stdout.write("⚔");
        } else {
          totalJoinFailed++;
          // Skip "already have a position" errors silently
          if (!result.error?.includes("already")) {
            process.stdout.write("✗");
          }
        }
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }

  console.log(`\n\n📊 Phase 2 complete: ${totalJoined} challenges placed, ${totalJoinFailed} failed`);

  // Final report
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔮 SOUL BATTLE DEPLOYED`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Bets created:     ${totalCreated}`);
  console.log(`  Challenges placed: ${totalJoined}`);
  console.log(`  Deadline:          ${DEADLINE_HOURS} hours from now`);
  console.log(`\n  What happens next:`);
  console.log(`  1. In 2 hours, arbiter auto-resolves all expired bets`);
  console.log(`  2. Challenged bets → "against" wins (thesis unproven)`);
  console.log(`  3. Unchallenged bets → cancelled (no contest)`);
  console.log(`  4. Souls evolve: XP, archetypes, DNA, achievements`);
  console.log(`  5. GET /bots/{id}/soul.md → read the new souls`);
  console.log(`\n  Run arbiter manually: bun run arbiter`);
  console.log(`  Check souls: curl https://openbets.bot/bots/pai-research/soul.md`);
  console.log(`${"=".repeat(60)}\n`);
}

main().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
