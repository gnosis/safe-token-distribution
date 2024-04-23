import assert from "assert";
import path from "path";
import { readdirSync } from "fs";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ALLOCATIONS_DIR, loadSnapshot } from "../persistence";
import { sum, merge } from "../fns/bag";

import { BalanceMap } from "../types";

task("audit", "Verifies the sum of all allocations snapshots").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`Task audit -> ${text}`);

    const bucket100K = parseUnits("100000");
    let countBucket100K = 0;
    const bucket10K = parseUnits("10000");
    let countBucket10K = 0;
    const bucket1K = parseUnits("1000");
    let countBucket1K = 0;
    const bucket100 = parseUnits("100");
    let countBucket100 = 0;
    const bucket10 = parseUnits("10");
    let countBucket10 = 0;
    const bucket1 = parseUnits("1");
    let countBucket1 = 0;
    let floor = 0;

    log("Starting");

    let allocations: BalanceMap = {};
    let total = BigNumber.from(0);

    for (const fileName of readdirSync(ALLOCATIONS_DIR)) {
      const filePath = path.join(ALLOCATIONS_DIR, fileName);
      log(`Considering ${fileName}`);
      const snapshot = loadSnapshot(filePath);
      assert(snapshot);
      total = total.add(sum(snapshot));
      allocations = merge(allocations, snapshot);
    }

    for (const key of Object.keys(allocations)) {
      const value = allocations[key];
      if (value.gt(bucket100K)) {
        countBucket100K++;
      } else if (value.gt(bucket10K)) {
        countBucket10K++;
      } else if (value.gt(bucket1K)) {
        countBucket1K++;
      } else if (value.gt(bucket100)) {
        countBucket100++;
      } else if (value.gt(bucket10)) {
        countBucket10++;
      } else if (value.gt(bucket1)) {
        countBucket1++;
      } else {
        floor++;
      }
    }

    log(`---------------------------`);
    log(`Allocated ${formatUnits(total)} SAFE`);
    log(`---------------------------`);
    log(`Accounts  + 100K SAFE ${countBucket100K}`);
    log(`Accounts   + 10K SAFE ${countBucket10K}`);
    log(`Accounts    + 1K SAFE ${countBucket1K}`);
    log(`Accounts   + 100 SAFE ${countBucket100}`);
    log(`Accounts    + 10 SAFE ${countBucket10}`);
    log(`Accounts     + 1 SAFE ${countBucket1}`);
    log(`Accounts     < 1 SAFE ${floor}`);

    const [first, second, third, fourth, fifth] = Object.entries(
      allocations,
    ).sort(([, v1], [, v2]) => (v1.gt(v2) ? -1 : 1));

    log(`First  ${first[0]} ${formatUnits(first[1])}`);
    log(`Second ${second[0]} ${formatUnits(second[1])}`);
    log(`Third  ${third[0]} ${formatUnits(third[1])}`);
    log(`Fourth ${fourth[0]} ${formatUnits(fourth[1])}`);
    log(`Fifth  ${fifth[0]} ${formatUnits(fifth[1])}`);
  },
);
