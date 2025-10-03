"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Clock, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface Pool {
  id: string
  name: string
  pairs: string[]
  speed: "Fast" | "Normal" | "Slow"
  liquidity?: string
  activeOrders: number
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
]

const userPools: Pool[] = [
  {
    id: "pool-alpha",
    name: "Pool Alpha",
    pairs: ["B3TR/USDC", "VET/USDC"],
    speed: "Fast",
    liquidity: "$1.2M",
    activeOrders: 2,
  },
]

export default function PoolsTab() {
  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "Fast":
        return <Zap className="w-4 h-4 text-green-500" />
      case "Normal":
        return <TrendingUp className="w-4 h-4 text-yellow-500" />
      case "Slow":
        return <Clock className="w-4 h-4 text-orange-500" />
      default:
        return null
    }
  }

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Fast":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      case "Normal":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "Slow":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      {/* User's Pools */}
      {userPools.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Your Pools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPools.map((pool, index) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border-2 border-primary/30 rounded-xl p-5 hover:border-primary/50 transition-all"
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
                    <p className="text-xs text-muted-foreground mb-1">Supported Pairs</p>
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

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Orders</span>
                    <span className="font-semibold text-primary">{pool.activeOrders}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Available Pools */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Available Pools</h2>
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
                  <p className="text-xs text-muted-foreground mb-1">Supported Pairs</p>
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
      </section>
    </div>
  )
}