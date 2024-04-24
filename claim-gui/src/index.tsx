import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { http, WagmiProvider } from "wagmi";
import { gnosis, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import HomePage from "./Pages/HomePage";
import { DistroSetupProvider } from "./hooks/useDistroSetup";
import { AllocationProvider } from "./hooks/useAllocation";

const queryClient = new QueryClient();

const projectId = process.env.REACT_APP_WALLET_CONNECT_ID;

if (!projectId) {
  throw new Error("REACT_APP_WALLET_CONNECT_ID is required");
}

const infuraKey = process.env.REACT_APP_INFURA_KEY;
if (!infuraKey) {
  throw new Error("REACT_APP_INFURA_KEY is required");
}

// 2. Create wagmiConfig
const metadata = {
  name: "SAFE token claim",
  description: "GNO ",
  url: "https://claim-safe.gnosis.io/", // origin must match your domain & subdomain
  icons: ["https://claim-safe.gnosis.io/gno.svg"],
};

const chains = [mainnet, gnosis] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  transports: {
    [mainnet.id]: http(
      `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
    ),
    [gnosis.id]: http(),
  },
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: "light",
});

export function Web3ModalProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <Web3ModalProvider>
      <DistroSetupProvider>
        <AllocationProvider>
          <HomePage />
        </AllocationProvider>
      </DistroSetupProvider>
    </Web3ModalProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
