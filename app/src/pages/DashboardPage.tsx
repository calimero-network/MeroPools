import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCalimero } from "@calimero-network/calimero-client";
import DashboardNav from "@/components/dashboard/DashboardNav";
import TradeTab from "@/components/dashboard/TradeTab";
import OrderHistoryTab from "@/components/dashboard/OrderHistoryTab";
import PoolsTab from "@/components/dashboard/PoolsTab";
import { DefaultContextService } from "@/services/DefaultContextService";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"trade" | "history" | "pools">(
    "trade"
  );
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const { app } = useCalimero();

  useEffect(() => {
    if (app) {
      const defaultContextService = DefaultContextService.getInstance(app);
      const defaultContext = defaultContextService.getStoredDefaultContext();

      if (defaultContext && defaultContext.executorId) {
        setUserId(defaultContext.executorId);
      }
    }
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
        <DashboardNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          app={app}
        />

        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "trade" && <TradeTab app={app} />}
            {activeTab === "history" && (
              <OrderHistoryTab app={app} userId={userId} />
            )}
            {activeTab === "pools" && <PoolsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
