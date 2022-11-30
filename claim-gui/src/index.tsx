import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { infuraProvider } from "@wagmi/core/providers/infura";
import { InjectedConnector } from "wagmi/connectors/injected";
import { AllocationProvider } from "./utils/AllocationProvider";
import HomePage from "./Pages/HomePage";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.hardhat],
  [
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA_KEY || "" }),
    jsonRpcProvider({
      rpc: (chain) => ({ http: "http://127.0.0.1:8545/" }),
    }),
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
      <AllocationProvider>
        <HomePage />
      </AllocationProvider>
    </WagmiConfig>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
