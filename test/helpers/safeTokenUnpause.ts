import { SAFE_TOKEN } from "../../src/constants";
import { Provider } from "@ethersproject/providers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { Contract } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

export default async function unpauseSafeToken(provider: Provider) {
  const safeToken = new Contract(SAFE_TOKEN.address, SAFE_TOKEN.abi, provider);
  const owner = await safeToken.owner();
  await setBalance(owner, parseUnits("100", "ether"));
  const impersonatedOwner = await ethers.getImpersonatedSigner(owner);
  await new Contract(
    SAFE_TOKEN.address,
    SAFE_TOKEN.abi,
    impersonatedOwner,
  ).unpause();
}
