import assert from "assert";
import { BigNumber } from "ethers";
import { Provider } from "@ethersproject/providers";

import { loadSchedule } from "../persistence";
import { VestingPool__factory } from "../../typechain";

export default async function queryVestedInInterval(
  vestingContract: string,
  vestingId: string,
  blockNumber: number,
  provider: Provider,
): Promise<BigNumber> {
  const schedule = loadSchedule();
  const index = schedule.findIndex(
    (entry) => entry.mainnet.blockNumber === blockNumber,
  );

  assert(index !== -1);

  const prevEntry = index !== 0 ? schedule[index - 1] : null;
  const nextEntry = schedule[index];

  const [prevTotalVested, nextTotalVested] = await Promise.all([
    prevEntry
      ? queryTotalVested(
          vestingContract,
          vestingId,
          prevEntry.mainnet.blockNumber,
          provider,
        )
      : 0,
    queryTotalVested(
      vestingContract,
      vestingId,
      nextEntry.mainnet.blockNumber,
      provider,
    ),
  ]);

  assert(nextTotalVested.gte(prevTotalVested));

  return nextTotalVested.sub(prevTotalVested);
}

async function queryTotalVested(
  vestingContract: string,
  vestingId: string,
  blockNumber: number,
  provider: Provider,
): Promise<BigNumber> {
  const iface = VestingPool__factory.createInterface();

  const data = await iface.encodeFunctionData("calculateVestedAmount", [
    vestingId,
  ]);

  const result = await provider.call(
    { to: vestingContract, data },
    blockNumber,
  );

  const { vestedAmount } = iface.decodeFunctionResult(
    "calculateVestedAmount",
    result,
  );

  return vestedAmount;
}
