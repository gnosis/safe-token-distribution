import assert from "assert";
import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryBridgedAddress, queryIsPaused } from "../src/queries/queryToken";
import calculateDistroAddress from "../src/fns/calculateDistroAdress";

import {
  addresses,
  getProviders,
  MERKLE_DISTRO_DEPLOYMENT_SALT,
} from "../src/config";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name === "mainnet" || hre.network.name === "gnosischain") {
    const [deployer] = await hre.ethers.getSigners();
    const { deterministic } = hre.deployments;

    const [tokenAddress, merkleRoot, ownerAddress] = await deploymentArgs(
      await ensureTokenUnpausedAndBridged(hre),
      hre,
    );

    const deploymentConfig = await deterministic("MerkleDistro", {
      from: deployer.address,
      args: [tokenAddress, merkleRoot, ownerAddress],
      log: true,
      salt: MERKLE_DISTRO_DEPLOYMENT_SALT,
    });

    await sanityCheck(deploymentConfig.address, hre);

    console.info("Deployer", deployer.address);
    console.info("Address ", deploymentConfig.address);
    const deployment = await deploymentConfig.deploy();
    console.info(
      "Gas used for token deployment:",
      deployment?.receipt?.gasUsed?.toString(),
    );
    console.info("Token deployed to", deployment.address);
  }
};

async function ensureTokenUnpausedAndBridged(hre: HardhatRuntimeEnvironment) {
  const providers = getProviders(hre);
  const isPaused = await queryIsPaused(addresses, providers);
  if (isPaused) {
    throw new Error("SafeToken is still paused");
  }
  const tokenAddressGC = await queryBridgedAddress(addresses, providers);
  if (!tokenAddressGC) {
    throw new Error("SafeToken not yet Bridged");
  }
  return tokenAddressGC;
}

function deploymentArgs(
  tokenAddressGC: string,
  hre: HardhatRuntimeEnvironment,
) {
  const tokenAddress =
    hre.network.name === "mainnet" ? addresses.mainnet.token : tokenAddressGC;

  const merkleRoot = hre.ethers.constants.HashZero;

  const ownerAddress =
    hre.network.name === "mainnet"
      ? addresses.mainnet.treasurySafe
      : addresses.gnosis.treasurySafe;

  return [tokenAddress, merkleRoot, ownerAddress];
}

async function sanityCheck(
  deployedAtAddress: string,
  hre: HardhatRuntimeEnvironment,
) {
  const tokenAddressGC = await ensureTokenUnpausedAndBridged(hre);

  const chainId = await hre.getChainId();
  const [tokenAddress, merkleRoot, ownerAddress] = deploymentArgs(
    tokenAddressGC,
    hre,
  );

  const distroAddress = calculateDistroAddress(
    chainId,
    tokenAddress,
    merkleRoot,
    ownerAddress,
    MERKLE_DISTRO_DEPLOYMENT_SALT,
  );

  assert(
    distroAddress === deployedAtAddress,
    "Calculated MerkleDistro address does not match hardhat-deploy's predicted address",
  );
}

export default deploy;
