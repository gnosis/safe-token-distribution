import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

import createClaimTransaction from "../src/createClaimTransaction";
import { deployMerkleDistro } from "../src/tasks/deploy/merkleDistro";
import { SafeToken__factory, VestingPool__factory } from "../typechain";
import fork from "./helpers/fork";
import safeSetOwner from "./helpers/safeSetOwner";
import safeTokenUnpause from "./helpers/safeTokenUnpause";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import assert from "assert";

const VESTING_ID =
  "0x501becc139a20ff5e3d4cfccde5f0d3ca1267319a1c0bd9bfb8b813ae9e3e042";
const VESTING_BENEFICIARY = "0x1C8526D7b0F9B6b24Efeae8f21a97E73F4d4bEc2";

describe("createClaimTransaction", function () {
  beforeEach(async () => {
    await loadFixture(setup);
  });
  it("correctly executes the encoded multisend tx", async () => {
    const { safeSdk, safeToken, vestingPool, merkleDistro } = await loadFixture(
      setup,
    );

    // PRE-CLAIM checks
    const safeAddress = await safeSdk.getAddress();
    expect(await safeToken.balanceOf(safeAddress)).to.equal(0);
    expect(await merkleDistro.merkleRoot()).to.equal(ethers.constants.HashZero);

    const amountToClaim = BigNumber.from("10000");
    const bytes32Value =
      "0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999";

    // CLAIM
    const tx = await createClaimTransaction(
      safeSdk,
      {
        safeToken,
        vestingPool,
        merkleDistro,
      },
      {
        vestingId: VESTING_ID,
        amountToClaim,
        nextMerkleRoot: bytes32Value,
      },
    );
    await safeSdk.executeTransaction(tx);

    // POST-CLAIM checks
    expect(await safeToken.balanceOf(merkleDistro.address)).to.equal(
      amountToClaim,
    );
    expect(await merkleDistro.merkleRoot()).to.equal(bytes32Value);
  });
});

async function setup() {
  await fork(15914301);

  const [deployer] = await ethers.getSigners();

  const safeAddress = VESTING_BENEFICIARY;
  const safeSdk = await safeSetOwner(safeAddress, deployer);

  assert(process.env.SAFE_TOKEN_ADDRESS);

  const safeToken = SafeToken__factory.connect(
    process.env.SAFE_TOKEN_ADDRESS as string,
    ethers.provider,
  );

  await safeTokenUnpause(safeToken);

  assert(process.env.VESTING_POOL_ADDRESS);
  const vestingPool = VestingPool__factory.connect(
    process.env.VESTING_POOL_ADDRESS as string,
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
