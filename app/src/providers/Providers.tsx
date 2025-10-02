import { VeChainKitProvider } from "@vechain/vechain-kit";
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const isDarkMode = true;

  const coloredLogo =
    "https://i.ibb.co/7G4PQNZ/vechain-kit-logo-colored-circle.png";

  return (
    <VeChainKitProvider
      network={{
        type:
          (import.meta.env.VITE_NETWORK_TYPE as "main" | "test" | "solo") ||
          "test",
      }}
      feeDelegation={{
        delegatorUrl:
          import.meta.env.VITE_DELEGATOR_URL ||
          "https://sponsor-testnet.vechain.energy/by/937",
        delegateAllTransactions: false,
      }}
      loginMethods={[
        { method: "vechain", gridColumn: 4 },
        { method: "dappkit", gridColumn: 4 },
        { method: "ecosystem", gridColumn: 4 },
      ]}
      dappKit={{
        allowedWallets: ["veworld", "wallet-connect", "sync2"],
        walletConnectOptions: {
          projectId:
            import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
            "44541c97e890120f2e4ea79524fe6a30",
          metadata: {
            name: "MeroPools",
            description: "Private dark pool trading on VeChain with Calimero",
            url: typeof window !== "undefined" ? window.location.origin : "",
            icons: [coloredLogo],
          },
        },
      }}
      darkMode={isDarkMode}
      language="en"
      allowCustomTokens={true}
      loginModalUI={{
        description:
          "Choose between social login through VeChain or by connecting your wallet.",
      }}
    >
      {children}
      <Toaster />
    </VeChainKitProvider>
  );
}
