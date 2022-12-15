import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet, goerli } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { infuraProvider } from "@wagmi/core/providers/infura";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "@wagmi/core/connectors/walletConnect";
import { CoinbaseWalletConnector } from "@wagmi/core/connectors/coinbaseWallet";

import HomePage from "./Pages/HomePage";
import { DistroSetupProvider } from "./hooks/useDistroSetup";
import { AllocationProvider } from "./hooks/useAllocation";

import { gnosis } from "./config";

const { chains, provider } = configureChains(
  process.env.NODE_ENV === "development"
    ? [mainnet, gnosis, goerli]
    : [mainnet, gnosis],
  [
    jsonRpcProvider({
      rpc: (chain) =>
        chain.id === 100 ? { http: "https://rpc.gnosischain.com" } : null,
    }),
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA_KEY || "" }),
  ],
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({ chains, options: { qrcode: true } }),
    new CoinbaseWalletConnector({
      options: {
        appName: "GnosisDAO — Safe Claim",
      },
    }),
  ],
  provider,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// https://github.com/WalletConnect/walletconnect-monorepo/issues/748
window.Buffer = window.Buffer || require("buffer").Buffer;

root.render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <DistroSetupProvider>
        <AllocationProvider>
          <HomePage />
        </AllocationProvider>
      </DistroSetupProvider>
    </WagmiConfig>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
