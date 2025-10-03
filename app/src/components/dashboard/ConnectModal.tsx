"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Wallet, Check } from "lucide-react"

interface ConnectModalProps {
  isOpen: boolean
  onClose: () => void
  isCalimeroConnected: boolean
  isVeChainConnected: boolean
  onCalimeroConnect: () => void
  onVeChainConnect: () => void
}

export default function ConnectModal({
  isOpen,
  onClose,
  isCalimeroConnected,
  isVeChainConnected,
  onCalimeroConnect,
  onVeChainConnect,
}: ConnectModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Connect Services</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* Calimero Private Context */}
          <button
            onClick={() => {
              onCalimeroConnect()
              if (isVeChainConnected) onClose()
            }}
            disabled={isCalimeroConnected}
            className="w-full p-4 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:neon-glow transition-all">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Connect Calimero</h3>
                  <p className="text-sm text-muted-foreground">Private Context</p>
                </div>
              </div>
              {isCalimeroConnected && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>

          {/* VeChain Wallet */}
          <button
            onClick={() => {
              onVeChainConnect()
              if (isCalimeroConnected) onClose()
            }}
            disabled={isVeChainConnected}
            className="w-full p-4 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:neon-glow transition-all">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">Connect VeChain</h3>
                  <p className="text-sm text-muted-foreground">Wallet Connection</p>
                </div>
              </div>
              {isVeChainConnected && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Connect both services to start trading privately on MeroPools
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}