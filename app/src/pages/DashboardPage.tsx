import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCalimero } from "@calimero-network/calimero-client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import TradeTab from "@/components/dashboard/TradeTab";
import OrderHistoryTab from "@/components/dashboard/OrderHistoryTab";
import PoolsTab from "@/components/dashboard/PoolsTab";
import AdminPoolDashboard from "@/components/dashboard/AdminPoolDashboard";
import { ClientApiDataSource } from "@/api/datasource/ClientApiDataSource";
import { OperatingMode, type PoolConfig } from "@/api/clientApi";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"trade" | "history" | "pools">(
    "trade"
  );
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [poolConfig, setPoolConfig] = useState<PoolConfig | null>(null);

  const { app } = useCalimero();

  useEffect(() => {
    async function checkMode() {
      if (!app) {
        return;
      }

      try {
        const api = new ClientApiDataSource(app as never);
        const modeResponse = await api.getMode();

        let mode: string | OperatingMode | null | undefined = modeResponse.data;
        if (mode && typeof mode === "object" && "result" in mode) {
          mode = (mode as { result: string }).result as OperatingMode;
        }

        if (
          mode &&
          (mode === OperatingMode.MatchingPool || mode === "MatchingPool")
        ) {
          const configResponse = await api.getPoolConfig();

          let config: PoolConfig | null | undefined =
            configResponse.data as PoolConfig;

          if (config && typeof config === "object") {
            if (
              "result" in config &&
              config.result &&
              typeof config.result === "object"
            ) {
              const result = config.result as Record<string, unknown>;
              if ("output" in result) {
                config = result.output as PoolConfig;
              } else {
                config = result as unknown as PoolConfig;
              }
            } else if ("output" in config) {
              config = (config as Record<string, unknown>).output as PoolConfig;
            }
          }

          if (config) {
            setPoolConfig(config as PoolConfig);
          } else {
            console.error(
              "❌ No pool config data found:",
              configResponse.error
            );
          }
        }
      } catch (error) {
        console.error("❌ Error checking mode:", error);
      }
    }

    checkMode();
  }, [app]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute top-1/3 right-20 w-80 h-80 bg-chart-2/15 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-20 left-1/4 w-72 h-72 bg-chart-3/10 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-primary) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {showAdminDashboard && poolConfig && app ? (
          <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <AdminPoolDashboard
                app={app as never}
                poolConfig={poolConfig}
                onBack={() => setShowAdminDashboard(false)}
              />
            </div>
          </div>
        ) : (
          <>
            <DashboardNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              app={app}
            />

            <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                {activeTab === "trade" && <TradeTab app={app} />}
                {activeTab === "history" && <OrderHistoryTab app={app} />}
                {activeTab === "pools" && (
                  <PoolsTab
                    app={app as never}
                    poolConfig={poolConfig}
                    onNavigateToAdmin={() => setShowAdminDashboard(true)}
                  />
                )}
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
