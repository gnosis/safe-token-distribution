import { SafeToken, SafeToken__factory } from "../../typechain";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

export default async function unpauseSafeToken(safeToken: SafeToken) {
  const owner = await safeToken.owner();
  await setBalance(owner, parseUnits("100", "ether"));
  const impersonatedOwner = await ethers.getImpersonatedSigner(owner);

  const safeTokenPatched = SafeToken__factory.connect(
    safeToken.address,
    impersonatedOwner,
  );

  const isPaused = await safeTokenPatched.paused();

  if (isPaused) {
    await safeTokenPatched.unpause();
  }
}
