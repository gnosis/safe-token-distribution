import { createAllocation } from "../src/allocation";
import { deployMerkleDistro } from "../tasks/deploy/merkleDistro";
import { ERC20Mock__factory } from "../typechain";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("MerkleDistro", function () {
  before(async () => {
    // by invoking this once, we avoid having one test bearing the most penalty for loading
    await loadFixture(setup);
  });

  it("simple claim", async () => {
    const { merkleDistro, token } = await loadFixture(setup);

    const [admin, claimer1, claimer2, claimer3] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: claimer1.address, amount: 1000 },
      { address: claimer2.address, amount: 700 },
      { address: claimer3.address, amount: 300 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);
    expect(await token.balanceOf(claimer1.address)).to.equal(0);
    expect(await token.balanceOf(claimer2.address)).to.equal(0);
    expect(await token.balanceOf(claimer3.address)).to.equal(0);

    const proof1 = allocation.tree.getProof([claimer1.address, 1000]);
    const proof2 = allocation.tree.getProof([claimer2.address, 700]);
    const proof3 = allocation.tree.getProof([claimer3.address, 300]);
    await merkleDistro.connect(claimer1).claim(proof1, 1000);
    expect(await token.balanceOf(claimer1.address)).to.equal(1000);
    await merkleDistro.connect(claimer2).claim(proof2, 700);
    expect(await token.balanceOf(claimer2.address)).to.equal(700);
    await merkleDistro.connect(claimer3).claim(proof3, 300);
    expect(await token.balanceOf(claimer3.address)).to.equal(300);
  });

  it("simple claim emits event", async () => {
    const { merkleDistro } = await loadFixture(setup);
    const [admin, claimer1, claimer2] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: claimer1.address, amount: 500 },
      { address: claimer2.address, amount: 300 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);

    const proof = allocation.tree.getProof([claimer1.address, 500]);
    await expect(merkleDistro.connect(claimer1).claim(proof, 500))
      .to.emit(merkleDistro, "Claimed")
      .withArgs(claimer1.address, 500);
  });

  it("reverts on claimer✅ proof✅ allocation🤡", async () => {
    const { merkleDistro } = await loadFixture(setup);
    const [admin, claimer1, claimer2] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: claimer1.address, amount: 800 },
      { address: claimer2.address, amount: 400 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);

    const goodAmount = 800;
    const badAmount = 100;

    const proof = allocation.tree.getProof([claimer1.address, goodAmount]);
    await expect(
      merkleDistro.connect(claimer1).claim(proof, badAmount),
    ).to.revertedWith("Invalid Allocation Proof");

    await expect(merkleDistro.connect(claimer1).claim(proof, goodAmount)).to.not
      .be.reverted;
  });

  it("reverts on claimer✅ proof🤡 allocation✅", async () => {
    const { merkleDistro } = await loadFixture(setup);
    const [admin, claimer1, claimer2] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: claimer1.address, amount: 800 },
      { address: claimer2.address, amount: 400 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);

    const amount = 800;
    const badProof = [ethers.constants.HashZero];
    const goodProof = allocation.tree.getProof([claimer1.address, amount]);

    await expect(
      merkleDistro.connect(claimer1).claim(badProof, amount),
    ).to.revertedWith("Invalid Allocation Proof");
    await expect(merkleDistro.connect(claimer1).claim(goodProof, amount)).to.not
      .be.reverted;
  });

  it("reverts on claimer🤡 proof✅ allocation✅", async () => {
    const { merkleDistro } = await loadFixture(setup);
    const [admin, claimer1, claimer2] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: claimer1.address, amount: 1000 },
      { address: claimer2.address, amount: 200 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);

    const allocated = 200;
    const wrongClaimer = claimer1;
    const rightClaimer = claimer2;

    const proof = allocation.tree.getProof([rightClaimer.address, allocated]);

    await expect(
      merkleDistro.connect(wrongClaimer).claim(proof, allocated),
    ).to.revertedWith("Invalid Allocation Proof");
    await expect(merkleDistro.connect(rightClaimer).claim(proof, allocated)).to
      .not.be.reverted;
  });
});

async function setup() {
  const [owner] = await ethers.getSigners();

  const token = await deployMockToken(owner);
  const merkleDistro = await deployMerkleDistro(
    token,
    ethers.constants.HashZero,
    owner,
  );

  await token
    .connect(owner)
    .transfer(merkleDistro.address, await token.totalSupply());

  return { merkleDistro, token };
}

async function deployMockToken(owner: Signer) {
  const erc20Factory = (await ethers.getContractFactory(
    "ERC20Mock",
  )) as ERC20Mock__factory;
  const token = await erc20Factory.connect(owner).deploy(10000);
  await token.deployed();
  return token;
}
