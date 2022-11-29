import type { MerkleDistro, MerkleDistro__factory } from "../../../typechain";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployMerkleDistro(
  hre: HardhatRuntimeEnvironment,
  args: { token: string; merkleRoot: string; owner: string },
  deployer: Signer,
): Promise<MerkleDistro> {
  const merkleDistroFactory = (await hre.ethers.getContractFactory(
    "MerkleDistro",
  )) as MerkleDistro__factory;

  const merkleDistro = await merkleDistroFactory
    .connect(deployer)
    .deploy(args.token, args.merkleRoot, args.owner);

  await merkleDistro.deployed();

  return merkleDistro;
}
