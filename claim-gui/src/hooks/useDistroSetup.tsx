import { constants } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import { getProvider } from "@wagmi/core";

import { distroSetupByNetwork } from "../config";
import { useNetwork } from "wagmi";

const defaultDistroSetup = {
  isDistroEnabled: false,
  distroAddress: constants.AddressZero,
  tokenAddress: constants.AddressZero,
};

type DistroSetup = {
  isDistroEnabled: boolean;
  distroAddress: string;
  tokenAddress: string;
};

const DistroSetupContext = createContext<DistroSetup>(defaultDistroSetup);

export function DistroSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = useNetwork();

  const [setup, setSetup] = useState<{
    [key: number]: DistroSetup;
  }>(distroSetupByNetwork);

  useEffect(() => {
    loadSetup().then((result) => setSetup(result));
  }, []);

  const value = network.chain?.id
    ? setup[network.chain?.id] || defaultDistroSetup
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
  const provider1 = getProvider({ chainId: 1 });
  const provider5 = getProvider({ chainId: 5 });
  const provider100 = getProvider({ chainId: 100 });

  if (process.env.NODE_ENV === "development") {
    return Promise.all([
      provider1.getCode(distroSetupByNetwork["1"].distroAddress),
      provider5.getCode(distroSetupByNetwork["5"].distroAddress),
      provider100.getCode(distroSetupByNetwork["100"].distroAddress),
    ]).then(([code1, code5, code100]) => ({
      1: {
        ...distroSetupByNetwork[1],
        isDistroEnabled: code1 !== "0x",
      },
      5: {
        ...distroSetupByNetwork[5],
        isDistroEnabled: code5 !== "0x",
      },
      100: {
        ...distroSetupByNetwork[100],
        isDistroEnabled: code100 !== "0x",
      },
    }));
  } else {
    return Promise.all([
      provider1.getCode(distroSetupByNetwork["1"].distroAddress),
      provider100.getCode(distroSetupByNetwork["100"].distroAddress),
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
}
