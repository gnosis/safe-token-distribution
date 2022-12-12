import React, { createContext, useContext, useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { useAccount, useContractRead, useNetwork } from "wagmi";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import { distroSetup } from "../config";

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

  const network = useNetwork();
  const { address } = useAccount();
  const { isDistroEnabled, distroAddress } = distroSetup(network);

  const result = useContractRead({
    address: distroAddress,
    abi: MerkleDistroABI,
    functionName: "merkleRoot",
    enabled: isDistroEnabled,
  });

  const merkleRoot = result?.data;

  useEffect(() => {
    setAllocation(null);
    if (shouldLazyLoad(merkleRoot, address)) {
      import(`../../checkpoints/${merkleRoot}.json`).then((result) => {
        const distro = result.default;
        setAllocation(computeProof(distro, address as string));
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

function computeProof(
  distribution: Map,
  address: string,
): AllocationEntry | null {
  if (!distribution[address]) {
    return null;
  }

  const leaves = Object.keys(distribution).map((address) => [
    address,
    BigNumber.from(distribution[address]),
  ]);

  const index = leaves.findIndex(([_address]) => _address === address);
  const tree = StandardMerkleTree.of(leaves, ["address", "uint256"]);
  return {
    amount: leaves[index][1] as BigNumber,
    proof: tree.getProof(index) as `0x${string}`[],
  };
}

function shouldLazyLoad(
  merkleRoot: string | undefined,
  address: string | undefined,
) {
  return (
    !!merkleRoot &&
    merkleRoot !== constants.HashZero &&
    !!address &&
    address !== constants.AddressZero
  );
}
