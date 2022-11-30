import { BigNumber } from "ethers";
import { Snapshot } from "../types";

export default function snapshotSum(snapshot: Snapshot): BigNumber {
  return Object.keys(snapshot).reduce(
    (result, address) => result.add(snapshot[address]),
    BigNumber.from(0),
  );
}
