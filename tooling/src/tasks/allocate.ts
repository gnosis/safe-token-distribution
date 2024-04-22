import { readFileSync } from "fs";
import assert from "assert";
import { task, types } from "hardhat/config";

import { BigNumber } from "ethers";
import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";
import { getAddress, isAddress, parseUnits } from "ethers/lib/utils";

import { saveAllocation } from "../persistence";
import proportionally from "../fns/proportionally";
import sort from "../fns/balancemapSort";
import sum from "../fns/balancemapSum";

import { BalanceMap } from "../types";

task(
  "allocate",
  "Calculates and persists one allocation file per VestingSlice entry in the schedule",
)
  .addParam("name", "Allocation Name", undefined, types.string, false)
  .addParam("weightsMainnet", "", undefined, types.string, false)
  .addParam("weightsGnosis", "", undefined, types.string, false)
  .addPositionalParam(
    "amountToDistribute",
    "Total amount to be taken out of the vesting pool. Scale to 18 decimals inside",
    undefined,
    types.string,
  )
  .setAction(async (taskArgs) => {
    const log = (text: string) => console.info(`Task allocate -> ${text}`);

    const weightsMainnet = weightsFromCSV(taskArgs.weightsMainnet);
    const weightsGnosis = weightsFromCSV(taskArgs.weightsGnosis);
    const amountToDistribute = parseUnits(taskArgs.amountToDistribute, 18);

    log("Starting");

    const { toDistributeMainnet, toDistributeGnosis } = perNetwork(
      weightsMainnet,
      weightsGnosis,
      amountToDistribute,
    );

    const allocationMainnet = proportionally(
      weightsMainnet,
      toDistributeMainnet,
    );
    assert(sum(allocationMainnet).eq(toDistributeMainnet));

    const allocationGnosis = proportionally(weightsGnosis, toDistributeGnosis);
    assert(sum(allocationGnosis).eq(toDistributeGnosis));

    saveAllocation("mainnet", taskArgs.name, sort(allocationMainnet));
    saveAllocation("gnosis", taskArgs.name, sort(allocationGnosis));

    log("Done");
  });

function perNetwork(
  weightsMainnet: BalanceMap,
  weightsGC: BalanceMap,
  amountToDistribute: BigNumber,
) {
  // just re-use allocation math to figure how much (for this vestingSlice)
  // does Mainnet get, and how much does GC get
  const result = proportionally(
    {
      mainnet: sum(weightsMainnet),
      gnosis: sum(weightsGC),
    },
    amountToDistribute,
  );

  const toDistributeMainnet = BigNumber.from(result.mainnet || 0);
  const toDistributeGnosis = BigNumber.from(result.gnosis || 0);
  // sanity check
  assert(toDistributeMainnet.add(toDistributeGnosis).eq(amountToDistribute));

  return {
    toDistributeMainnet,
    toDistributeGnosis,
  };
}

function weightsFromCSV(path: string): BalanceMap {
  console.log(path);
  const data = readFileSync(path, "utf8");

  const result: BalanceMap = {};
  for (const row of data.split("\n")) {
    const [, _address, _balance] = row.split(",");

    if (
      !isAddress(_address) ||
      !isBigNumberish(parseUnits(_balance, "ether"))
    ) {
      continue;
    }

    const address = getAddress(_address);
    const balance = parseUnits(_balance, "ether");

    if (result.address) {
      throw Error("Repeated");
    }

    result[address] = balance;
  }
  return result;
}
