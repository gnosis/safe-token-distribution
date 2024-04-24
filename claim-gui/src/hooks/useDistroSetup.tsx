import { constants } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";

import { distroSetupByNetwork } from "../config";
import { useChainId } from "wagmi";
import { config } from "..";
import { getBytecode } from "@wagmi/core";

const defaultDistroSetup = {
  isDistroEnabled: false,
  distroAddress: constants.AddressZero as `0x${string}`,
  tokenAddress: constants.AddressZero as `0x${string}`,
};

type DistroSetup = {
  isDistroEnabled: boolean;
  distroAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
};

const DistroSetupContext = createContext<DistroSetup>(defaultDistroSetup);

export function DistroSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const chainId = useChainId();

  const [setup, setSetup] = useState<{
    [key: number]: DistroSetup;
  }>(distroSetupByNetwork);

  useEffect(() => {
    loadSetup().then((result) => setSetup(result));
  }, []);

  const value = chainId
    ? setup[chainId] || defaultDistroSetup
    : defaultDistroSetup;

  return (
    <DistroSetupContext.Provider value={value}>
      {children}
    </DistroSetupContext.Provider>
  );
}

export default function useDistroSetup() {
  return useContext(DistroSetupContext);
}

function loadSetup() {
  return Promise.all([
    getBytecode(config, { address: distroSetupByNetwork["1"].distroAddress }),
    getBytecode(config, { address: distroSetupByNetwork["100"].distroAddress }),
  ]).then(([code1, code100]) => ({
    1: {
      ...distroSetupByNetwork[1],
      isDistroEnabled: code1 !== "0x",
    },
    100: {
      ...distroSetupByNetwork[100],
      isDistroEnabled: code100 !== "0x",
    },
  }));
}
