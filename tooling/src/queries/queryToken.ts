import { ethers } from "ethers";

import { AddressConfig, ProviderConfig } from "../types";
import { OmniMediator__factory, SafeToken__factory } from "../../typechain";

export async function queryIsPaused(
  addresses: AddressConfig,
  provider: ProviderConfig,
): Promise<boolean> {
  const safeToken = SafeToken__factory.connect(
    addresses.mainnet.token,
    provider.mainnet,
  );

  return safeToken.paused();
}

export async function queryBridgedAddress(
  addresses: AddressConfig,
  providers: ProviderConfig,
): Promise<string | null> {
  const omniMediatorGC = OmniMediator__factory.connect(
    addresses.gnosis.omniMediator,
    providers.gnosis,
  );

  const tokenAddressGC = await omniMediatorGC.bridgedTokenAddress(
    addresses.mainnet.token,
  );

  const isBridged = tokenAddressGC !== ethers.constants.AddressZero;

  return isBridged ? tokenAddressGC : null;
}
