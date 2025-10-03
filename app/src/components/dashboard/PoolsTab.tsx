import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, TrendingUp, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { type PoolConfig } from "@/api/clientApi";
import { ethers } from "ethers";

interface CalimeroApp {
  execute: (
    context: unknown,
    method: string,
    params: unknown
  ) => Promise<{ data?: unknown }>;
  query: (
    context: unknown,
    method: string,
    params: unknown
  ) => Promise<{ data?: unknown }>;
  getContext: () => unknown;
}

interface PoolsTabProps {
  app: CalimeroApp;
  poolConfig?: PoolConfig | null;
  onNavigateToAdmin: () => void;
}

interface Pool {
  id: string;
  name: string;
  pairs: string[];
  speed: "Fast" | "Normal" | "Slow";
  liquidity?: string;
  activeOrders: number;
}

const availablePools: Pool[] = [
  {
    id: "pool-alpha",
    name: "Pool Alpha",
    pairs: ["B3TR/USDC", "VET/USDC"],
    speed: "Fast",
    liquidity: "$1.2M",
    activeOrders: 0,
  },
  {
    id: "pool-beta",
    name: "Pool Beta",
    pairs: ["B3TR/USDC", "B3TR/VET", "VET/USDC"],
    speed: "Normal",
    liquidity: "$850K",
    activeOrders: 0,
  },
  {
    id: "pool-gamma",
    name: "Pool Gamma",
    pairs: ["B3TR/USDC"],
    speed: "Slow",
    liquidity: "$450K",
    activeOrders: 0,
  },
];

export default function PoolsTab({
  app,
  poolConfig,
  onNavigateToAdmin,
}: PoolsTabProps) {
  useEffect(() => {}, [poolConfig, app]);

  const formatAmount = (amount: string | number) => {
    try {
      const formatted = ethers.formatEther(amount.toString());
      return parseFloat(formatted).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      });
    } catch {
      return amount.toString();
    }
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "Fast":
        return <Zap className="w-4 h-4 text-green-500" />;
      case "Normal":
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case "Slow":
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Fast":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "Normal":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "Slow":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Show Admin Dashboard button if pool config exists */}
      {poolConfig && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-primary" />
                  Your Matching Pool
                </h2>
                <p className="text-muted-foreground">
                  You are the admin of this matching pool
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Pool Name</p>
                <p className="font-semibold text-lg">{poolConfig.pool_name}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Batch Frequency
                </p>
                <p className="font-semibold text-lg">
                  {poolConfig.batch_frequency_seconds}s
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Order Limits
                </p>
                <p className="font-semibold text-sm">
                  Min: {formatAmount(poolConfig.min_order_amount)} - Max:{" "}
                  {formatAmount(poolConfig.max_order_amount)}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Fee</p>
                <p className="font-semibold text-lg">
                  {poolConfig.fee_basis_points / 100}%
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2">
                Supported Tokens
              </p>
              <div className="flex flex-wrap gap-2">
                {poolConfig?.supported_tokens?.map((token) => (
                  <Badge key={token} variant="secondary" className="text-sm">
                    {token}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={onNavigateToAdmin}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              Open Pool Admin Dashboard
            </Button>
          </div>
        </motion.div>
      )}

      {/* Available Pool Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold mb-6">
          {poolConfig ? "Other Available Pools" : "Available Pools"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePools.map((pool, index) => (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{pool.name}</h3>
                  <p className="text-xs text-muted-foreground">{pool.id}</p>
                </div>
                <Badge className={getSpeedColor(pool.speed)}>
                  <span className="flex items-center gap-1">
                    {getSpeedIcon(pool.speed)}
                    {pool.speed}
                  </span>
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Supported Pairs
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pool.pairs.map((pair) => (
                      <Badge key={pair} variant="outline" className="text-xs">
                        {pair}
                      </Badge>
                    ))}
                  </div>
                </div>

                {pool.liquidity && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span className="font-semibold">{pool.liquidity}</span>
                  </div>
                )}
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Join Pool
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
