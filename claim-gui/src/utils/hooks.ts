import { BigNumber } from "ethers";
import { useEffect, useRef } from "react";
import { useContractRead } from "wagmi";
import { select, Selection } from "d3";

import merkleDistroContract from "./merkleDistroContract";

export function useAmountClaimed(account: string | undefined) {
  const result = useContractRead({
    address: merkleDistroContract.address,
    abi: merkleDistroContract.abi,
    functionName: "claimed",
    args: [account],
    enabled: !!account,
  });

  return {
    refetch: result.refetch,
    amountClaimed: (result?.data as BigNumber) || BigNumber.from(0),
  };
}

export function useMerkleRoot() {
  const result = useContractRead({
    address: merkleDistroContract.address,
    abi: merkleDistroContract.abi,
    functionName: "merkleRoot",
    args: [],
  });
  return result?.data || null;
}

export function useD3(
  renderFunc: (
    svgEl: Selection<SVGSVGElement, unknown, null, undefined>,
  ) => void,
  dependencies: any,
) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) renderFunc(select(ref.current));
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies]);

  return ref;
}
