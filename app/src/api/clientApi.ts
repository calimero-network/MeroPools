import { type ApiResponse } from "@calimero-network/calimero-client";

export type UserId = string;

export enum ClientMethod {
  SUBMIT_ORDER = "submit_order",
  CANCEL_ORDER = "cancel_order",
  JOIN_MATCHING_POOL = "join_matching_pool",
  RUN_BATCH_MATCHING = "run_batch_matching",
  SUBMIT_SETTLEMENT_RESULT = "submit_settlement_result",
  GET_USER_ORDERS = "get_user_orders",
  GET_BATCH_RESULT = "get_batch_result",
  GET_BATCH_ORDERS = "get_batch_orders",
  GET_MODE = "get_mode",
}

export enum OperatingMode {
  UserPrivate = "UserPrivate",
  MatchingPool = "MatchingPool",
}

export enum OrderStatus {
  Active = "Active",
  Cancelled = "Cancelled",
  PartiallyMatched = "PartiallyMatched",
  FullyMatched = "FullyMatched",
  Expired = "Expired",
}

export interface PoolConfig {
  pool_name: string;
  min_order_amount: string;
  max_order_amount: string;
  supported_tokens: string[];
  batch_frequency_seconds: number;
  fee_basis_points: number;
  created_at: number;
}

export interface OrderCommitment {
  commitment_hash: number[]; 
  encrypted_payload: number[]; 
  nullifier_seed: number[]; 
  proof_of_funds: number[]; s
  timestamp: number;
  expiry: number;
}

export interface UserOrder {
  id: string;
  user_id: UserId;
  commitment: OrderCommitment;
  token_deposited: string;
  amount_deposited: string;
  escrow_confirmed: boolean;
  vechain_address: string;
  expected_price: string;
  expected_exchange_token: string;
  spread: number;
  time_limit: number;
  order_context_id: string;
  user_context_id: string;
  status: OrderStatus;
  matched: boolean;
  settlement_tx?: string;
  transaction_id?: string;
  created_at: number;
  updated_at: number;
}

export interface BatchMatchResult {
  batch_id: string;
  matched_orders: [string, string][];
  clearing_price: string;
  total_volume: string;
  nullifiers: string[];
  timestamp: number;
}

export interface ClientApi {
  submitOrder(
    commitment: OrderCommitment,
    token_deposited: string,
    amount_deposited: string,
    escrow_confirmed: boolean,
    vechain_address: string,
    expected_price: string,
    expected_exchange_token: string,
    spread: number,
    time_limit: number
  ): ApiResponse<string>;

  cancelOrder(order_id: string): ApiResponse<void>;

  joinMatchingPool(): ApiResponse<void>;

  runBatchMatching(): ApiResponse<string>;

  submitSettlementResult(batch_id: string, tx_hash: string): ApiResponse<void>;

  getUserOrders(user_id: UserId): ApiResponse<UserOrder[]>;

  getBatchResult(batch_id: string): ApiResponse<BatchMatchResult | null>;

  getBatchOrders(
    batch_id: string
  ): ApiResponse<{ result: BatchMatchResult; orders: UserOrder[] } | null>;

  getMode(): ApiResponse<OperatingMode>;
}
