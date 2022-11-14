import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { BigNumber } from "ethers";
import { Snapshot } from "./snapshot";

export function createMerkleTree(
  snapshot: Snapshot,
): StandardMerkleTree<(string | BigNumber)[]> {
  const leaves = Object.keys(snapshot).map((address) => [
    address,
    snapshot[address],
  ]);

  return StandardMerkleTree.of(leaves, ["address", "uint256"]);
}
