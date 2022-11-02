import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

type Allocation = {
  entries: AllocationEntry[];
  tree: StandardMerkleTree<(string | number)[]>;
};

type AllocationEntry = {
  address: string;
  amount: number;
};

export function createAllocation(entries: AllocationEntry[]): Allocation {
  const leaves = entries.map(({ address, amount }) => [address, amount]);

  const tree = StandardMerkleTree.of(leaves, ["address", "uint256"]);
  return {
    entries,
    tree,
  };
}
