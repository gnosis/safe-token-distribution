import { Chain } from "wagmi";

export const gnosis: Chain = {
  id: 100,
  name: "Gnosis Chain",
  network: "gnosis",
  nativeCurrency: {
    decimals: 18,
    name: "xDai",
    symbol: "XDAI",
  },
  rpcUrls: {
    default: { http: ["https://rpc.gnosischain.com"] },
  },
};

export const safeTokenAddress = "0x5aFE3855358E112B5647B952709E6165e1c1eEEe";
export const vestingPoolAddress = "0x96b71e2551915d98d22c448b040a3bc4801ea4ff";
export const vestingId =
  "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382";

export const distroSetupByNetwork = {
  1: {
    isDistroEnabled: false,
    distroAddress: "0x20cF5bA8aBA68Cd7Ca3d0cAfAc54dA807c772418",
    tokenAddress: "0x5aFE3855358E112B5647B952709E6165e1c1eEEe",
  },
  5: {
    isDistroEnabled: false,
    distroAddress: "0x6714Ce481312B5179Ad1Fc4904E6F723280470A3",
    tokenAddress: "0x4448ce2eE8B543ee8c18478380cA1fa747bA12AB",
  },
  100: {
    isDistroEnabled: false,
    distroAddress: "0xEc279b435068412589b0a6179710D1A300E5F58E",
    tokenAddress: "0x4d18815D14fe5c3304e87B3FA18318baa5c23820",
  },
} as const;
