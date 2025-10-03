import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Filter, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ClientApiDataSource } from "@/api/datasource/ClientApiDataSource";
import type { UserOrder, OrderStatus as ApiOrderStatus } from "@/api/clientApi";

type OrderStatus =
  | "Active"
  | "Cancelled"
  | "PartiallyMatched"
  | "FullyMatched"
  | "Expired";

interface OrderHistoryTabProps {
  app?: unknown;
  userId?: string;
}

export default function OrderHistoryTab({ app, userId }: OrderHistoryTabProps) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) {
        setError("User ID not available. Please connect to Calimero.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const api = new ClientApiDataSource(app as never);
        const response = await api.getUserOrders(userId);

        console.log("getUserOrders response:", response);

        if (response.error) {
          setError(response.error.message || "Failed to fetch orders");
        } else {
          const ordersData = response.data;
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          } else if (ordersData && typeof ordersData === "object") {
            console.log("Orders data is not an array, received:", ordersData);

            const dataObj = ordersData as Record<string, unknown>;
            if ("orders" in dataObj && Array.isArray(dataObj.orders)) {
              setOrders(dataObj.orders as UserOrder[]);
            } else {
              setOrders([]);
            }
          } else {
            console.warn("Unexpected orders data format:", ordersData);
            setOrders([]);
          }
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [app, userId]);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => {
          const status = getStatusString(order.status);
          return status === filter;
        });

  const safeFilteredOrders = Array.isArray(filteredOrders)
    ? filteredOrders
    : [];

  const getStatusString = (status: ApiOrderStatus): string => {
    if (typeof status === "string") {
      return status;
    }
    if (status && typeof status === "object" && "PartiallyMatched" in status) {
      return "PartiallyMatched";
    }
    return "Active";
  };

  const getStatusColor = (status: ApiOrderStatus) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case "FullyMatched":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "PartiallyMatched":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "Active":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "Cancelled":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      case "Expired":
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp / 1_000_000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amountWei: string): string => {
    try {
      const amount = parseFloat(amountWei) / 1e18;
      return amount.toFixed(2);
    } catch {
      return "0.00";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order History</h2>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as "all" | OrderStatus)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="PartiallyMatched">
                Partially Matched
              </SelectItem>
              <SelectItem value="FullyMatched">Fully Matched</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading orders...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">
              Error Loading Orders
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && !error && (
        <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Order ID
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Tokens
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Timestamp
                </th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-muted-foreground">
                  Settlement Tx
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {safeFilteredOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-6 font-mono text-sm">{order.id}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {order.token_deposited}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-semibold">
                        {order.expected_exchange_token}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-semibold">
                    {formatAmount(order.amount_deposited)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusString(order.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground">
                    {formatTimestamp(order.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    {order.settlement_tx ? (
                      <a
                        href={`https://explore.vechain.org/transactions/${order.settlement_tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-primary hover:text-primary/80 transition-colors"
                      >
                        <span className="text-sm font-mono">
                          {order.settlement_tx.slice(0, 6)}...
                          {order.settlement_tx.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm text-center block">
                        —
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && !error && (
        <div className="md:hidden space-y-3">
          {safeFilteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold">
                  {order.id}
                </span>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusString(order.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{order.token_deposited}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold">
                  {order.expected_exchange_token}
                </span>
                <span className="ml-auto font-semibold">
                  {formatAmount(order.amount_deposited)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTimestamp(order.created_at)}</span>
                {order.settlement_tx && (
                  <a
                    href={`https://explore.vechain.org/transactions/${order.settlement_tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary"
                  >
                    <span>
                      {order.settlement_tx.slice(0, 6)}...
                      {order.settlement_tx.slice(-4)}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && !error && safeFilteredOrders.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "No orders found. Start trading to see your order history!"
              : `No ${filter} orders found`}
          </p>
        </div>
      )}
    </div>
  );
}
