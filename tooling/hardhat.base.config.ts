import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";

import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const safeTokenAddress: string | undefined = process.env.SAFE_TOKEN_ADDRESS;
if (!safeTokenAddress) {
  throw new Error("Please set your SAFE_TOKEN_ADDRESS in a .env file");
}

const vestingPoolAddress: string | undefined = process.env.VESTING_POOL_ADDRESS;
if (!vestingPoolAddress) {
  throw new Error("Please set your VESTING_POOL_ADDRESS in a .env file");
}

const chainIds = {
  mainnet: 1,
  goerli: 5,
  gnosischain: 100,
  hardhat: 31337,
  local: 31337,
};

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string;
  switch (chain) {
    case "gnosischain":
      jsonRpcUrl = "https://rpc.gnosischain.com";
      break;
    case "local":
      jsonRpcUrl = "http://127.0.0.1:8545/";
      break;
    default:
      jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
  }
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    local: getChainConfig("local"),
    mainnet: getChainConfig("mainnet"),
    goerli: getChainConfig("goerli"),
    gnosischain: getChainConfig("gnosischain"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.17",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
