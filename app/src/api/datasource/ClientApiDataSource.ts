import {
  type ApiResponse,
  type RpcQueryParams,
  rpcClient,
  getAuthConfig,
} from "@calimero-network/calimero-client";
import type {
  ClientApi,
  OrderCommitment,
  UserOrder,
  BatchMatchResult,
  OperatingMode,
  UserId,
} from "../clientApi";
import { ClientMethod } from "../clientApi";

const RequestConfig = { timeout: 30000 };

function getErrorMessage(error: unknown): string {
  const err = error as Record<string, unknown>;
  if (
    err?.type === "Uninitialized" ||
    (typeof err?.message === "string" && err.message.includes("Uninitialized"))
  ) {
    return "Syncing state, Please wait and retry.";
  }
  if (
    (err?.error as Record<string, unknown>)?.name === "UnknownServerError" &&
    typeof (err?.error as Record<string, unknown>)?.cause === "object"
  ) {
    return "Syncing state, Please wait and retry.";
  }
  if (typeof error === "string") return error;
  if (typeof err?.message === "string") return err.message;
  if (err?.data) return JSON.stringify(err.data);
  return "An unexpected error occurred";
}

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

/**
 * Data source implementation for MeroPools Client API operations.
 * Handles order submission, cancellation, batch matching, and settlement.
 */
export class ClientApiDataSource implements ClientApi {
  private app: CalimeroApp | null;

  constructor(app?: CalimeroApp) {
    this.app = app || null;
  }

  async submitOrder(
    commitment: OrderCommitment,
    token_deposited: string,
    amount_deposited: string,
    escrow_confirmed: boolean,
    vechain_address: string,
    expected_price: string,
    expected_exchange_token: string,
    spread: number,
    time_limit: number
  ): ApiResponse<string> {
    try {
      if (this.app) {
        const params = {
          commitment,
          token_deposited,
          amount_deposited: parseInt(amount_deposited, 10),
          escrow_confirmed,
          vechain_address,
          expected_price: parseInt(expected_price, 10),
          expected_exchange_token,
          spread,
          time_limit,
        };

        const result = await this.app.execute(
          this.app.getContext(),
          ClientMethod.SUBMIT_ORDER,
          params
        );

        return {
          data: (result.data || result) as string,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();

        const argsJson = {
          commitment,
          token_deposited,
          amount_deposited: parseInt(amount_deposited, 10),
          escrow_confirmed,
          vechain_address,
          expected_price: parseInt(expected_price, 10),
          expected_exchange_token,
          spread,
          time_limit,
        };

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.SUBMIT_ORDER,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<string>);

        return {
          data: response.result as string,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in submitOrder:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async cancelOrder(order_id: string): ApiResponse<void> {
    try {
      if (this.app) {
        const params = { order_id };

        await this.app.execute(
          this.app.getContext(),
          ClientMethod.CANCEL_ORDER,
          params
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();
        const argsJson = { order_id };

        await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.CANCEL_ORDER,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<void>);

        return {
          data: undefined,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in cancelOrder:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async joinMatchingPool(): ApiResponse<void> {
    try {
      if (this.app) {
        await this.app.execute(
          this.app.getContext(),
          ClientMethod.JOIN_MATCHING_POOL,
          {}
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();

        await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.JOIN_MATCHING_POOL,
          argsJson: {},
          config: RequestConfig,
        } as unknown as RpcQueryParams<void>);

        return {
          data: undefined,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in joinMatchingPool:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async runBatchMatching(): ApiResponse<string> {
    try {
      if (this.app) {
        const result = await this.app.execute(
          this.app.getContext(),
          ClientMethod.RUN_BATCH_MATCHING,
          {}
        );

        return {
          data: (result.data || result) as string,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.RUN_BATCH_MATCHING,
          argsJson: {},
          config: RequestConfig,
        } as unknown as RpcQueryParams<string>);

        return {
          data: response.result as string,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in runBatchMatching:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async submitSettlementResult(
    batch_id: string,
    tx_hash: string
  ): ApiResponse<void> {
    try {
      if (this.app) {
        const params = { batch_id, tx_hash };

        await this.app.execute(
          this.app.getContext(),
          ClientMethod.SUBMIT_SETTLEMENT_RESULT,
          params
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();
        const argsJson = { batch_id, tx_hash };

        await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.SUBMIT_SETTLEMENT_RESULT,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<void>);

        return {
          data: undefined,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error(
        "ClientApiDataSource: Error in submitSettlementResult:",
        error
      );
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getUserOrders(user_id: UserId): ApiResponse<UserOrder[]> {
    try {
      if (this.app) {
        const params = { user_id };

        const result = await this.app.query(
          this.app.getContext(),
          ClientMethod.GET_USER_ORDERS,
          params
        );

        return {
          data: (result.data || result) as UserOrder[],
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();
        const argsJson = { user_id };

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.GET_USER_ORDERS,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<UserOrder[]>);

        return {
          data: response.result as UserOrder[],
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getUserOrders:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getBatchResult(batch_id: string): ApiResponse<BatchMatchResult | null> {
    try {
      if (this.app) {
        const params = { batch_id };

        const result = await this.app.query(
          this.app.getContext(),
          ClientMethod.GET_BATCH_RESULT,
          params
        );

        return {
          data: (result.data || result) as BatchMatchResult | null,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();
        const argsJson = { batch_id };

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.GET_BATCH_RESULT,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<BatchMatchResult | null>);

        return {
          data: response.result as BatchMatchResult | null,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getBatchResult:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getBatchOrders(
    batch_id: string
  ): ApiResponse<{ result: BatchMatchResult; orders: UserOrder[] } | null> {
    try {
      if (this.app) {
        const params = { batch_id };

        const result = await this.app.query(
          this.app.getContext(),
          ClientMethod.GET_BATCH_ORDERS,
          params
        );

        return {
          data: (result.data || result) as {
            result: BatchMatchResult;
            orders: UserOrder[];
          } | null,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();
        const argsJson = { batch_id };

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.GET_BATCH_ORDERS,
          argsJson,
          config: RequestConfig,
        } as unknown as RpcQueryParams<{ result: BatchMatchResult; orders: UserOrder[] } | null>);

        return {
          data: response.result as {
            result: BatchMatchResult;
            orders: UserOrder[];
          } | null,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getBatchOrders:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getMode(): ApiResponse<OperatingMode> {
    try {
      if (this.app) {
        const result = await this.app.query(
          this.app.getContext(),
          ClientMethod.GET_MODE,
          {}
        );

        return {
          data: (result.data || result) as OperatingMode,
          error: null,
        };
      } else {
        const authConfig = getAuthConfig();

        const response = await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.GET_MODE,
          argsJson: {},
          config: RequestConfig,
        } as unknown as RpcQueryParams<OperatingMode>);

        return {
          data: (response.result || response) as unknown as OperatingMode,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getMode:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }
}
