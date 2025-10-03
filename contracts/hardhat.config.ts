import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@vechain/sdk-hardhat-plugin";

require("dotenv").config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "paris",
        },
      },
    ],
  },
  networks: {
    vechain_testnet: {
      url: process.env.VECHAIN_TESTNET_URL || "https://testnet.vechain.org",
      accounts: {
        mnemonic: process.env.MNEMONIC || "",
        count: 3,
        initialIndex: 0,
      },
      // Gas sponsorship disabled - using deployer's VTHO for gas
      // gasPayer: {
      //   gasPayerServiceUrl:
      //     process.env.GAS_PAYER_SERVICE_URL ||
      //     "https://sponsor-testnet.vechain.energy/by/937",
      // },
    } as any,
  },
};

export default config;
