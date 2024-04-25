import React, { createContext, useContext, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { useAccount, useReadContract } from "wagmi";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import useDistroSetup from "./useDistroSetup";

import MerkleDistroABI from "../abis/MerkleDistro";

type AllocationEntry = {
  amount: BigNumber;
  proof: readonly `0x${string}`[];
};

const AllocationContext = createContext<AllocationEntry | null>(null);

export function AllocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [allocation, setAllocation] = useState<AllocationEntry | null>(null);

  const { address } = useAccount();
  const { distroAddress } = useDistroSetup();

  const result = useReadContract({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "merkleRoot",
  });

  const merkleRoot = result?.data;

  useEffect(() => {
    setAllocation(null);
    lazyLoad(merkleRoot, address).then((distribution) => {
      if (distribution) {
        setAllocation(computeProof(distribution, address as string));
      }
    });
  }, [address, merkleRoot]);

  return (
    <AllocationContext.Provider value={allocation}>
      {children}
    </AllocationContext.Provider>
  );
}

export default function useAllocation() {
  return useContext(AllocationContext);
}

type Map = {
  [key: string]: string;
};

function computeProof(
  distribution: Map,
  address: string,
): AllocationEntry | null {
  const addressLowerCase = address.toLowerCase();

  if (!distribution[addressLowerCase]) {
    console.log(`Address (${addressLowerCase}) not found in distribution`);
    return null;
  }

  const leaves = Object.keys(distribution).map((address) => [
    address,
    BigNumber.from(distribution[addressLowerCase]),
  ]);

  const index = leaves.findIndex(([_address]) => _address === addressLowerCase);
  const tree = StandardMerkleTree.of(leaves, ["address", "uint256"]);
  return {
    amount: leaves[index][1] as BigNumber,
    proof: tree.getProof(index) as `0x${string}`[],
  };
}

async function lazyLoad(
  merkleRoot: string | undefined,
  address: string | undefined,
) {
  const shouldLoad =
    !!merkleRoot &&
    merkleRoot !== constants.HashZero &&
    !!address &&
    address !== constants.AddressZero;

  return shouldLoad
    ? import(`../../../tooling/_harvest/checkpoints/${merkleRoot}.json`).then(
        (result) => {
          const distribution = result.default;
          return distribution;
        },
      )
    : null;
}
