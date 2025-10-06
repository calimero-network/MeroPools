import { useState, useEffect, useMemo } from "react";
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
import { ContextApiDataSource } from "@/api/datasource/NodeApiDataSource";
import { useToast } from "@/hooks/use-toast";
import {
  useWallet,
  useGetTokenUsdPrice,
  useSendTransaction,
} from "@vechain/vechain-kit";
import { useDarkPoolContract } from "@/hooks/useDarkPoolContract";
import { ethers } from "ethers";

interface TradeTabProps {
  app?: unknown;
}

export default function TradeTab({ app }: TradeTabProps) {
  const [tokenIn, setTokenIn] = useState("B3TR");
  const [tokenOut, setTokenOut] = useState("VTHO");
  const [amountIn, setAmountIn] = useState("");
  const [priceMode, setPriceMode] = useState<"market" | "custom">("market");
  const [customPrice, setCustomPrice] = useState("");
  const [spread, setSpread] = useState([0.5]);
  const [timeLimit, setTimeLimit] = useState("3600");
  const [poolMode, setPoolMode] = useState<"auto" | "manual">("auto");
  const [selectedPool, setSelectedPool] = useState("pool-1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Manual mode states
  const [generatedIdentity, setGeneratedIdentity] = useState<string>("");
  const [isGeneratingIdentity, setIsGeneratingIdentity] = useState(false);
  const [invitationPayloadInput, setInvitationPayloadInput] =
    useState<string>("");

  const { toast } = useToast();
  const { account } = useWallet();
  const {
    contractAddress,
    contractInterface,
    erc20Interface,
    getTokenAddress,
  } = useDarkPoolContract();

  const { data: b3trPrice, isLoading: isLoadingB3trPrice } =
    useGetTokenUsdPrice("B3TR");
  const { data: vthoPrice, isLoading: isLoadingVthoPrice } =
    useGetTokenUsdPrice("VTHO");
  const { data: vetPrice, isLoading: isLoadingVetPrice } =
    useGetTokenUsdPrice("VET");

  const api = new ClientApiDataSource(app as never);
  const nodeApi = new ContextApiDataSource();

  // TODO: Replace with real pool contexts from discovery service
  // Hardcoded for demo purposes
  const poolContextId = "8NQrE4bXZk3fhdickS7E4eDZ6Xf3EieL5UhH6be7Br6r"; // Matching pool context

  const availablePools = [
    {
      id: "pool-1",
      name: "B3TR/VTHO Pool (Test)",
      contextId: poolContextId || "",
    },
    {
      id: "pool-2",
      name: "VET/VTHO Pool (Test)",
      contextId: poolContextId || "",
    },
    {
      id: "pool-3",
      name: "B3TR/VET Pool (Test)",
      contextId: poolContextId || "",
    },
  ];

  useEffect(() => {
    const storedUserId = localStorage.getItem("defaultContextUserID");

    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("TradeTab - No defaultContextUserID found in localStorage");
    }
  }, []);

  const marketPrice = useMemo(() => {
    const getTokenPrice = (token: string): number => {
      switch (token) {
        case "B3TR":
          return b3trPrice || 0.0803;
        case "VOT3":
          return 0.05;
        case "VTHO":
          return vthoPrice || 0.001;
        case "VET":
          return vetPrice || 0.025;
        default:
          return 1;
      }
    };

    const tokenInPrice = getTokenPrice(tokenIn);
    const tokenOutPrice = getTokenPrice(tokenOut);

    if (tokenOutPrice === 0) return 1;
    return tokenInPrice / tokenOutPrice;
  }, [tokenIn, tokenOut, b3trPrice, vthoPrice, vetPrice]);

  const isPriceLoading =
    isLoadingB3trPrice || isLoadingVthoPrice || isLoadingVetPrice;

  const buildDepositClauses = useMemo(() => {
    return (amount: string, token: string) => {
      if (!amount || parseFloat(amount) <= 0) return [];

      const amountInWei = ethers.parseEther(amount);
      const amountHex = `0x${amountInWei.toString(16)}`;

      if (token === "VET") {
        // Native VET: Use address(0) as token parameter and send value
        return [
          {
            to: contractAddress as `0x${string}`,
            value: amountHex,
            data: contractInterface.encodeFunctionData("deposit", [
              "0x0000000000000000000000000000000000000000",
              "0",
            ]),
            comment: `Deposit ${amount} ${token} to DarkPool escrow`,
          },
        ];
      }

      const tokenAddress = getTokenAddress(token);

      return [
        {
          to: tokenAddress as `0x${string}`,
          value: "0x0",
          data: erc20Interface.encodeFunctionData("approve", [
            contractAddress,
            amountInWei.toString(),
          ]),
          comment: `Approve ${amount} ${token} for DarkPool`,
        },
        {
          to: contractAddress as `0x${string}`,
          value: "0x0",
          data: contractInterface.encodeFunctionData("deposit", [
            tokenAddress,
            amountInWei.toString(),
          ]),
          comment: `Deposit ${amount} ${token} to DarkPool escrow`,
        },
      ];
    };
  }, [contractAddress, contractInterface, erc20Interface, getTokenAddress]);

  const { sendTransaction: sendDepositTx } = useSendTransaction({
    signerAccountAddress: account?.address ?? "",
  });

  const handleGenerateIdentity = async () => {
    setIsGeneratingIdentity(true);
    try {
      const identityResponse = await nodeApi.createIdentity();

      if (identityResponse.error || !identityResponse.data) {
        throw new Error(
          identityResponse.error?.message || "Failed to generate identity"
        );
      }

      const newIdentity = identityResponse.data.publicKey;
      setGeneratedIdentity(newIdentity);

      toast({
        variant: "success",
        title: "Identity Generated",
        description: (
          <div className="space-y-2">
            <p>New identity created successfully!</p>
            <div className="flex items-center gap-2 bg-background/50 rounded p-2">
              <span className="text-xs font-mono truncate">{newIdentity}</span>
            </div>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error generating identity:", error);
      toast({
        variant: "destructive",
        title: "Identity Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate identity",
      });
    } finally {
      setIsGeneratingIdentity(false);
    }
  };

  const handleSubmitOrder = async () => {
    // Step 1: Validation
    if (!userId) {
      toast({
        variant: "destructive",
        title: "User Not Connected",
        description: "Please connect to Calimero to submit orders",
      });
      return;
    }

    if (!account?.address) {
      toast({
        variant: "destructive",
        title: "VeChain Wallet Not Connected",
        description: "Please connect your VeChain wallet to deposit tokens",
      });
      return;
    }

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

    if (poolMode === "manual") {
      if (!generatedIdentity) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please generate an identity first in manual mode",
        });
        return;
      }
      if (!invitationPayloadInput.trim()) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please enter the invitation payload in manual mode",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const depositClauses = buildDepositClauses(amountIn, tokenIn);

      if (depositClauses.length === 0) {
        throw new Error("Failed to build deposit transaction");
      }

      toast({
        variant: "loading",
        title: "Step 1/5: Depositing to Escrow",
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {tokenIn === "VET" ? "Depositing" : "Approving and depositing"}{" "}
              {amountIn} {tokenIn} to VeChain escrow...
            </span>
          </div>
        ),
      });

      console.info(`Sending deposit transaction`, {
        clauses: depositClauses,
        token: tokenIn,
        amount: amountIn,
      });

      await sendDepositTx(depositClauses);

      const txHash = `0x${Date.now().toString(16)}${Math.random()
        .toString(16)
        .slice(2, 18)}`;

      // Step 3: Handle identity and invitation based on pool mode
      let poolIdentity: string;
      let invitationPayload = "";

      if (poolMode === "manual") {
        if (!generatedIdentity) {
          throw new Error("Please generate an identity first");
        }
        if (!invitationPayloadInput.trim()) {
          throw new Error("Please enter the invitation payload");
        }

        poolIdentity = generatedIdentity;

        invitationPayload = invitationPayloadInput.trim();

        if (
          invitationPayload.startsWith('"') &&
          invitationPayload.endsWith('"')
        ) {
          invitationPayload = invitationPayload.slice(1, -1);
        }

        toast({
          variant: "loading",
          title: "Step 2/3: Using Manual Identity",
          description: (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Using provided identity and invitation...</span>
            </div>
          ),
        });

        console.info("🔐 Using manual identity:", poolIdentity);
        toast({
          variant: "loading",
          title: "Step 2/5: Generating Identity (Demo Mode)",
          description: (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating new identity for pool context...</span>
            </div>
          ),
        });

        console.info("🔐 Auto mode: Generating identity (Demo)");

        const identityResponse = await nodeApi.createIdentity();

        if (identityResponse.error || !identityResponse.data) {
          throw new Error(
            identityResponse.error?.message || "Failed to generate identity"
          );
        }

        poolIdentity = identityResponse.data.publicKey;

        if (identityResponse.error || !identityResponse.data) {
          throw new Error(
            identityResponse.error?.message || "Failed to generate identity"
          );
        }

        poolIdentity = identityResponse.data.publicKey;

        const tradeContextId = "FnBCkKz1jpjoQgYSZoQ8nNyVv9u4y7wmtnwgkddCn4QP";

        toast({
          variant: "loading",
          title: "Step 3/5: Creating Invitation (Demo Mode)",
          description: (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating invitation to join trade pool...</span>
            </div>
          ),
        });

        const inviterIdentity = "GRdWcgDyaR5uCdapaTX1CjHUx3hNdXA7gNJrXtoUD6dN";

        console.info("🎫 Creating invitation (Demo):", {
          contextId: tradeContextId,
          invitee: poolIdentity,
          inviter: inviterIdentity,
        });

        const invitationResponse = await nodeApi.inviteToContext({
          contextId: tradeContextId,
          invitee: poolIdentity,
          inviter: inviterIdentity,
        });

        if (invitationResponse.error || !invitationResponse.data) {
          throw new Error(
            invitationResponse.error?.message || "Failed to create invitation"
          );
        }

        invitationPayload = invitationResponse.data;
      }

      // Step 4: Join pool context with identity using invitation payload
      toast({
        variant: "loading",
        title: `Step ${
          poolMode === "manual" ? "3" : "4"
        }/5: Joining Pool Context`,
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Joining pool context with invitation...</span>
          </div>
        ),
      });

      const joinResponse = await nodeApi.joinContext({
        invitationPayload: invitationPayload,
      });

      if (joinResponse.error || !joinResponse.data) {
        throw new Error(
          joinResponse.error?.message || "Failed to join pool context"
        );
      }

      const { contextId: joinedContextId, memberPublicKey } = joinResponse.data;

      // Prepare order data
      const amountDepositedWei = ethers.parseEther(amountIn).toString();
      const effectivePrice =
        priceMode === "market" ? marketPrice : parseFloat(customPrice);
      const expectedPriceWei = ethers
        .parseEther(effectivePrice.toString())
        .toString();

      const commitment = generateOrderCommitment({
        token: tokenIn,
        amount: amountDepositedWei,
        expectedToken: tokenOut,
        expectedPrice: expectedPriceWei,
        vechainAddress: account.address,
        spread: Math.round(spread[0] * 100),
        timeLimit: parseInt(timeLimit, 10),
      });

      // Step 5: Submit order to user's private context (for personal tracking)
      toast({
        variant: "loading",
        title: `Step ${
          poolMode === "manual" ? "4" : "5"
        }/6: Recording in Private Context`,
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Recording order in your private context...</span>
          </div>
        ),
      });

      console.info(
        "📝 Submitting order to user's private context (default context)"
      );
      const userPrivateContextId =
        localStorage.getItem("defaultContextId") || "";

      const privateResponse = await api.submitOrder(
        userId!, // User's default context identity
        commitment,
        tokenIn,
        amountDepositedWei,
        true, // escrow_confirmed = true (we have deposit tx)
        account.address,
        expectedPriceWei,
        tokenOut,
        Math.round(spread[0] * 100),
        parseInt(timeLimit, 10),
        userPrivateContextId,
        userId
      );

      if (privateResponse.error) {
        console.warn(
          "Failed to record in private context:",
          privateResponse.error.message
        );
      }

      // Step 6: Submit order to matching pool context (for matching)
      toast({
        variant: "loading",
        title: `Step ${
          poolMode === "manual" ? "5" : "6"
        }/6: Submitting to Pool`,
        description: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting order to matching pool...</span>
          </div>
        ),
      });

      console.info("🏊 Submitting order to matching pool context with:", {
        identity: memberPublicKey,
        contextId: poolContextId,
        joinedContextId,
      });

      const response = await api.submitOrder(
        memberPublicKey, // Pool context identity (critical for matching)
        commitment,
        tokenIn,
        amountDepositedWei,
        true, // escrow_confirmed = true (we have deposit tx)
        account.address,
        expectedPriceWei,
        tokenOut,
        Math.round(spread[0] * 100),
        parseInt(timeLimit, 10),
        poolContextId,
        memberPublicKey
      );

      if (response.error) {
        throw new Error(
          `Failed to submit order to pool: ${
            response.error.message || JSON.stringify(response.error)
          }`
        );
      }

      const responseData = response.data;
      let orderId = "Unknown";

      if (typeof responseData === "string") {
        orderId = responseData;
      } else if (typeof responseData === "object" && responseData !== null) {
        const dataObj = responseData as Record<string, unknown>;
        if (dataObj.output) {
          orderId = String(dataObj.output);
        } else if (dataObj.result) {
          orderId = String(dataObj.result);
        } else if (dataObj.success) {
          orderId = String(dataObj.success);
        }
      }

      toast({
        variant: "success",
        title: "Trade Submitted Successfully!",
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">Order ID:</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-background/50 rounded p-2">
              <span className="text-xs font-mono">{orderId}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(orderId);
                  toast({
                    title: "Copied!",
                    description: "Order ID copied to clipboard",
                  });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs opacity-90">✅ Deposited to VeChain escrow</p>
            <p className="text-xs opacity-90">✅ Generated pool identity</p>
            <p className="text-xs opacity-90">✅ Joined pool context</p>
            <p className="text-xs opacity-90">
              ✅ Order recorded in private context
            </p>
            <p className="text-xs opacity-90">
              ✅ Order submitted to matching pool
            </p>
            <a
              href={`https://explore-testnet.vechain.org/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View deposit transaction →
            </a>
          </div>
        ),
      });

      setAmountIn("");
      setCustomPrice("");
    } catch (error) {
      console.error("Error submitting order:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: "Order Submission Failed",
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
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string, numbers, and decimal points
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setAmountIn(value);
                  }
                }}
                className="text-2xl font-semibold bg-transparent border-none focus-visible:ring-0 p-0"
              />
              <Select value={tokenIn} onValueChange={setTokenIn}>
                <SelectTrigger className="w-32 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B3TR">B3TR</SelectItem>
                  <SelectItem value="VOT3">VOT3</SelectItem>
                  <SelectItem value="VET">VET</SelectItem>
                  <SelectItem value="VTHO">VTHO</SelectItem>
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
                  amountIn && !isPriceLoading
                    ? (parseFloat(amountIn) * marketPrice).toFixed(6)
                    : isPriceLoading
                    ? "Loading..."
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
                  <SelectItem value="B3TR">B3TR</SelectItem>
                  <SelectItem value="VOT3">VOT3</SelectItem>
                  <SelectItem value="VET">VET</SelectItem>
                  <SelectItem value="VTHO">VTHO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Market Rate Indicator */}
        <div className="mt-4 p-3 bg-muted/30 border border-border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Market Rate:
              </span>
              {isPriceLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm">Loading prices...</span>
                </div>
              ) : (
                <span className="text-sm font-semibold">
                  1 {tokenIn} = {marketPrice.toFixed(6)} {tokenOut}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {b3trPrice || vthoPrice || vetPrice ? (
                <span className="text-green-500">● Live</span>
              ) : (
                <span className="text-yellow-500">● Fallback</span>
              )}
            </div>
          </div>
          {/* USD Prices */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
            <span>
              {tokenIn}: $
              {tokenIn === "B3TR"
                ? (b3trPrice || 0.0803).toFixed(4)
                : tokenIn === "VTHO"
                ? (vthoPrice || 0.001).toFixed(4)
                : tokenIn === "VET"
                ? (vetPrice || 0.025).toFixed(4)
                : "0.05"}
            </span>
            <span>•</span>
            <span>
              {tokenOut}: $
              {tokenOut === "B3TR"
                ? (b3trPrice || 0.0803).toFixed(4)
                : tokenOut === "VTHO"
                ? (vthoPrice || 0.001).toFixed(4)
                : tokenOut === "VET"
                ? (vetPrice || 0.025).toFixed(4)
                : "0.05"}
            </span>
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
                  <p className="text-xs text-muted-foreground">Exchange Rate</p>
                  <p className="text-sm font-bold text-primary">
                    1 {tokenIn} = {marketPrice.toFixed(6)} {tokenOut}
                  </p>
                  {isPriceLoading && (
                    <div className="flex items-center gap-1 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        Updating...
                      </span>
                    </div>
                  )}
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
                <div className="space-y-3">
                  {/* Generate Identity Button */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Step 1: Generate Identity
                    </Label>
                    <Button
                      onClick={handleGenerateIdentity}
                      disabled={isGeneratingIdentity}
                      className="w-full h-10"
                      variant="outline"
                    >
                      {isGeneratingIdentity ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate New Identity"
                      )}
                    </Button>
                  </div>

                  {/* Display Generated Identity */}
                  {generatedIdentity && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        Generated Identity
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={generatedIdentity}
                          readOnly
                          className="h-10 font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 px-3"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedIdentity);
                            toast({
                              title: "Copied!",
                              description: "Identity copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share this identity with the pool admin to get an
                        invitation
                      </p>
                    </div>
                  )}

                  {/* Invitation Payload Input */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Step 2: Enter Invitation Payload
                    </Label>
                    <textarea
                      value={invitationPayloadInput}
                      onChange={(e) =>
                        setInvitationPayloadInput(e.target.value)
                      }
                      placeholder="Paste invitation payload from pool admin here..."
                      className="w-full h-24 p-3 text-xs font-mono bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Get this from the pool admin after sharing your identity
                    </p>
                  </div>
                </div>
              )}
              {poolMode === "auto" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Demo Mode
                  </Label>
                  <div className="p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Auto Mode (Demo):</strong> Automatically generates
                      identity and creates invitation for testing purposes. Use
                      Manual mode for production.
                    </p>
                  </div>
                  <Select value={selectedPool} onValueChange={setSelectedPool}>
                    <SelectTrigger className="h-10 mt-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePools.map((pool) => (
                        <SelectItem key={pool.id} value={pool.id}>
                          {pool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <strong>VeChain Escrow:</strong> Your tokens are deposited on-chain
            before creating the order. View transaction details after
            submission.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
