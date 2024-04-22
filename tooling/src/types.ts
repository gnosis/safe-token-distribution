import { Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";

export type Interval = {
  left: number;
  right: number;
};

export type BalanceMap = {
  [key: string]: BigNumber;
};

export type UserBalance = {
  id: string;
  deposit?: string;
  lgno?: string;
  stakedGnoSgno?: string;
};

export type AddressConfig = {
  mainnet: {
    token: string;
    omniMediator: string;
    treasurySafe: string;
    vestingPool: string;
  };
  gnosis: {
    omniMediator: string;
    treasurySafe: string;
  };
};

export type ProviderConfig = {
  mainnet: Provider;
  gnosis: Provider;
};
