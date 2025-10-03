import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { ClientApiDataSource } from "@/api/datasource/ClientApiDataSource";
import {
  type UserOrder,
  type BatchMatchResult,
  type PoolConfig,
} from "@/api/clientApi";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const api = new ClientApiDataSource(app as never);

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
      if (users && typeof users === "object" && "result" in users) {
        const result = users.result as Record<string, unknown>;
        if ("output" in result) {
          users = result.output as string[];
        } else {
          users = result as unknown as string[];
        }
      }

      // Extract orders from response
      let orders: UserOrder[] | unknown = ordersResponse.data;
      if (orders && typeof orders === "object" && "result" in orders) {
        const result = orders.result as Record<string, unknown>;
        if ("output" in result) {
          orders = result.output as UserOrder[];
        } else {
          orders = result as unknown as UserOrder[];
        }
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

      const batchId = response.data as string;

      const batchResponse = await api.getBatchOrders(batchId);
      if (batchResponse.error) {
        throw new Error(batchResponse.error.message);
      }

      if (batchResponse.data) {
        const { result, orders } = batchResponse.data as {
          result: BatchMatchResult;
          orders: UserOrder[];
        };
        setMatchedBatches((prev) => [...prev, { batch: result, orders }]);
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

  async function handleSettleBatch(batchId: string, _orders: UserOrder[]) {
    setSettling(batchId);
    try {
      // TODO: Implement VeChain settlement
      // This would call the DarkPoolSettlement contract's settleTrade function
      // For now, we'll just show a placeholder toast

      toast({
        title: "Settlement Initiated",
        description: (
          <div className="space-y-2">
            <p>VeChain settlement will be implemented here.</p>
            <p className="text-xs text-muted-foreground">
              This will call settleTrade() on the DarkPoolSettlement contract
            </p>
          </div>
        ),
      });

      // Mock transaction hash for now
      const mockTxHash = "0x" + Math.random().toString(16).slice(2, 66);

      // Submit settlement result
      await api.submitSettlementResult(batchId, mockTxHash);

      toast({
        variant: "success",
        title: "Settlement Recorded",
        description: (
          <div className="space-y-2">
            <p>Settlement recorded in context</p>
            <a
              href={`https://explore-testnet.vechain.org/transactions/${mockTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View transaction <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ),
      });

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
              Matched Batches
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchedBatches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting settlement
            </p>
          </CardContent>
        </Card>
      </div>

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
            <CardTitle>Matched Batches</CardTitle>
            <CardDescription>
              Batches ready for settlement on VeChain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchedBatches.map(({ batch, orders }, index) => (
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
                      onClick={() => handleSettleBatch(batch.batch_id, orders)}
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
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="font-medium">
                        {new Date(batch.timestamp / 1000000).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Orders in batch:
                    </p>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-background/50 rounded p-2 text-xs flex items-center justify-between"
                      >
                        <span>{order.id}</span>
                        <span className="text-muted-foreground">
                          {formatAmount(order.amount_deposited)}{" "}
                          {order.token_deposited}
                        </span>
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
