import { resolve } from "path";
import { BigNumber } from "ethers";
import { config as dotenvConfig } from "dotenv";

import { getSingletonFactoryInfo } from "@gnosis.pm/safe-singleton-factory";

import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import "hardhat-deploy";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
let mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  mnemonic = "test test test test test test test test test test test junk";
  console.info("using bogus mnemonic");
  //throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
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
const deterministicDeployment = (network: string) => {
  const info = getSingletonFactoryInfo(parseInt(network));
  if (!info) return undefined;
  return {
    factory: info.address,
    deployer: info.signerAddress,
    funding: BigNumber.from(info.gasLimit)
      .mul(BigNumber.from(info.gasPrice))
      .toString(),
    signedTx: info.transaction,
  };
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      gnosischain:
        process.env.GNOSISCHAIN_ETHERSCAN_API_KEY ||
        process.env.ETHERSCAN_API_KEY ||
        "",
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
    mainnet: getChainConfig("mainnet"),
    goerli: getChainConfig("goerli"),
    gnosischain: getChainConfig("gnosischain"),
  },
  deterministicDeployment,
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    deployments: "build/deployments",
    deploy: "deploy",
    sources: "contracts",
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
