import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { BigNumber } from "ethers";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMerkleRoot } from "./hooks";

const AllocationContext = createContext<{
  amount: BigNumber;
  proof: string[];
} | null>(null);

export function AllocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allocation, setAllocation] = useState<{
    amount: BigNumber;
    proof: string[];
  } | null>(null);

  const { address } = useAccount();
  const merkleRoot = useMerkleRoot();

  useEffect(() => {
    setAllocation(null);
    if (merkleRoot && address) {
      import(`../../checkpoints/${merkleRoot}.json`).then((result) => {
        const distro = result.default;
        setAllocation(computeProof(distro, address));
      });
    }
  }, [address, merkleRoot]);

  return (
    <AllocationContext.Provider value={allocation}>
      {children}
    </AllocationContext.Provider>
  );
}

export function useAllocation() {
  return useContext(AllocationContext);
}

type Map = {
  [key: string]: string;
};

function computeProof(distribution: Map, address: string) {
  if (!distribution[address]) {
    return null;
  }

  const leaves = Object.keys(distribution).map((address) => [
    address,
    BigNumber.from(distribution[address]),
  ]);

  const index = leaves.findIndex(([_address]) => _address === address);
  const tree = StandardMerkleTree.of(leaves, ["address", "uint256"]);
  return { amount: leaves[index][1] as BigNumber, proof: tree.getProof(index) };
}
