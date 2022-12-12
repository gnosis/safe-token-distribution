import assert from "assert";
import { BigNumber } from "ethers";
import hre from "hardhat";
import createMerkleTree from "../src/fns/createMerkleTree";
import { saveCheckpoint } from "../src/persistence";
import { MerkleDistro__factory, ERC20Mock__factory } from "../typechain";

const DISTRO_ADDRESS = "0x6714Ce481312B5179Ad1Fc4904E6F723280470A3";
const TOKEN_ADDRESS = "0x4448ce2eE8B543ee8c18478380cA1fa747bA12AB";
const FUNDS_BUMP = hre.ethers.utils.parseUnits("100000", "ether");

fundAndWriteNewCheckpoint(FUNDS_BUMP);

async function fundAndWriteNewCheckpoint(bump: BigNumber) {
  const signer = getDistroOwnerSigner();
  console.log(signer.address);

  const merkleDistro = MerkleDistro__factory.connect(DISTRO_ADDRESS, signer);
  const token = ERC20Mock__factory.connect(TOKEN_ADDRESS, signer);

  const balance = await token.balanceOf(merkleDistro.address);
  const total = bump.add(bump);

  if (total.gt(balance)) {
    await token.mint(merkleDistro.address, total);
  }

  const checkpoint = {
    "0x485E60C486671E932fd9C53d4110cdEab1E7F0eb": bump,
    "0x031487A94a58b6E438A571256C0bD9093B564a86": bump,
  };
  const tree = createMerkleTree(checkpoint);
  saveCheckpoint(checkpoint, tree);

  await merkleDistro.setMerkleRoot(tree.root);
}

export async function deployDistro() {
  const signer = getDistroOwnerSigner();
  console.log(signer.address);

  const factory = await hre.ethers.getContractFactory("MerkleDistro", signer);
  const result = await factory.deploy(
    "0x4448ce2eE8B543ee8c18478380cA1fa747bA12AB",
    hre.ethers.constants.HashZero,
    signer.address,
  );

  console.log(result.address);
}

export async function deployToken() {
  const signer = getDistroOwnerSigner();
  console.log(signer.address);

  const factory = await hre.ethers.getContractFactory("ERC20Mock", signer);
  const result = await factory.deploy(1);

  console.log(result.address);
}

function getDistroOwnerSigner() {
  assert(hre.network.name === "goerli", "HH network isn't goerli");

  if (!process.env.GOERLI_DISTRO_OWNER_MNEMONIC) {
    throw new Error("Couldn't find the distro owner in .env");
  }
  const wallet = hre.ethers.Wallet.fromMnemonic(
    process.env.GOERLI_DISTRO_OWNER_MNEMONIC,
  );
  const signer = wallet.connect(hre.ethers.provider);

  return signer;
}
