import { Provider } from "@ethersproject/providers";
import { BigNumber } from "ethers";
import { VestingPool__factory } from "../../typechain";

export async function queryTotalVested(
  vestingContract: string,
  vestingId: string,
  blockNumber: number,
  provider: Provider,
): Promise<BigNumber> {
  // const provider = new hre.ethers.providers.JsonRpcProvider(
  //   `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  // );

  const iface = VestingPool__factory.createInterface();

  const data = await iface.encodeFunctionData("calculateVestedAmount", [
    vestingId,
  ]);

  const result = await provider.call(
    { to: vestingContract, data },
    blockNumber,
  );

  const { vestedAmount } = iface.decodeFunctionResult(
    "calculateVestedAmount",
    result,
  );

  return vestedAmount;
}
