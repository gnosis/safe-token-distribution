import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { createAllocation } from "../../src/allocation";
import { deployMerkleDistroFixture } from "./MerkleDistro.fixture";

describe("MerkleDistro", function () {
  it("performs simple claiming", async () => {
    const { merkleDistro, token } = await loadFixture(deployMerkleDistroFixture);
    const [admin, signer1, signer2, signer3] = await ethers.getSigners();
    const allocation = createAllocation([
      { address: signer1.address, amount: 1000 },
      { address: signer2.address, amount: 700 },
      { address: signer3.address, amount: 300 },
    ]);
    await merkleDistro.connect(admin).setMerkleRoot(allocation.tree.root);
    expect(await token.balanceOf(signer1.address)).to.equal(0);
    expect(await token.balanceOf(signer2.address)).to.equal(0);
    expect(await token.balanceOf(signer3.address)).to.equal(0);

    const proof1 = allocation.tree.getProof([signer1.address, 1000]);
    const proof2 = allocation.tree.getProof([signer2.address, 700]);
    const proof3 = allocation.tree.getProof([signer3.address, 300]);
    await merkleDistro.connect(signer1).claim(proof1, 1000);
    expect(await token.balanceOf(signer1.address)).to.equal(1000);
    await merkleDistro.connect(signer2).claim(proof2, 700);
    expect(await token.balanceOf(signer2.address)).to.equal(700);
    await merkleDistro.connect(signer3).claim(proof3, 300);
    expect(await token.balanceOf(signer3.address)).to.equal(300);
  });
});
