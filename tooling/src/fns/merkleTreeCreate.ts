import { BigNumber } from "ethers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { Snapshot } from "../types";

export default function (
  snapshot: Snapshot,
): StandardMerkleTree<(string | BigNumber)[]> {
  const leaves = Object.keys(snapshot).map((address) => [
    address,
    snapshot[address],
  ]);

  return StandardMerkleTree.of(leaves, ["address", "uint256"]);
}
