import { ethers } from "hardhat";

async function deployDarkPoolSettlement() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DarkPoolSettlement with account:", deployer.address);

  const defaultRelayer = "0xbc3C25803e9dBc9D476D42dc0628DBA7016617Bb";
  const DarkPoolSettlement = await ethers.getContractFactory(
    "DarkPoolSettlement"
  );
  const darkPoolSettlement = await DarkPoolSettlement.deploy(defaultRelayer);
  await darkPoolSettlement.waitForDeployment();

  console.log(
    "DarkPoolSettlement deployed to:",
    await darkPoolSettlement.getAddress()
  );

  return { darkPoolSettlement };
}

export { deployDarkPoolSettlement };

if (require.main === module) {
  deployDarkPoolSettlement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
