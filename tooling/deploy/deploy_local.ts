import "hardhat-deploy";

import path from "path";

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { parseUnits } from "ethers/lib/utils";
import { BigNumber } from "@ethersproject/bignumber";

import { saveCheckpoint } from "../src/persistence";

import merkleTreeCreate from "../src/fns/merkleTreeCreate";
import { ERC20Mock__factory } from "../typechain";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();

  if (hre.network.name === "hardhat") {
    const tokenAddress = await deployToken(hre);
    const merkleRoot = createDummyMerkleTree();
    const distroAddress = await deployDistro(tokenAddress, merkleRoot, hre);

    const token = ERC20Mock__factory.connect(tokenAddress, deployer);
    token.mint(distroAddress, BigNumber.from("1000000000"));
  }
};

async function deployToken(hre: HardhatRuntimeEnvironment) {
  const [deployer] = await hre.ethers.getSigners();
  const { deployments } = hre;

  const { deterministic } = deployments;
  const result = await deterministic("ERC20Mock", {
    from: deployer.address,
    args: [parseUnits("500000000", "ether")],
    log: true,
    salt: "0x00000000000000000000000000000000000000000000000000000000236dd1d0",
  });

  await result.deploy();

  return result.address;
}

async function deployDistro(
  tokenAddress: string,
  merkleRoot: string,
  hre: HardhatRuntimeEnvironment,
) {
  const [deployer] = await hre.ethers.getSigners();
  const { deployments } = hre;

  const { deterministic } = deployments;

  const result = await deterministic("MerkleDistro", {
    from: deployer.address,
    args: [tokenAddress, merkleRoot, tokenAddress],
    log: true,
    salt: "0x00000000000000000000000000000000000000000000000000000000236dd1d0",
  });

  await result.deploy();

  return result.address;
}

export default deploy;

function createDummyMerkleTree() {
  const checkpoint = {
    "0x485E60C486671E932fd9C53d4110cdEab1E7F0eb": BigNumber.from("10000"),
    "0x031487A94a58b6E438A571256C0bD9093B564a86": BigNumber.from("10000"),
  };

  const tree = merkleTreeCreate(checkpoint);
  saveCheckpoint(
    checkpoint,
    tree,
    path.resolve(path.join(__dirname, "..", "..", "claim-gui", "checkpoints")),
  );
  return tree.root;
}
