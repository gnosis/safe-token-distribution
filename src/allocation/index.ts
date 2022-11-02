import { BigNumberish } from "ethers";
import { keccak256, solidityPack } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";

type Allocation = {
  entries: AllocationEntry[];
  tree: MerkleTree;
};

type AllocationEntry = {
  address: string;
  amount: number;
};

export function createAllocation(entries: AllocationEntry[]): Allocation {
  const leaves = entries.map(({ address, amount }) => packLeaf(address, amount));

  const tree = new MerkleTree(leaves, keccak256, {
    hashLeaves: true,
    sortPairs: true,
  });

  return {
    entries,
    tree,
  };
}

export function packLeaf(address: string, amount: BigNumberish) {
  return solidityPack(["address", "uint256"], [address, amount]);
}
