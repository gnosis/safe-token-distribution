import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";

export const BNtoFloat = (BN: BigNumber, decimals: number): number => {
  return parseFloat(formatUnits(BN, decimals));
};
