import type { MerkleDistro, MerkleDistro__factory } from "../../typechain";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// import { task } from "hardhat/config";
// import type { TaskArguments } from "hardhat/types";

// task("deploy:MerkleDistro")
//   .addParam("greeting", "Say hello, be nice")
//   .setAction(async function (taskArguments: TaskArguments, { ethers }) {
//     const signers: SignerWithAddress[] = await ethers.getSigners();
//     const greeterFactory = await ethers.getContractFactory("Greeter");
//     const greeter = await greeterFactory
//       .connect(signers[0])
//       .deploy(taskArguments.greeting);
//     await greeter.deployed();
//     console.log("Greeter deployed to: ", greeter.address);
//   });

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
