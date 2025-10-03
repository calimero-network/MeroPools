import {
  type ApiResponse,
  type RpcQueryParams,
  rpcClient,
  getAuthConfig,
  getAppEndpointKey,
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
import { DefaultContextService } from "../../services/DefaultContextService";

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

function getContextSpecificAuthConfig(
  agreementContextID: string,
  agreementContextUserID: string
) {
  const baseAuthConfig = getAuthConfig();
  return {
    appEndpointKey: getAppEndpointKey(),
    contextId: agreementContextID,
    executorPublicKey: agreementContextUserID,
    jwtToken: baseAuthConfig.jwtToken,
    error: null,
  };
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
    user_id: UserId,
    commitment: OrderCommitment,
    token_deposited: string,
    amount_deposited: string,
    escrow_confirmed: boolean,
    vechain_address: string,
    expected_price: string,
    expected_exchange_token: string,
    spread: number,
    time_limit: number,
    targetContextId?: string, // Optional: specify which context to submit to
    targetUserId?: string // Optional: specify which user ID to use for authentication
  ): ApiResponse<string> {
    try {
      // Determine auth config based on whether we're targeting a specific context
      const authConfig =
        targetContextId && targetUserId
          ? getContextSpecificAuthConfig(targetContextId, targetUserId)
          : getAuthConfig();

      const argsJson = {
        user_id,
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

      console.info("🔐 submitOrder RPC params:", {
        contextId: authConfig.contextId,
        executorPublicKey: authConfig.executorPublicKey,
        method: ClientMethod.SUBMIT_ORDER,
        targetContextId,
        targetUserId,
        user_id,
      });

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

  async cancelOrder(user_id: UserId, order_id: string): ApiResponse<void> {
    try {
      if (this.app) {
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const params = { user_id, order_id };

        await this.app.execute(
          defaultContext,
          ClientMethod.CANCEL_ORDER,
          params
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

        const argsJson = { user_id, order_id };

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

  async joinMatchingPool(user_id: UserId): ApiResponse<void> {
    try {
      if (this.app) {
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        await this.app.execute(
          defaultContext,
          ClientMethod.JOIN_MATCHING_POOL,
          { user_id }
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

        await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.JOIN_MATCHING_POOL,
          argsJson: { user_id },
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
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const result = await this.app.execute(
          defaultContext,
          ClientMethod.RUN_BATCH_MATCHING,
          {}
        );

        return {
          data: (result.data || result) as string,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

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
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const params = { batch_id, tx_hash };

        await this.app.execute(
          defaultContext,
          ClientMethod.SUBMIT_SETTLEMENT_RESULT,
          params
        );

        return {
          data: undefined,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

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
      // Always use RPC client for query operations
      const defaultContextService = DefaultContextService.getInstance(
        this.app || null
      );
      const defaultContext = defaultContextService.getStoredDefaultContext();

      let authConfig;
      if (defaultContext) {
        const baseAuthConfig = getAuthConfig();
        authConfig = {
          ...baseAuthConfig,
          contextId: defaultContext.contextId,
          executorPublicKey:
            defaultContext.memberPublicKey || baseAuthConfig.executorPublicKey,
        };
      } else {
        authConfig = getAuthConfig();
      }

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
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const params = { batch_id };

        const result = await this.app.query(
          defaultContext,
          ClientMethod.GET_BATCH_RESULT,
          params
        );

        return {
          data: (result.data || result) as BatchMatchResult | null,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

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
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const params = { batch_id };

        const result = await this.app.execute(
          defaultContext,
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
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

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
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        const result = await this.app.execute(
          defaultContext,
          ClientMethod.GET_MODE,
          {}
        );

        return {
          data: (result.data || result) as OperatingMode,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

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

  async getPoolConfig(): ApiResponse<import("../clientApi").PoolConfig | null> {
    try {
      const defaultContextService = DefaultContextService.getInstance(
        this.app || null
      );
      const defaultContext = defaultContextService.getStoredDefaultContext();

      let authConfig;
      if (defaultContext) {
        const baseAuthConfig = getAuthConfig();
        authConfig = {
          ...baseAuthConfig,
          contextId: defaultContext.contextId,
          executorPublicKey:
            defaultContext.memberPublicKey || baseAuthConfig.executorPublicKey,
        };
      } else {
        authConfig = getAuthConfig();
      }

      const response = await rpcClient.execute({
        ...authConfig,
        method: ClientMethod.GET_POOL_CONFIG,
        argsJson: {},
        config: RequestConfig,
      } as unknown as RpcQueryParams<import("../clientApi").PoolConfig | null>);

      return {
        data: response.result as import("../clientApi").PoolConfig | null,
        error: null,
      };
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getPoolConfig:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getActiveUsers(): ApiResponse<UserId[]> {
    try {
      const defaultContextService = DefaultContextService.getInstance(
        this.app || null
      );
      const defaultContext = defaultContextService.getStoredDefaultContext();

      let authConfig;
      if (defaultContext) {
        const baseAuthConfig = getAuthConfig();
        authConfig = {
          ...baseAuthConfig,
          contextId: defaultContext.contextId,
          executorPublicKey:
            defaultContext.memberPublicKey || baseAuthConfig.executorPublicKey,
        };
      } else {
        authConfig = getAuthConfig();
      }

      const response = await rpcClient.execute({
        ...authConfig,
        method: ClientMethod.GET_ACTIVE_USERS,
        argsJson: {},
        config: RequestConfig,
      } as unknown as RpcQueryParams<UserId[]>);

      return {
        data: response.result as UserId[],
        error: null,
      };
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getActiveUsers:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async getActiveOrders(): ApiResponse<UserOrder[]> {
    try {
      const defaultContextService = DefaultContextService.getInstance(
        this.app || null
      );
      const defaultContext = defaultContextService.getStoredDefaultContext();

      let authConfig;
      if (defaultContext) {
        const baseAuthConfig = getAuthConfig();
        authConfig = {
          ...baseAuthConfig,
          contextId: defaultContext.contextId,
          executorPublicKey:
            defaultContext.memberPublicKey || baseAuthConfig.executorPublicKey,
        };
      } else {
        authConfig = getAuthConfig();
      }

      const response = await rpcClient.execute({
        ...authConfig,
        method: ClientMethod.GET_ACTIVE_ORDERS,
        argsJson: {},
        config: RequestConfig,
      } as unknown as RpcQueryParams<UserOrder[]>);

      return {
        data: response.result as UserOrder[],
        error: null,
      };
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in getActiveOrders:", error);
      return {
        data: undefined,
        error: {
          code: 500,
          message: getErrorMessage(error),
        },
      };
    }
  }

  async addUserToPool(user_id: UserId): ApiResponse<void> {
    try {
      if (this.app) {
        const defaultContextService = DefaultContextService.getInstance(
          this.app
        );
        const defaultContext = defaultContextService.getStoredDefaultContext();

        if (!defaultContext) {
          throw new Error(
            "Default context not found. Please ensure you are connected to Calimero and have a default context initialized."
          );
        }

        await this.app.execute(defaultContext, ClientMethod.ADD_USER_TO_POOL, {
          user_id,
        });

        return {
          data: undefined,
          error: null,
        };
      } else {
        const defaultContextService = DefaultContextService.getInstance(null);
        const defaultContext = defaultContextService.getStoredDefaultContext();

        let authConfig;
        if (defaultContext) {
          const baseAuthConfig = getAuthConfig();
          authConfig = {
            ...baseAuthConfig,
            contextId: defaultContext.contextId,
            executorPublicKey:
              defaultContext.memberPublicKey ||
              baseAuthConfig.executorPublicKey,
          };
        } else {
          authConfig = getAuthConfig();
        }

        await rpcClient.execute({
          ...authConfig,
          method: ClientMethod.ADD_USER_TO_POOL,
          argsJson: { user_id },
          config: RequestConfig,
        } as unknown as RpcQueryParams<void>);

        return {
          data: undefined,
          error: null,
        };
      }
    } catch (error: unknown) {
      console.error("ClientApiDataSource: Error in addUserToPool:", error);
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
