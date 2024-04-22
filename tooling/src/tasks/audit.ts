import assert from "assert";
import path from "path";
import { readdirSync } from "fs";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ALLOCATIONS_DIR, loadSnapshot } from "../persistence";
import balancemapSum from "../fns/balancemapSum";
import { formatUnits } from "ethers/lib/utils";

task("audit", "Verifies the sum of all allocations snapshots").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    const log = (text: string) => console.info(`Task audit -> ${text}`);

    log("Starting");

    let total = BigNumber.from(0);

    for (const fileName of readdirSync(ALLOCATIONS_DIR)) {
      const filePath = path.join(ALLOCATIONS_DIR, fileName);
      log(`Considering ${fileName}`);
      const allocation = loadSnapshot(filePath);
      assert(allocation);
      total = total.add(balancemapSum(allocation));
    }

    log(`TOTAL ALLOCATED ${formatUnits(total)}`);
  },
);
