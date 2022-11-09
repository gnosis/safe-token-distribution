import { assert } from "console";
import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { VestingPool__factory } from "../../typechain";

export async function queryTotalVested(
  hre: HardhatRuntimeEnvironment,
  blockNumber: number,
  vestingAddress: string,
  vestingId: string,
): Promise<BigNumber> {
  await fork(hre, blockNumber);

  const vestingPool = VestingPool__factory.connect(
    vestingAddress,
    hre.ethers.provider,
  );

  const { vestedAmount } = await vestingPool.calculateVestedAmount(vestingId);

  await forkReset(hre);

  return vestedAmount;
}

async function fork(hre: HardhatRuntimeEnvironment, blockNumber: number) {
  assert(
    hre.network.config.chainId === 31337,
    "Query should run in hardhat network mode",
  );

  const { ALCHEMY_KEY } = process.env;
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
          blockNumber,
        },
      },
    ],
  });
}

async function forkReset(hre: HardhatRuntimeEnvironment) {
  assert(
    hre.network.config.chainId === 31337,
    "Query should run in hardhat fork mode",
  );

  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [],
  });
}
