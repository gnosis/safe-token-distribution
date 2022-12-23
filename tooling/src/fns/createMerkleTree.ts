import { BigNumber } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { BalanceMap } from "../types";

export default function (
  snapshot: BalanceMap,
): StandardMerkleTree<(string | BigNumber)[]> {
  const leaves = Object.keys(snapshot).map((address) => [
    address,
    snapshot[address],
  ]);

  return StandardMerkleTree.of(leaves, ["address", "uint256"]);
}
