import { ethers } from "hardhat";

import type { ERC20, ERC20Mock__factory, MerkleDistro, MerkleDistro__factory } from "../../types";

async function deployToken() {
  const signers = await ethers.getSigners();
  const [admin] = signers;

  const erc20Factory = <ERC20Mock__factory>await ethers.getContractFactory("ERC20Mock");
  const token = await erc20Factory.connect(admin).deploy(10000);
  await token.deployed();
  return token;
}

export async function deployMerkleDistroFixture(): Promise<{ merkleDistro: MerkleDistro; token: ERC20 }> {
  const signers = await ethers.getSigners();
  const [admin] = signers;

  const token = await deployToken();

  const merkleDistroFactory = <MerkleDistro__factory>await ethers.getContractFactory("MerkleDistro");
  const merkleDistro = await merkleDistroFactory
    .connect(admin)
    .deploy(token.address, ethers.constants.HashZero, admin.address);
  await merkleDistro.deployed();

  await token.connect(admin).transfer(merkleDistro.address, await token.totalSupply());

  return { merkleDistro, token };
}
