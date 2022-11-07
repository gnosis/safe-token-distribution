import { SAFE_TOKEN } from "../src/constants";
import { Provider } from "@ethersproject/providers";
import Safe from "@gnosis.pm/safe-core-sdk";
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { Contract, Signer } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

export async function fork(blockNumber: number) {
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

export async function overrideSafeOwner(
  safeAddress: string,
  newOwner: Signer,
): Promise<Safe> {
  await setBalance(safeAddress, parseUnits("100", "ether"));

  const safeContractImpersonator = await ethers.getImpersonatedSigner(
    safeAddress,
  );

  const safeSdk = await Safe.create({
    ethAdapter: new EthersAdapter({
      ethers,
      signer: safeContractImpersonator,
    }),
    safeAddress,
    contractNetworks: CONTRACT_NETWORKS,
  });

  const newOwnerAddress = await newOwner.getAddress();

  const tx = await safeSdk.createAddOwnerTx({
    ownerAddress: newOwnerAddress,
    threshold: 1,
  });

  await safeContractImpersonator.sendTransaction({
    to: safeAddress,
    value: "0",
    data: tx.data.data,
  });

  return await Safe.create({
    ethAdapter: new EthersAdapter({
      ethers,
      signer: newOwner,
    }),
    safeAddress,
    contractNetworks: CONTRACT_NETWORKS,
  });
}

export async function unpauseSafeToken(provider: Provider) {
  const safeToken = new Contract(SAFE_TOKEN.address, SAFE_TOKEN.abi, provider);

  const owner = await safeToken.owner();
  await setBalance(owner, parseUnits("100", "ether"));
  const impersonatedOwner = await ethers.getImpersonatedSigner(owner);
  await new Contract(
    SAFE_TOKEN.address,
    SAFE_TOKEN.abi,
    impersonatedOwner,
  ).unpause();
}

const CONTRACT_NETWORKS = {
  ["31337"]: {
    multiSendAddress: "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761",
    multiSendCallOnlyAddress: "0x40A2aCCbd92BCA938b02010E17A5b8929b49130D",
    safeMasterCopyAddress: "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552",
    safeProxyFactoryAddress: "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2",
  },
};
