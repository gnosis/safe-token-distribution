import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { SafeToken__factory, VestingPool__factory } from "../typechain";

import { deployMerkleDistro } from "../src/tasks/deploy/merkleDistro";

import fork from "./helpers/fork";
import safeSetOwner from "./helpers/safeSetOwner";
import safeTokenUnpause from "./helpers/safeTokenUnpause";

import { createDistributeTxMainnet } from "../src/fns/createDistributeTx";

import {
  OMNI_MEDIATOR_ADDRESS_MAINNET,
  SAFE_TOKEN_ADDRESS,
  VESTING_BENEFICIARY,
  VESTING_ID,
  VESTING_POOL_ADDRESS,
} from "../src/config";

describe("createDistributeTxMainnet", function () {
  beforeEach(async () => {
    await loadFixture(setup);
  });
  it("correctly executes the encoded multisend tx", async () => {
    const { safeSdk, safeToken, vestingPool, merkleDistro } = await loadFixture(
      setup,
    );

    // PRE-CLAIM checks

    expect(await merkleDistro.merkleRoot()).to.equal(ethers.constants.HashZero);
    expect(await safeToken.balanceOf(merkleDistro.address)).to.equal(0);
    expect(await safeToken.balanceOf(OMNI_MEDIATOR_ADDRESS_MAINNET)).to.equal(
      0,
    );

    const amountToClaim = BigNumber.from("10000000");
    const amountToBridge = BigNumber.from("500000");
    const bytes32Value =
      "0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999";

    const tx = await createDistributeTxMainnet(safeSdk, {
      safeTokenAddress: safeToken.address,
      vestingPoolAddress: vestingPool.address,
      omniMediatorAddress: OMNI_MEDIATOR_ADDRESS_MAINNET,
      distroMainnetAddress: merkleDistro.address,
      distroGCAddress: merkleDistro.address,
      vestingId: VESTING_ID,
      amountToClaim,
      amountToBridge,
      nextMerkleRoot: bytes32Value,
    });
    await safeSdk.executeTransaction(tx);

    // POST-CLAIM checks
    expect(await merkleDistro.merkleRoot()).to.equal(bytes32Value);
    expect(await safeToken.balanceOf(merkleDistro.address)).to.equal(
      amountToClaim,
    );
    expect(await safeToken.balanceOf(OMNI_MEDIATOR_ADDRESS_MAINNET)).to.equal(
      amountToBridge,
    );
  });
});

async function setup() {
  await fork(15914301);

  const [deployer] = await ethers.getSigners();

  const safeAddress = VESTING_BENEFICIARY;
  const safeSdk = await safeSetOwner(safeAddress, deployer);

  const safeToken = SafeToken__factory.connect(
    SAFE_TOKEN_ADDRESS,
    ethers.provider,
  );

  await safeTokenUnpause(safeToken);

  const vestingPool = VestingPool__factory.connect(
    VESTING_POOL_ADDRESS as string,
    ethers.provider,
  );

  const merkleDistro = await deployMerkleDistro(
    hre,
    {
      token: safeToken.address,
      merkleRoot: ethers.constants.HashZero,
      owner: safeAddress,
    },
    deployer,
  );

  return { safeSdk, safeToken, vestingPool, merkleDistro };
}
