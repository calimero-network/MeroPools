import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying DarkPoolSettlement with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  const relayerAddress = deployer.address;
  const DarkPoolSettlement = await ethers.getContractFactory(
    "DarkPoolSettlement"
  );

  console.log("Deploying DarkPoolSettlement...");
  const darkPoolSettlement = await DarkPoolSettlement.deploy(relayerAddress);
  await darkPoolSettlement.waitForDeployment();

  console.log(
    "DarkPoolSettlement deployed to:",
    await darkPoolSettlement.getAddress()
  );
  console.log("Relayer address set to:", relayerAddress);
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
