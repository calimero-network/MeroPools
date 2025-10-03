import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowDown, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function TradeTab() {
  const [tokenIn, setTokenIn] = useState("B3TR");
  const [tokenOut, setTokenOut] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [priceMode, setPriceMode] = useState<"market" | "custom">("market");
  const [customPrice, setCustomPrice] = useState("");
  const [spread, setSpread] = useState([0.5]);
  const [poolMode, setPoolMode] = useState<"auto" | "manual">("auto");
  const [selectedPool, setSelectedPool] = useState("pool-1");

  const marketPrice = 1.02; // Mock market price

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-6">Create Private Trade</h2>

        {/* Token Input */}
        <div className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              You Pay
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="text-2xl font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
              />
              <Select value={tokenIn} onValueChange={setTokenIn}>
                <SelectTrigger className="w-32 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B3TR">B3TR</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="VET">VET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-primary" />
            </div>
          </div>

          {/* Token Output */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              You Receive
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="0.0"
                value={
                  amountIn
                    ? (parseFloat(amountIn) * marketPrice).toFixed(2)
                    : ""
                }
                disabled
                className="text-2xl font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
              />
              <Select value={tokenOut} onValueChange={setTokenOut}>
                <SelectTrigger className="w-32 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="B3TR">B3TR</SelectItem>
                  <SelectItem value="VET">VET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Price Controls */}
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Price Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={priceMode === "market" ? "default" : "outline"}
                className={
                  priceMode === "market"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
                onClick={() => setPriceMode("market")}
              >
                Market Price
              </Button>
              <Button
                variant={priceMode === "custom" ? "default" : "outline"}
                className={
                  priceMode === "custom"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
                onClick={() => setPriceMode("custom")}
              >
                Custom Price
              </Button>
            </div>
            {priceMode === "market" && (
              <p className="text-sm text-muted-foreground mt-2">
                Market Price:{" "}
                <span className="text-primary font-semibold">
                  ${marketPrice}
                </span>
              </p>
            )}
            {priceMode === "custom" && (
              <Input
                type="number"
                placeholder="Enter custom price"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Spread */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Spread: <span className="text-primary">{spread[0]}%</span>
            </Label>
            <Slider
              value={spread}
              onValueChange={setSpread}
              min={0.1}
              max={5}
              step={0.1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.1%</span>
              <span>5%</span>
            </div>
          </div>

          {/* Pool Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Pool Selection
            </Label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={poolMode === "auto" ? "default" : "outline"}
                className={
                  poolMode === "auto"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
                onClick={() => setPoolMode("auto")}
              >
                Auto Select
              </Button>
              <Button
                variant={poolMode === "manual" ? "default" : "outline"}
                className={
                  poolMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
                onClick={() => setPoolMode("manual")}
              >
                Manual
              </Button>
            </div>
            {poolMode === "manual" && (
              <Select value={selectedPool} onValueChange={setSelectedPool}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool-1">Pool Alpha (Fast)</SelectItem>
                  <SelectItem value="pool-2">Pool Beta (Normal)</SelectItem>
                  <SelectItem value="pool-3">Pool Gamma (Slow)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold">
          Start Private Trade
        </Button>
      </motion.div>

      {/* Privacy Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          This trade runs inside a Calimero private context. Details remain
          confidential until settlement on VeChain.
        </p>
      </motion.div>
    </div>
  );
}
