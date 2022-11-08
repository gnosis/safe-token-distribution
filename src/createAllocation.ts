import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

type Allocation = {
  entries: AllocationEntry[];
  merkleTree: StandardMerkleTree<(string | number)[]>;
};

type AllocationEntry = {
  address: string;
  amount: number;
};

export default function createAllocation(
  entries: AllocationEntry[],
): Allocation {
  const leaves = entries.map(({ address, amount }) => [address, amount]);
  return {
    entries,
    merkleTree: StandardMerkleTree.of(leaves, ["address", "uint256"]),
  };
}
