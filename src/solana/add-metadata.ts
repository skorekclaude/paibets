/**
 * Add Metaplex metadata to PAI Coin
 *
 * Usage:
 *   bun run src/solana/add-metadata.ts
 *
 * Reads mint authority from ~/.paibets/token-config.json
 * Adds on-chain name/symbol/URI so wallets show "PAI Coin" properly
 */

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  keypairIdentity,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_FILE = join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".paibets",
  "token-config.json"
);

// Metadata hosted on GitHub (permanent enough for now, can migrate to Arweave later)
const METADATA_URI =
  "https://raw.githubusercontent.com/skorekclaude/openbets/master/assets/metadata.json";

async function main() {
  if (!existsSync(CONFIG_FILE)) {
    console.error("❌ ~/.paibets/token-config.json not found — run setup-token first");
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  const { tokenMint, network, serverWallets } = config;

  console.log(`\n🪙  PAI Coin — Add Metaplex Metadata`);
  console.log(`   Network:  ${network}`);
  console.log(`   Mint:     ${tokenMint}`);
  console.log(`   Metadata: ${METADATA_URI}\n`);

  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    (network === "mainnet-beta"
      ? "https://api.mainnet-beta.solana.com"
      : "https://api.devnet.solana.com");

  // Setup UMI
  const umi = createUmi(rpcUrl).use(mplTokenMetadata());

  // Load mint authority keypair
  const secretKey = Uint8Array.from(serverWallets.mintAuthority.secretKey);
  const mintAuthority = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(mintAuthority));

  const mint = umiPublicKey(tokenMint);

  console.log("📝 Creating metadata account...");

  try {
    const tx = await createMetadataAccountV3(umi, {
      mint,
      mintAuthority: mintAuthority,
      payer: mintAuthority,
      updateAuthority: mintAuthority,
      data: {
        name: "PAI Coin",
        symbol: "PAI",
        uri: METADATA_URI,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,  // can update logo/URI later
      collectionDetails: null,
    }).sendAndConfirm(umi);

    console.log(`\n✅ Metadata added successfully!`);
    console.log(`   Token name: PAI Coin`);
    console.log(`   Symbol:     PAI`);
    console.log(`   URI:        ${METADATA_URI}`);
    console.log(`\n   View on Solscan: https://solscan.io/token/${tokenMint}`);
    console.log(
      `   Phantom will now show "PAI Coin" instead of the raw address.\n`
    );
  } catch (e: any) {
    if (e?.message?.includes("already in use")) {
      console.log("⚠️  Metadata account already exists.");
      console.log("   To update it, run: bun run src/solana/update-metadata.ts");
    } else {
      throw e;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
