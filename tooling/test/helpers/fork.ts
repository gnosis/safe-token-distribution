import hre from "hardhat";

export default async function fork(blockNumber: number) {
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
