import { encodeClaim, queryTokensToClaim } from "../src/claiming";
import { SAFE_TOKEN, VESTING_CONTRACT } from "../src/constants";
import fork from "./helpers/fork";
import safeSetOwner from "./helpers/safeSetOwner";
import safeTokenUnpause from "./helpers/safeTokenUnpause";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

const VESTING_ID =
  "0x501becc139a20ff5e3d4cfccde5f0d3ca1267319a1c0bd9bfb8b813ae9e3e042";
const VESTING_BENEFICIARY = "0x1C8526D7b0F9B6b24Efeae8f21a97E73F4d4bEc2";

describe("Claiming", function () {
  beforeEach(async () => {
    await fork(15914301);
  });
  it("claim vested tokens", async () => {
    const [signer] = await ethers.getSigners();

    await safeTokenUnpause(ethers.provider);

    const safeAddress = VESTING_BENEFICIARY;
    const safeSdk = await safeSetOwner(safeAddress, signer);
    const safeToken = new Contract(
      SAFE_TOKEN.address,
      SAFE_TOKEN.abi,
      ethers.provider,
    );
    const tokensToClaim = await queryTokensToClaim(
      VESTING_CONTRACT.address,
      VESTING_ID,
      ethers.provider,
    );

    expect(await safeToken.balanceOf(safeAddress)).to.equal(0);
    const safeTransactionData = await encodeClaim(
      VESTING_CONTRACT.address,
      VESTING_ID,
      safeAddress,
      tokensToClaim,
    );

    const tx = await safeSdk.createTransaction({ safeTransactionData });
    await safeSdk.executeTransaction(tx);

    expect(await safeToken.balanceOf(safeAddress)).to.equal(tokensToClaim);
  });
  it("claim vested tokens", async () => {
    const [signer] = await ethers.getSigners();

    await safeTokenUnpause(ethers.provider);

    const safeAddress = VESTING_BENEFICIARY;
    const safeSdk = await safeSetOwner(safeAddress, signer);
    const safeToken = new Contract(
      SAFE_TOKEN.address,
      SAFE_TOKEN.abi,
      ethers.provider,
    );
    const tokensToClaim = await queryTokensToClaim(
      VESTING_CONTRACT.address,
      VESTING_ID,
      ethers.provider,
    );

    expect(await safeToken.balanceOf(safeAddress)).to.equal(0);
    const safeTransactionData = await encodeClaim(
      VESTING_CONTRACT.address,
      VESTING_ID,
      safeAddress,
      tokensToClaim,
    );

    const tx = await safeSdk.createTransaction({ safeTransactionData });
    await safeSdk.executeTransaction(tx);

    expect(await safeToken.balanceOf(safeAddress)).to.equal(tokensToClaim);
  });
});
