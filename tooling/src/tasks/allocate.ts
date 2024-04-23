import { readFileSync } from "fs";
import assert from "assert";
import { task, types } from "hardhat/config";

import { BigNumber } from "ethers";
import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";
import {
  formatUnits,
  getAddress,
  isAddress,
  parseUnits,
} from "ethers/lib/utils";

import { saveAllocation } from "../persistence";
import proportionally from "../fns/proportionally";
import sort from "../fns/balancemapSort";
import sum from "../fns/balancemapSum";
import balancemapWithout from "../fns/balancemapWithout";

import { BalanceMap } from "../types";

const EXCLUDE = [getAddress("0x2686d5e477d1aaa58bf8ce598fa95d97985c7fb1")];

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

    const weightsMainnet = balancemapWithout(
      weightsFromCSV(taskArgs.weightsMainnet),
      EXCLUDE,
    );
    const weightsGnosis = balancemapWithout(
      weightsFromCSV(taskArgs.weightsGnosis),
      EXCLUDE,
    );

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
    const allocationGnosis = proportionally(weightsGnosis, toDistributeGnosis);

    sanity({
      allocationMainnet,
      allocationGnosis,
      amountToDistribute,
    });

    log(`${formatUnits(sum(allocationMainnet))} SAFE in Mainnet`);
    saveAllocation("mainnet", taskArgs.name, sort(allocationMainnet));
    log(`${formatUnits(sum(allocationGnosis))} SAFE in Gnosis`);
    saveAllocation("gnosis", taskArgs.name, sort(allocationGnosis));

    log("Done");
  });

function sanity({
  allocationMainnet,
  allocationGnosis,
  amountToDistribute,
}: {
  allocationMainnet: BalanceMap;
  allocationGnosis: BalanceMap;
  amountToDistribute: BigNumber;
}) {
  const total = sum(allocationMainnet).add(sum(allocationGnosis));
  assert(total.eq(amountToDistribute));
}

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
  const data = readFileSync(path, "utf8");

  const regex = /\d*\.?\d*/;

  const result: BalanceMap = {};
  for (const row of data.split("\n")) {
    let [_address, _score] = row.split(",");

    if (!isAddress(_address) || !regex.test(_score)) {
      continue;
    }

    const address = getAddress(_address);
    const score = parseUnits((_score.match(regex) as string[])[0], "ether");

    if (result.address) {
      throw Error("Repeated");
    }
    assert(isBigNumberish(score));

    result[address] = score;
  }
  return result;
}
