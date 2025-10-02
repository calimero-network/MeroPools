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
import { ArrowDown, Info, Loader2, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { generateOrderCommitment } from "@/utils/orderCommitment";
import { ClientApiDataSource } from "@/api/datasource/ClientApiDataSource";
import { useToast } from "@/hooks/use-toast";

interface TradeTabProps {
  app?: unknown;
}

export default function TradeTab({ app }: TradeTabProps) {
  const [tokenIn, setTokenIn] = useState("B3TR");
  const [tokenOut, setTokenOut] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [priceMode, setPriceMode] = useState<"market" | "custom">("market");
  const [customPrice, setCustomPrice] = useState("");
  const [spread, setSpread] = useState([0.5]);
  const [timeLimit, setTimeLimit] = useState("3600"); // 1 hour default
  const [poolMode, setPoolMode] = useState<"auto" | "manual">("auto");
  const [selectedPool, setSelectedPool] = useState("pool-1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Initialize API client with app context
  const api = new ClientApiDataSource(app as never);

  // 1 B3TR = $0.0803 USD (demo conversion)
  const marketPrice = 0.0803;

  const handleSubmitOrder = async () => {
    // Validation
    if (!amountIn || parseFloat(amountIn) <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid amount",
      });
      return;
    }

    if (
      priceMode === "custom" &&
      (!customPrice || parseFloat(customPrice) <= 0)
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid custom price",
      });
      return;
    }

    setIsSubmitting(true);

    // Show loading toast
    const loadingToast = toast({
      variant: "loading",
      title: "Submitting Order...",
      description: (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing your trade on Calimero private context</span>
        </div>
      ),
    });

    try {
      // Calculate amounts and prices
      const amountDepositedWei = (parseFloat(amountIn) * 1e18).toString();
      const effectivePrice =
        priceMode === "market" ? marketPrice : parseFloat(customPrice);
      const expectedPriceWei = (effectivePrice * 1e18).toString();

      // Generate order commitment
      const commitment = generateOrderCommitment({
        token: tokenIn,
        amount: amountDepositedWei,
        expectedToken: tokenOut,
        expectedPrice: expectedPriceWei,
        vechainAddress: "0x0000000000000000000000000000000000000000",
        spread: Math.round(spread[0] * 100),
        timeLimit: parseInt(timeLimit, 10),
      });

      // Submit order to Calimero
      const response = await api.submitOrder(
        commitment,
        tokenIn,
        amountDepositedWei,
        true,
        "0x0000000000000000000000000000000000000000",
        expectedPriceWei,
        tokenOut,
        Math.round(spread[0] * 100),
        parseInt(timeLimit, 10)
      );

      // Dismiss loading toast
      loadingToast.dismiss();

      if (response.error) {
        toast({
          variant: "destructive",
          title: "Order Failed",
          description: response.error.message || "Failed to submit order",
        });
      } else {
        // Show success toast with order ID
        toast({
          variant: "success",
          title: "Order Submitted Successfully!",
          description: (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">Order ID:</span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-background/50 rounded p-2">
                <span className="text-xs font-mono">{response.data}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(response.data as string);
                    toast({
                      title: "Copied!",
                      description: "Order ID copied to clipboard",
                    });
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs opacity-90">
                Trading {amountIn} {tokenIn} for {tokenOut}
              </p>
            </div>
          ),
        });

        // Reset form
        setAmountIn("");
        setCustomPrice("");
      }
    } catch (error) {
      console.error("Error submitting order:", error);

      // Dismiss loading toast
      loadingToast.dismiss();

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <SelectItem value="VET">VET</SelectItem>
                  <SelectItem value="VTHO">VTHO</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
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
                  <SelectItem value="VTHO">VTHO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Order Settings
            </h3>
          </div>

          {/* Grid Layout for Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Mode Section */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Price Mode
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={priceMode === "market" ? "default" : "outline"}
                  className={`h-10 ${
                    priceMode === "market"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setPriceMode("market")}
                >
                  Market
                </Button>
                <Button
                  variant={priceMode === "custom" ? "default" : "outline"}
                  className={`h-10 ${
                    priceMode === "custom"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setPriceMode("custom")}
                >
                  Custom
                </Button>
              </div>
              {priceMode === "market" && (
                <div className="mt-3 p-2 bg-primary/10 rounded border border-primary/20">
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-lg font-bold text-primary">
                    ${marketPrice.toFixed(4)}
                  </p>
                </div>
              )}
              {priceMode === "custom" && (
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="mt-3 h-10"
                />
              )}
            </div>

            {/* Order Expiry Section */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Order Expiry
              </Label>
              <Select value={timeLimit} onValueChange={setTimeLimit}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="3600">1 hour</SelectItem>
                  <SelectItem value="7200">2 hours</SelectItem>
                  <SelectItem value="21600">6 hours</SelectItem>
                  <SelectItem value="86400">24 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Order expires if not matched in time
              </p>
            </div>

            {/* Spread Section */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <Label className="text-sm font-semibold mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Spread Tolerance
                </span>
                <span className="text-primary font-bold">{spread[0]}%</span>
              </Label>
              <Slider
                value={spread}
                onValueChange={setSpread}
                min={0.1}
                max={5}
                step={0.1}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0.1% (Tight)</span>
                <span>5% (Wide)</span>
              </div>
            </div>

            {/* Pool Selection Section */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Pool Selection
              </Label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant={poolMode === "auto" ? "default" : "outline"}
                  className={`h-10 ${
                    poolMode === "auto"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setPoolMode("auto")}
                >
                  Auto
                </Button>
                <Button
                  variant={poolMode === "manual" ? "default" : "outline"}
                  className={`h-10 ${
                    poolMode === "manual"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setPoolMode("manual")}
                >
                  Manual
                </Button>
              </div>
              {poolMode === "manual" && (
                <Select value={selectedPool} onValueChange={setSelectedPool}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool-1">Pool Alpha (Fast)</SelectItem>
                    <SelectItem value="pool-2">Pool Beta (Normal)</SelectItem>
                    <SelectItem value="pool-3">Pool Gamma (Slow)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {poolMode === "auto" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Best pool will be selected automatically
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-semibold"
          onClick={handleSubmitOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting Order...
            </>
          ) : (
            "Start Private Trade"
          )}
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
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Privacy Notice</p>
          <p>
            This trade runs inside a Calimero private context. Details remain
            confidential until settlement on VeChain.
          </p>
          <p className="mt-2 text-xs">
            <strong>Demo Mode:</strong> VeChain escrow integration pending.
            Orders are submitted with hardcoded values for testing.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
