import assert from "assert";
import { BigNumber } from "ethers";
import { task } from "hardhat/config";

import {
  Balances,
  loadBalancesGC,
  loadBalancesMainnet,
  loadBlockToVestedMap,
  loadDateToBlockMap,
} from "../persistence";

task(
  "harvest:allocation",
  "Calculated the total vested for every vesting slice",
).setAction(async () => {
  console.log("Starting harvest:allocation...");

  const dateToBlockMap = loadDateToBlockMap();
  const blockToVestedMap = loadBlockToVestedMap();

  const schedule = Object.keys(dateToBlockMap);

  let prevBlockNumber = null;
  for (const date of schedule) {
    const blockNumber = dateToBlockMap[date].mainnet.blockNumber;

    assert(!!blockToVestedMap[blockNumber], "harvest:allocation 404");
    const balancesMainnet = loadBalancesMainnet(blockNumber);
    assert(!!balancesMainnet, "harvest:allocation 404");
    const balancesGC = loadBalancesGC(blockNumber);
    assert(!!balancesGC, "harvest:allocation 404");

    const vestingSlice = blockToVestedMap[blockNumber].sub(
      prevBlockNumber ? blockToVestedMap[prevBlockNumber] : BigNumber.from(0),
    );

    //const { allocationMainnet, allocationGC } = vestingSliceAllocation(
    vestingSliceAllocation(vestingSlice, balancesMainnet, balancesGC);

    //writeAllocations(allocationMainnet, allocationGC);
    prevBlockNumber = blockNumber;
  }
});

function vestingSliceAllocation(
  vestingSlice: BigNumber,
  gcBalances: Balances,
  mainnetBalances: Balances,
) {
  vestingSlice.sub;
  console.log("--------------------------");
  console.log("vestingSlice " + vestingSlice.toString());
  console.log("gcBalances " + sum(gcBalances).toString());
  console.log("mainnetBalances " + sum(mainnetBalances).toString());

  //TODO
}

function sum(balances: Balances): BigNumber {
  return Object.keys(balances).reduce(
    (prev, next) => prev.add(balances[next as unknown as string]),
    BigNumber.from(0),
  );
}
