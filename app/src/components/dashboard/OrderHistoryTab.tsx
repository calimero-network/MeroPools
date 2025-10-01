"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Filter } from "lucide-react"
import { motion } from "framer-motion"

type OrderStatus = "Created" | "Deposited" | "Matched" | "Completed" | "Cancelled"

interface Order {
  id: string
  tokenIn: string
  tokenOut: string
  amount: number
  status: OrderStatus
  txHash?: string
  timestamp: string
}

const mockOrders: Order[] = [
  {
    id: "ORD-001",
    tokenIn: "B3TR",
    tokenOut: "USDC",
    amount: 100,
    status: "Completed",
    txHash: "0x1234...5678",
    timestamp: "2025-09-29 14:32",
  },
  {
    id: "ORD-002",
    tokenIn: "USDC",
    tokenOut: "VET",
    amount: 500,
    status: "Matched",
    timestamp: "2025-09-30 09:15",
  },
  {
    id: "ORD-003",
    tokenIn: "B3TR",
    tokenOut: "USDC",
    amount: 250,
    status: "Deposited",
    timestamp: "2025-09-30 12:45",
  },
  {
    id: "ORD-004",
    tokenIn: "VET",
    tokenOut: "USDC",
    amount: 1000,
    status: "Created",
    timestamp: "2025-09-30 15:20",
  },
]

export default function OrderHistoryTab() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all")

  const filteredOrders = filter === "all" 
    ? mockOrders 
    : mockOrders.filter(order => order.status === filter)

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-500 border-green-500/30"
      case "Matched":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30"
      case "Deposited":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
      case "Created":
        return "bg-primary/20 text-primary border-primary/30"
      case "Cancelled":
        return "bg-red-500/20 text-red-500 border-red-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order History</h2>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="Created">Created</SelectItem>
              <SelectItem value="Deposited">Deposited</SelectItem>
              <SelectItem value="Matched">Matched</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Order ID</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Tokens</th>
              <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground">Amount</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground">Timestamp</th>
              <th className="text-center py-4 px-6 text-sm font-semibold text-muted-foreground">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((order, index) => (
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
                    <span className="font-semibold">{order.tokenIn}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">{order.tokenOut}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right font-semibold">{order.amount}</td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-muted-foreground">{order.timestamp}</td>
                <td className="py-4 px-6">
                  {order.txHash ? (
                    <a
                      href={`https://explore.vechain.org/transactions/${order.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-primary hover:text-primary/80 transition-colors"
                    >
                      <span className="text-sm font-mono">{order.txHash}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm text-center block">—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold">{order.id}</span>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{order.tokenIn}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold">{order.tokenOut}</span>
              <span className="ml-auto font-semibold">{order.amount}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{order.timestamp}</span>
              {order.txHash && (
                <a
                  href={`https://explore.vechain.org/transactions/${order.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary"
                >
                  <span>{order.txHash}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No orders found</p>
        </div>
      )}
    </div>
  )
}