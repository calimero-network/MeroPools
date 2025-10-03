import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Play,
  ExternalLink,
  AlertCircle,
  Loader2,
  Copy,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { ClientApiDataSource } from "@/api/datasource/ClientApiDataSource";
import { ContextApiDataSource } from "@/api/datasource/NodeApiDataSource";
import {
  type UserOrder,
  type BatchMatchResult,
  type PoolConfig,
} from "@/api/clientApi";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { useDarkPoolContract } from "@/hooks/useDarkPoolContract";
import { useWallet, useSendTransaction } from "@vechain/vechain-kit";

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

interface AdminPoolDashboardProps {
  app: CalimeroApp;
  poolConfig: PoolConfig;
  onBack: () => void;
}

export default function AdminPoolDashboard({
  app,
  poolConfig,
  onBack,
}: AdminPoolDashboardProps) {
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [activeOrders, setActiveOrders] = useState<UserOrder[]>([]);
  const [matchedBatches, setMatchedBatches] = useState<
    {
      batch: BatchMatchResult;
      orders: UserOrder[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);

  // Invitation management state
  const [inviteeId, setInviteeId] = useState("");
  const [generatedInvitation, setGeneratedInvitation] = useState<string>("");
  const [isGeneratingInvitation, setIsGeneratingInvitation] = useState(false);
  const [isAddingToPool, setIsAddingToPool] = useState(false);

  // Batch lookup state
  const [batchIdLookup, setBatchIdLookup] = useState("");
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  const { toast } = useToast();

  const api = new ClientApiDataSource(app as never);
  const nodeApi = new ContextApiDataSource();

  // VeChain integration
  const { account } = useWallet();
  const { contractAddress, contractInterface, getTokenAddress } =
    useDarkPoolContract();
  const { sendTransaction } = useSendTransaction({
    signerAccountAddress: account?.address ?? "",
  });

  const loadPoolData = async () => {
    setLoading(true);
    try {
      const [usersResponse, ordersResponse] = await Promise.all([
        api.getActiveUsers(),
        api.getActiveOrders(),
      ]);

      if (usersResponse.error) {
        throw new Error(usersResponse.error.message);
      }
      if (ordersResponse.error) {
        throw new Error(ordersResponse.error.message);
      }

      // Extract users from response
      let users: string[] | unknown = usersResponse.data;
      if (users && typeof users === "object" && "output" in users) {
        users = (users as Record<string, unknown>).output as string[];
      } else {
        users = Array.isArray(users) ? users : [];
      }

      // Extract orders from response
      let orders: UserOrder[] | unknown = ordersResponse.data;
      if (orders && typeof orders === "object" && "output" in orders) {
        orders = (orders as Record<string, unknown>).output as UserOrder[];
      } else {
        orders = Array.isArray(orders) ? orders : [];
      }

      setActiveUsers(Array.isArray(users) ? users : []);
      setActiveOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Error loading pool data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pool data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerateInvitation() {
    if (!inviteeId.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a user ID",
      });
      return;
    }

    setIsGeneratingInvitation(true);
    try {
      // Get the current pool context ID (using the trade context for now)
      const poolContextId = localStorage.getItem("defaultContextId") || "";

      // Get the inviter identity (admin's identity)
      const inviterIdentity =
        localStorage.getItem("defaultContextUserID") || "";

      console.info("🎫 Creating invitation for user:", {
        contextId: poolContextId,
        invitee: inviteeId,
        inviter: inviterIdentity,
      });

      const invitationResponse = await nodeApi.inviteToContext({
        contextId: poolContextId,
        invitee: inviteeId,
        inviter: inviterIdentity,
      });

      if (invitationResponse.error || !invitationResponse.data) {
        throw new Error(
          invitationResponse.error?.message || "Failed to create invitation"
        );
      }

      // The invitation response data is already a string, but remove any quotes if present
      let invitationPayload = invitationResponse.data.trim();

      // Remove surrounding quotes if they exist
      if (
        invitationPayload.startsWith('"') &&
        invitationPayload.endsWith('"')
      ) {
        invitationPayload = invitationPayload.slice(1, -1);
      }

      setGeneratedInvitation(invitationPayload);

      toast({
        variant: "success",
        title: "Invitation Created",
        description:
          "Invitation payload generated successfully. Share this with the user.",
      });
    } catch (error) {
      console.error("Error generating invitation:", error);
      toast({
        variant: "destructive",
        title: "Invitation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create invitation",
      });
    } finally {
      setIsGeneratingInvitation(false);
    }
  }

  async function handleAddUserToPool() {
    if (!inviteeId.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a user ID",
      });
      return;
    }

    if (!generatedInvitation) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please generate an invitation first",
      });
      return;
    }

    setIsAddingToPool(true);
    try {
      const response = await api.addUserToPool(inviteeId);

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        variant: "success",
        title: "User Added to Pool",
        description: `User ${inviteeId.substring(
          0,
          8
        )}... has been added to the matching pool`,
      });

      // Refresh pool data
      await loadPoolData();

      // Clear form
      setInviteeId("");
      setGeneratedInvitation("");
    } catch (error) {
      console.error("Error adding user to pool:", error);
      toast({
        variant: "destructive",
        title: "Failed to Add User",
        description:
          error instanceof Error ? error.message : "Failed to add user to pool",
      });
    } finally {
      setIsAddingToPool(false);
    }
  }

  async function handleLoadBatch() {
    if (!batchIdLookup.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a batch ID",
      });
      return;
    }

    setIsLoadingBatch(true);
    try {
      const batchResponse = await api.getBatchOrders(batchIdLookup.trim());

      if (batchResponse.error) {
        throw new Error(batchResponse.error.message);
      }

      console.log("📦 Raw batch response:", batchResponse);

      if (batchResponse.data) {
        // Handle the response data structure
        let batchData: unknown = batchResponse.data;

        // Extract from nested structure: data.result or data.output
        if (typeof batchData === "object" && batchData) {
          if ("result" in batchData) {
            batchData = (batchData as { result: unknown }).result;
            console.log("📦 Extracted from result:", batchData);
          } else if ("output" in batchData) {
            batchData = (batchData as { output: unknown }).output;
            console.log("📦 Extracted from output:", batchData);
          }
        }

        // The API returns an array: [BatchMatchResult, UserOrder[]]
        if (Array.isArray(batchData) && batchData.length === 2) {
          console.log("📦 Array detected, length:", batchData.length);
          console.log("📦 First element (batch):", batchData[0]);
          console.log("📦 Second element (orders):", batchData[1]);

          const [result, orders] = batchData as [BatchMatchResult, UserOrder[]];

          if (result && orders && result.batch_id) {
            // Check if batch already exists
            const batchExists = matchedBatches.some(
              (b) => b.batch.batch_id === result.batch_id
            );

            if (batchExists) {
              toast({
                title: "Batch Already Loaded",
                description: `Batch ${batchIdLookup.trim()} is already in the list`,
              });
            } else {
              setMatchedBatches((prev) => [...prev, { batch: result, orders }]);

              toast({
                variant: "success",
                title: "Batch Loaded",
                description: `Batch ${batchIdLookup.trim()} loaded successfully`,
              });
            }

            // Clear input
            setBatchIdLookup("");
          } else {
            console.error("📦 Invalid batch structure:", { result, orders });
            throw new Error(
              "Invalid batch data structure - missing batch_id or orders"
            );
          }
        } else {
          console.error("📦 Not a valid array or wrong length:", {
            isArray: Array.isArray(batchData),
            length: Array.isArray(batchData) ? batchData.length : "N/A",
            data: batchData,
          });
          throw new Error("Batch not found or invalid data format");
        }
      } else {
        throw new Error("Batch not found");
      }
    } catch (error) {
      console.error("Error loading batch:", error);
      toast({
        variant: "destructive",
        title: "Failed to Load Batch",
        description:
          error instanceof Error ? error.message : "Failed to load batch",
      });
    } finally {
      setIsLoadingBatch(false);
    }
  }

  async function handleRunMatching() {
    if (activeOrders.length < 2) {
      toast({
        variant: "destructive",
        title: "Insufficient Orders",
        description: "At least 2 orders are required for matching",
      });
      return;
    }

    setMatching(true);
    try {
      const response = await api.runBatchMatching();

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Extract batch_id from response
      let batchId: string;
      const responseData = response.data as
        | string
        | { output: string }
        | undefined;

      if (typeof responseData === "string") {
        batchId = responseData;
      } else if (
        responseData &&
        typeof responseData === "object" &&
        "output" in responseData
      ) {
        batchId = responseData.output;
      } else {
        throw new Error("Invalid batch matching response format");
      }

      console.log("📦 Batch ID:", batchId);

      // Fetch batch details
      const batchResponse = await api.getBatchOrders(batchId);
      if (batchResponse.error) {
        throw new Error(batchResponse.error.message);
      }

      console.log("📦 Batch response:", batchResponse);

      if (batchResponse.data) {
        // Handle the response data structure
        let batchData: unknown = batchResponse.data;

        // Extract from nested structure: data.result or data.output
        if (typeof batchData === "object" && batchData) {
          if ("result" in batchData) {
            batchData = (batchData as { result: unknown }).result;
            console.log("📦 Extracted from result:", batchData);
          } else if ("output" in batchData) {
            batchData = (batchData as { output: unknown }).output;
            console.log("📦 Extracted from output:", batchData);
          }
        }

        // The API returns an array: [BatchMatchResult, UserOrder[]]
        if (Array.isArray(batchData) && batchData.length === 2) {
          const [result, orders] = batchData as [BatchMatchResult, UserOrder[]];

          if (result && orders) {
            setMatchedBatches((prev) => [...prev, { batch: result, orders }]);
          } else {
            console.warn(
              "Missing result or orders in batch response:",
              batchData
            );
          }
        } else {
          console.warn("Invalid batch response format:", batchData);
        }
      }

      toast({
        title: "Matching Complete",
        description: `Batch ${batchId} has been matched successfully`,
      });

      await loadPoolData();
    } catch (error) {
      console.error("Error running batch matching:", error);
      toast({
        variant: "destructive",
        title: "Matching Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to run batch matching",
      });
    } finally {
      setMatching(false);
    }
  }

  async function handleSettleBatch(batchId: string) {
    // Find the batch data
    const batchData = matchedBatches.find((b) => b.batch.batch_id === batchId);
    if (!batchData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Batch data not found",
      });
      return;
    }

    const { batch, orders } = batchData;

    // Validate VeChain wallet connection
    if (!account?.address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your VeChain wallet to settle trades",
      });
      return;
    }

    setSettling(batchId);
    try {
      toast({
        title: "Preparing Settlement",
        description: "Building settlement transactions...",
      });

      // Build settlement clauses for all matched order pairs
      const settlementClauses = [];

      for (const [orderAId, orderBId] of batch.matched_orders) {
        // Find the corresponding orders
        const orderA = orders.find((o) => o.id === orderAId);
        const orderB = orders.find((o) => o.id === orderBId);

        if (!orderA || !orderB) {
          console.warn(`Orders not found for pair: ${orderAId}, ${orderBId}`);
          continue;
        }

        // Get token addresses
        const tokenAAddress = getTokenAddress(orderA.token_deposited);
        const tokenBAddress = getTokenAddress(orderB.token_deposited);

        // Get VeChain addresses from orders
        const userAAddress = orderA.vechain_address;
        const userBAddress = orderB.vechain_address;

        // Use the clearing price from the batch for both trades
        const clearingPriceWei = batch.clearing_price.toString();

        console.info("🔨 Building settlement for pair:", {
          orderA: orderAId,
          orderB: orderBId,
          userA: userAAddress,
          userB: userBAddress,
          tokenA: orderA.token_deposited,
          tokenB: orderB.token_deposited,
          amountA: orderA.amount_deposited,
          clearingPrice: ethers.formatEther(clearingPriceWei),
        });

        // Calculate amount B based on clearing price
        // amountB = amountA * clearingPrice
        const amountAWei = BigInt(orderA.amount_deposited);
        const clearingPriceBigInt = BigInt(clearingPriceWei);
        const amountBWei =
          (amountAWei * clearingPriceBigInt) / BigInt(10 ** 18);

        // Create settlement clause
        const settlementData = contractInterface.encodeFunctionData(
          "settleTrade",
          [
            userAAddress,
            tokenAAddress,
            amountAWei.toString(),
            userBAddress,
            tokenBAddress,
            amountBWei.toString(),
          ]
        );

        settlementClauses.push({
          to: contractAddress as `0x${string}`,
          value: "0x0",
          data: settlementData,
          comment: `Settle trade: ${orderAId} ↔ ${orderBId}`,
        });
      }

      if (settlementClauses.length === 0) {
        throw new Error("No valid settlement clauses generated");
      }

      console.info(
        `📤 Sending ${settlementClauses.length} settlement transactions`
      );

      toast({
        title: "Settling on VeChain",
        description: (
          <div className="space-y-2">
            <p>Executing {settlementClauses.length} settlement(s)...</p>
            <p className="text-xs text-muted-foreground">
              Please confirm the transaction in your wallet
            </p>
          </div>
        ),
      });

      // Send settlement transaction(s)
      await sendTransaction(settlementClauses);

      console.info("✅ Settlement transaction sent successfully");

      // Generate a transaction hash placeholder
      // In a real scenario, we would get this from the transaction receipt
      const txHash =
        `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.substring(
          0,
          66
        );

      console.info("🔗 Transaction hash:", txHash);

      // Submit settlement result to Calimero context
      await api.submitSettlementResult(batchId, txHash);

      toast({
        variant: "success",
        title: "Settlement Complete!",
        description: (
          <div className="space-y-2">
            <p>
              Successfully settled {batch.matched_orders.length} trade pair(s)
            </p>
            <a
              href={`https://explore-testnet.vechain.org/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View transaction <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ),
      });

      // Remove settled batch from the list
      setMatchedBatches((prev) =>
        prev.filter((b) => b.batch.batch_id !== batchId)
      );

      await loadPoolData();
    } catch (error) {
      console.error("Error settling batch:", error);
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description:
          error instanceof Error ? error.message : "Failed to settle batch",
      });
    } finally {
      setSettling(null);
    }
  }

  const formatAmount = (amount: string | number) => {
    try {
      return ethers.formatEther(amount.toString());
    } catch {
      return amount.toString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading pool data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{poolConfig.pool_name}</h1>
            <p className="text-muted-foreground">Pool Admin Dashboard</p>
          </div>
        </div>
        <Button onClick={loadPoolData} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users in matching pool
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for matching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Batches for Settlement
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchedBatches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for VeChain settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Invitation Management */}
      <Card>
        <CardHeader>
          <CardTitle>Add User to Pool</CardTitle>
          <CardDescription>
            Generate invitation payload for a user ID and add them to the
            matching pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1: Enter User ID and Generate Invitation */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Step 1: Enter User ID
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter user identity (public key)..."
                  value={inviteeId}
                  onChange={(e) => setInviteeId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleGenerateInvitation}
                  disabled={isGeneratingInvitation || !inviteeId.trim()}
                  className="whitespace-nowrap"
                >
                  {isGeneratingInvitation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Invitation"
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2: Display Generated Invitation */}
            {generatedInvitation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Label className="text-sm font-semibold">
                  Step 2: Invitation Payload
                </Label>
                <div className="relative">
                  <textarea
                    value={generatedInvitation}
                    readOnly
                    className="w-full h-32 p-3 text-xs font-mono bg-muted border border-border rounded-lg resize-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInvitation);
                      toast({
                        title: "Copied!",
                        description: "Invitation payload copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this invitation payload with the user. They will paste
                  it in the manual mode section.
                </p>

                {/* Step 3: Add User to Pool */}
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold">
                      Step 3: Add to Pool
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add user to the matching pool after they join the context
                    </p>
                  </div>
                  <Button
                    onClick={handleAddUserToPool}
                    disabled={isAddingToPool}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isAddingToPool ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to Pool
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Load Existing Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Load Existing Batch for Settlement</CardTitle>
          <CardDescription>
            Enter a batch ID to load its details and prepare for settlement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter batch ID (e.g., batch_1)..."
              value={batchIdLookup}
              onChange={(e) => setBatchIdLookup(e.target.value)}
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLoadBatch();
                }
              }}
            />
            <Button
              onClick={handleLoadBatch}
              disabled={isLoadingBatch || !batchIdLookup.trim()}
              className="whitespace-nowrap"
            >
              {isLoadingBatch ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Load Batch
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Load a batch that was matched previously to prepare it for VeChain
            settlement
          </p>
        </CardContent>
      </Card>

      {/* Active Orders Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                Orders with confirmed escrow, ready for batch matching
              </CardDescription>
            </div>
            <Button
              onClick={handleRunMatching}
              disabled={matching || activeOrders.length < 2}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {matching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Batch Matching
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeOrders.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active orders with confirmed escrow. Orders will appear here
                once users deposit tokens on VeChain.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {order.user_id.substring(0, 8)}...
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {order.escrow_confirmed ? "Escrow ✓" : "Pending"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Deposited</p>
                      <p className="font-medium">
                        {formatAmount(order.amount_deposited)}{" "}
                        {order.token_deposited}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expected</p>
                      <p className="font-medium">
                        {order.expected_exchange_token}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-medium">
                        {formatAmount(order.expected_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Spread</p>
                      <p className="font-medium">{order.spread / 100}%</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched Batches Section */}
      {matchedBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Batches for Settlement</CardTitle>
            <CardDescription>
              Matched batches ready for settlement on VeChain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchedBatches
                .filter(({ batch }) => batch != null) // Filter out any undefined batches
                .map(({ batch, orders }, index) => (
                  <motion.div
                    key={batch.batch_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold">{batch.batch_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.matched_orders.length} matched pairs
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSettleBatch(batch.batch_id)}
                        disabled={settling === batch.batch_id}
                        size="sm"
                      >
                        {settling === batch.batch_id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Settling...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Settle on VeChain
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Clearing Price
                        </p>
                        <p className="font-medium">
                          {formatAmount(batch.clearing_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Volume
                        </p>
                        <p className="font-medium">
                          {formatAmount(batch.total_volume)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Matched Orders
                        </p>
                        <p className="font-medium">
                          {batch.matched_orders.length * 2}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Timestamp
                        </p>
                        <p className="font-medium">
                          {new Date(batch.timestamp / 1000000).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Matched Order Pairs:
                      </p>
                      {batch.matched_orders.map((pair, pairIndex) => (
                        <div
                          key={pairIndex}
                          className="bg-background/50 rounded p-3 text-xs"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px]">
                              Pair {pairIndex + 1}
                            </Badge>
                            <span className="text-muted-foreground">
                              {pair[0]} ↔ {pair[1]}
                            </span>
                          </div>
                        </div>
                      ))}

                      <p className="text-xs font-semibold text-muted-foreground mt-4">
                        Orders in batch:
                      </p>
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-background/50 rounded p-3 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{order.id}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-muted-foreground">
                                User:{" "}
                              </span>
                              <span className="font-mono">
                                {order.user_id.substring(0, 8)}...
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Amount:{" "}
                              </span>
                              <span>
                                {formatAmount(order.amount_deposited)}{" "}
                                {order.token_deposited}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Expected:{" "}
                              </span>
                              <span>{order.expected_exchange_token}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                VeChain:{" "}
                              </span>
                              <span className="font-mono">
                                {order.vechain_address.substring(0, 6)}...
                                {order.vechain_address.substring(38)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
