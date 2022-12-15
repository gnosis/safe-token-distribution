import assert from "assert";
import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { queryBridgedAddress } from "../src/queries/queryToken";
import calculateDistroAddress from "../src/fns/calculateDistroAdress";

import {
  addresses,
  getProviders,
  MERKLE_DISTRO_DEPLOYMENT_SALT,
} from "../src/config";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name === "mainnet" || hre.network.name === "gnosis") {
    const [deployer] = await hre.ethers.getSigners();
    const { deterministic } = hre.deployments;

    const { isTokenReady } = await hre.run("status", { silent: true });

    if (!isTokenReady) {
      throw new Error(
        "SafeToken still paused, or not yet bridged. Run status for more info",
      );
    }

    const [tokenAddress, merkleRoot, ownerAddress] = await deploymentArgs(hre);

    const deploymentConfig = await deterministic("MerkleDistro", {
      from: deployer.address,
      args: [tokenAddress, merkleRoot, ownerAddress],
      log: true,
      salt: MERKLE_DISTRO_DEPLOYMENT_SALT,
    });

    const distroAddress = calculateDistroAddress(
      await hre.getChainId(),
      tokenAddress,
      merkleRoot,
      ownerAddress,
      MERKLE_DISTRO_DEPLOYMENT_SALT,
    );

    assert(
      distroAddress === deploymentConfig.address,
      "Calculated MerkleDistro address does not match hardhat-deploy's address",
    );

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

async function deploymentArgs(hre: HardhatRuntimeEnvironment) {
  const providers = getProviders(hre);

  const tokenAddress =
    hre.network.name === "mainnet"
      ? addresses.mainnet.token
      : await queryBridgedAddress(addresses, providers);

  assert(!!tokenAddress && tokenAddress !== hre.ethers.constants.AddressZero);

  const merkleRoot = hre.ethers.constants.HashZero;

  const ownerAddress =
    hre.network.name === "mainnet"
      ? addresses.mainnet.treasurySafe
      : addresses.gnosis.treasurySafe;

  return [tokenAddress, merkleRoot, ownerAddress];
}

export default deploy;
