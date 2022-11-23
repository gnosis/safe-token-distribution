import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { AllocationProvider } from "./AllocationProvider";
import HomePage from "./Pages/HomePage";

const { chains, provider } = configureChains(
  [chain.hardhat],
  [
    jsonRpcProvider({
      rpc: (chain) => ({ http: "http://127.0.0.1:8545/" }),
    }),
  ],
);

const { connectors } = getDefaultWallets({
  appName: "Safe Token Distribution",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider
        chains={chains}
        theme={lightTheme({
          accentColor: "#5d6d74",
          accentColorForeground: "white",
          borderRadius: "small",
          fontStack: "system",
          overlayBlur: "small",
        })}
      >
        <AllocationProvider>
          <HomePage />
        </AllocationProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
