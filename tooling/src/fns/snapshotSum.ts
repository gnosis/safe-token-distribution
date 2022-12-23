import { BigNumber } from "ethers";
import { BalanceMap } from "../types";

export default function snapshotSum(snapshot: BalanceMap): BigNumber {
  return Object.keys(snapshot).reduce(
    (result, address) => result.add(snapshot[address]),
    BigNumber.from(0),
  );
}
