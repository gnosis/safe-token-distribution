import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { configureChains, createClient, WagmiConfig } from "wagmi";
import { mainnet, goerli } from "wagmi/chains";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { infuraProvider } from "@wagmi/core/providers/infura";
import { InjectedConnector } from "wagmi/connectors/injected";

import HomePage from "./Pages/HomePage";
import { DistroSetupProvider } from "./hooks/useDistroSetup";
import { AllocationProvider } from "./hooks/useAllocation";

import { gnosis } from "./config";

const { chains, provider } = configureChains(
  [mainnet, gnosis, goerli],
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
  connectors: [new InjectedConnector({ chains })],
  provider,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

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
