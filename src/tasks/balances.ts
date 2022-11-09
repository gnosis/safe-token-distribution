import { task } from "hardhat/config";
import { queryMainnetBalances } from "../queries/queryBalances";

task("balances", "", async (_taskArgs) => {
  const a = await queryMainnetBalances(24904000);

  console.log(a);
});
