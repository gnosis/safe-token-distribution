import { BigNumber } from "ethers";

export type Interval = {
  left: number;
  right: number;
};

export type Snapshot = {
  [key: string]: BigNumber;
};
