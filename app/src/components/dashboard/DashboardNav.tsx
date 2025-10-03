"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ConnectModal from "./ConnectModal"
import { motion } from "framer-motion"

interface DashboardNavProps {
  activeTab: "trade" | "history" | "pools"
  setActiveTab: (tab: "trade" | "history" | "pools") => void
}

export default function DashboardNav({ activeTab, setActiveTab }: DashboardNavProps) {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isCalimeroConnected, setIsCalimeroConnected] = useState(false)
  const [isVeChainConnected, setIsVeChainConnected] = useState(false)

  const tabs = [
    { id: "trade", label: "Trade" },
    { id: "history", label: "Order History" },
    { id: "pools", label: "Pools" },
  ] as const

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
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        activeTab === tab.id ? "text-primary" : "text-muted-foreground"
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
              {isCalimeroConnected && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">Calimero</span>
                </div>
              )}
              {isVeChainConnected && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">VeChain</span>
                </div>
              )}
              <Button
                onClick={() => setIsConnectModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Connect
              </Button>
            </div>
          </div>

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
                    activeTab === tab.id ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        isCalimeroConnected={isCalimeroConnected}
        isVeChainConnected={isVeChainConnected}
        onCalimeroConnect={() => setIsCalimeroConnected(true)}
        onVeChainConnect={() => setIsVeChainConnected(true)}
      />
    </>
  )
}