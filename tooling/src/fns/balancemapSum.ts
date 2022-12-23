import { BigNumber } from "ethers";
import { BalanceMap } from "../types";

export default function balancemapSum(map: BalanceMap): BigNumber {
  return Object.keys(map).reduce(
    (result, address) => result.add(map[address]),
    BigNumber.from(0),
  );
}
