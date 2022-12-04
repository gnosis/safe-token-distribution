import { BigNumber } from "ethers";

export type Interval = {
  left: number;
  right: number;
};

export type Snapshot = {
  [key: string]: BigNumber;
};

export type UserBalance = {
  id: string;
  deposit?: string;
  lgno?: string;
  stakedGnoSgno?: string;
};
