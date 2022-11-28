import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { loadSchedule } from "../persistence";

import {
  calculateAmountToBridge,
  createDistributeTxGC,
  createDistributeTxMainnet,
} from "../domain/distribution";

import { getAddressConfig, getSafeSDKs, VESTING_ID } from "../config";

task("distribute", "").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  await hre.run("schedule:validate");

  await hre.run("schedule:expand");

  await hre.run("allocation:write-all");

  const [merkleRootMainnet, merkleRootGC] = await hre.run(
    "checkpoint:generate",
  );

  const { safeSdkMainnet, safeSdkGC, serviceClientMainnet, serviceClientGC } =
    await getSafeSDKs(hre);

  const {
    safeToken: safeTokenAddress,
    vestingPool: vestingPoolAddress,
    omniMediatorMainnet: omniMediatorAddress,
    distroMainnet: distroMainnetAddress,
    distroGC: distroGCAddress,
  } = await getAddressConfig(hre);

  const { amountToClaim, amountToBridge } = await calculateAmountToBridge(
    loadSchedule(),
    hre,
  );

  const distributeTxMainnet = await createDistributeTxMainnet(safeSdkMainnet, {
    safeTokenAddress,
    vestingPoolAddress,
    omniMediatorAddress,
    distroMainnetAddress,
    distroGCAddress,
    vestingId: VESTING_ID,
    amountToClaim,
    amountToBridge,
    nextMerkleRoot: merkleRootMainnet,
  });

  const distributeTxGC = await createDistributeTxGC(safeSdkGC, {
    distroAddress: distroGCAddress,
    nextMerkleRoot: merkleRootGC,
  });

  // PROPOSE TO SAFES
});
