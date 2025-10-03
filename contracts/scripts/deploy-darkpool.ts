import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying DarkPoolSettlement with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  const DarkPoolSettlement = await ethers.getContractFactory(
    "DarkPoolSettlement"
  );

  console.log("Deploying DarkPoolSettlement...");
  const darkPoolSettlement = await DarkPoolSettlement.deploy();
  await darkPoolSettlement.waitForDeployment();

  console.log(
    "DarkPoolSettlement deployed to:",
    await darkPoolSettlement.getAddress()
  );
  console.log("Deployer address:", deployer.address);

  const deployedCode = await deployer.provider.getCode(
    await darkPoolSettlement.getAddress()
  );
  console.log("Contract deployed successfully:", deployedCode.length > 2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
