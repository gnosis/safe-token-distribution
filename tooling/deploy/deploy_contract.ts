import "hardhat-deploy";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getAddressConfig, MERKLE_DISTRO_DEPLOYMENT_SALT } from "../src/config";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name === "mainnet" || hre.network.name === "gnosischain") {
    const [deployer] = await hre.ethers.getSigners();
    const { deterministic } = hre.deployments;

    const [tokenAddress, merkleRoot, ownerAddress] = await deploymentArgs(hre);

    const deploymentConfig = await deterministic("MerkleDistro", {
      from: deployer.address,
      args: [tokenAddress, merkleRoot, ownerAddress],
      log: true,
      salt: MERKLE_DISTRO_DEPLOYMENT_SALT,
    });

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
  const addresses = await getAddressConfig(hre);
  const tokenAddress =
    hre.network.name === "mainnet"
      ? addresses.mainnet.token
      : addresses.gnosis.token;

  const merkleRoot = hre.ethers.constants.HashZero;

  const ownerAddress =
    hre.network.name === "mainnet"
      ? addresses.mainnet.treasurySafe
      : addresses.gnosis.treasurySafe;

  return [tokenAddress, merkleRoot, ownerAddress];
}

export default deploy;
