import { motion } from "framer-motion";
import { CalimeroConnectButton } from "@calimero-network/calimero-client";
import { useDefaultContext } from "../../hooks/useDefaultContext";
import { WalletButton } from '@vechain/vechain-kit';

interface DashboardNavProps {
  activeTab: "trade" | "history" | "pools";
  setActiveTab: (tab: "trade" | "history" | "pools") => void;
  app?: unknown;
}

export default function DashboardNav({
  activeTab,
  setActiveTab,
  app,
}: DashboardNavProps) {
  const { isLoading: isCreatingDefaultContext, error: defaultContextError } =
    useDefaultContext(app);

  const tabs = [
    { id: "trade", label: "Trade" },
    { id: "history", label: "Order History" },
    { id: "pools", label: "Pools" },
  ] as const;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded bg-primary" />
                </div>
                <span className="text-xl font-bold">
                  Mero<span className="text-primary">Pools</span>
                </span>
              </a>

              {/* Tabs */}
              <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-4 py-2 text-sm font-medium transition-colors rounded-md"
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-md"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        activeTab === tab.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connect Button */}
            <div className="flex items-center gap-3">
              <CalimeroConnectButton />
              <WalletButton />
            </div>
          </div>

          {/* Context Creation Status - Desktop */}
          {isCreatingDefaultContext && (
            <div className="hidden md:block px-6 py-2 bg-blue-50 border-l-4 border-blue-400 mb-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700">
                  Setting up your workspace...
                </span>
              </div>
            </div>
          )}

          {/* Context Error - Desktop */}
          {defaultContextError && (
            <div className="hidden md:block px-6 py-2 bg-red-50 border-l-4 border-red-400 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-red-600 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm text-red-700">
                    {defaultContextError}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Tabs */}
          <div className="md:hidden flex items-center gap-1 bg-muted rounded-lg p-1 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-md"
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabMobile"
                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {/* Context Creation Status - Mobile */}
          {isCreatingDefaultContext && (
            <div className="md:hidden px-4 py-2 bg-blue-50 border-l-4 border-blue-400 mb-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-xs text-blue-700">
                  Setting up workspace...
                </span>
              </div>
            </div>
          )}

          {/* Context Error - Mobile */}
          {defaultContextError && (
            <div className="md:hidden px-4 py-2 bg-red-50 border-l-4 border-red-400 mb-3">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-red-600 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs text-red-700">
                  {defaultContextError}
                </span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
