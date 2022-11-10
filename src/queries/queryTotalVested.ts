import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { VestingPool__factory } from "../../typechain";

export async function queryTotalVested(
  hre: HardhatRuntimeEnvironment,
  blockNumber: number,
  vestingAddress: string,
  vestingId: string,
): Promise<BigNumber> {
  const provider = new hre.ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  );

  const iface = VestingPool__factory.createInterface();

  const data = await iface.encodeFunctionData("calculateVestedAmount", [
    vestingId,
  ]);

  const result = await provider.call({ to: vestingAddress, data }, blockNumber);

  const { vestedAmount } = iface.decodeFunctionResult(
    "calculateVestedAmount",
    result,
  );

  return vestedAmount;
}
