import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  console.log("Accounts derived from mnemonic:");
  console.log("===============================");

  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i];
    const address = await signer.getAddress();
    const balance = await signer.provider.getBalance(address);

    console.log(`Account ${i}: ${address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} VET`);
    console.log("---");
  }

  console.log(
    "\nMnemonic used:",
    "length salon ship wasp label tooth foil matrix monkey bacon mean conduct"
  );
}

main().catch(console.error);
