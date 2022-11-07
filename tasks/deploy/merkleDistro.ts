import type {
  ERC20,
  MerkleDistro,
  MerkleDistro__factory,
} from "../../typechain";
import { Signer } from "ethers";
import { ethers } from "hardhat";

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
  token: ERC20,
  merkleRoot: string,
  owner: Signer,
): Promise<MerkleDistro> {
  const ownerAddress = await owner.getAddress();

  const merkleDistroFactory = (await ethers.getContractFactory(
    "MerkleDistro",
  )) as MerkleDistro__factory;

  const merkleDistro = await merkleDistroFactory
    .connect(owner)
    .deploy(token.address, merkleRoot, ownerAddress);

  await merkleDistro.deployed();

  return merkleDistro;
}
