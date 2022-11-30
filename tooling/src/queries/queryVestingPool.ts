import { BigNumber } from "ethers";
import { Provider } from "@ethersproject/providers";

import { VestingPool__factory } from "../../typechain";

export async function queryAmountVested(
  vestingPoolAddress: string,
  vestingId: string,
  blockNumber: number,
  provider: Provider,
): Promise<BigNumber> {
  const iface = VestingPool__factory.createInterface();

  const data = await iface.encodeFunctionData("calculateVestedAmount", [
    vestingId,
  ]);

  const result = await provider.call(
    { to: vestingPoolAddress, data },
    blockNumber,
  );

  const { vestedAmount } = iface.decodeFunctionResult(
    "calculateVestedAmount",
    result,
  );

  return vestedAmount;
}

export async function queryAmountToClaim(
  vestingPoolAddress: string,
  vestingId: string,
  blockNumber: number,
  provider: Provider,
): Promise<BigNumber> {
  const iface = VestingPool__factory.createInterface();

  const data = await iface.encodeFunctionData("calculateVestedAmount", [
    vestingId,
  ]);

  const result = await provider.call(
    { to: vestingPoolAddress, data },
    blockNumber,
  );

  const { vestedAmount, claimedAmount } = iface.decodeFunctionResult(
    "calculateVestedAmount",
    result,
  );

  return vestedAmount.sub(claimedAmount);
}
