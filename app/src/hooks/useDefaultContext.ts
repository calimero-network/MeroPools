import { useCallback, useEffect, useState } from "react";
import { getAuthConfig } from "@calimero-network/calimero-client";
import {
  DefaultContextService,
  type DefaultContextInfo,
} from "../services/DefaultContextService";

interface AuthConfig {
  contextId?: string | null;
  executorPublicKey?: string | null;
}

interface UseDefaultContextReturn {
  defaultContext: DefaultContextInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshContext: () => Promise<void>;
  getAuthConfigWithContext: (
    customContextId?: string,
    customExecutorPublicKey?: string
  ) => AuthConfig;
  clearContext: () => void;
}

/**
 * Custom hook for managing default context and building auth configurations.
 *
 * This hook provides:
 * - Access to the stored default context
 * - Methods to build auth configs with context-specific credentials
 * - Automatic context loading and refresh capabilities
 *
 * @param app - Optional Calimero app instance
 * @returns Context state and utility functions
 *
 * @example
 * ```tsx
 * const { defaultContext, getAuthConfigWithContext } = useDefaultContext(app);
 *
 * // Get auth config with default context
 * const authConfig = getAuthConfigWithContext();
 *
 * // Get auth config with custom context
 * const customAuthConfig = getAuthConfigWithContext(customContextId, customExecutorPublicKey);
 * ```
 */
export function useDefaultContext(app?: unknown): UseDefaultContextReturn {
  const [defaultContext, setDefaultContext] =
    useState<DefaultContextInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load the default context from storage or create a new one
   */
  const loadContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const defaultContextService = DefaultContextService.getInstance(
        app || null
      );

      // First, try to get stored context
      const storedContext = defaultContextService.getStoredDefaultContext();

      if (storedContext) {
        setDefaultContext(storedContext);
        setIsLoading(false);
        return;
      }

      // If no stored context and app is available, try to ensure default context
      if (app) {
        const result = await defaultContextService.ensureDefaultContext();

        if (result.success && result.contextInfo) {
          setDefaultContext(result.contextInfo);
        } else {
          setError(result.error || "Failed to load default context");
        }
      }
    } catch (err: unknown) {
      console.error("Error loading default context:", err);
      setError((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [app]);

  /**
   * Refresh the default context
   */
  const refreshContext = useCallback(async () => {
    await loadContext();
  }, [loadContext]);

  /**
   * Build auth config with context-specific credentials
   *
   * @param customContextId - Optional custom context ID to use
   * @param customExecutorPublicKey - Optional custom executor public key to use
   * @returns Auth configuration object
   */
  const getAuthConfigWithContext = useCallback(
    (
      customContextId?: string,
      customExecutorPublicKey?: string
    ): AuthConfig => {
      const baseAuthConfig = getAuthConfig();

      // If custom context ID is provided, use it
      if (customContextId) {
        return {
          ...baseAuthConfig,
          contextId: customContextId,
          executorPublicKey:
            customExecutorPublicKey || baseAuthConfig.executorPublicKey || null,
        };
      }

      // If default context exists, use it
      if (defaultContext) {
        return {
          ...baseAuthConfig,
          contextId: defaultContext.contextId,
          executorPublicKey:
            defaultContext.memberPublicKey ||
            baseAuthConfig.executorPublicKey ||
            null,
        };
      }

      // Fallback to base auth config
      return {
        ...baseAuthConfig,
        contextId: baseAuthConfig.contextId || null,
        executorPublicKey: baseAuthConfig.executorPublicKey || null,
      };
    },
    [defaultContext]
  );

  /**
   * Clear the stored default context
   */
  const clearContext = useCallback(() => {
    const defaultContextService = DefaultContextService.getInstance(
      app || null
    );
    defaultContextService.clearStoredDefaultContext();
    setDefaultContext(null);
    setError(null);
  }, [app]);

  // Load context on mount
  useEffect(() => {
    loadContext();
  }, [loadContext]);

  return {
    defaultContext,
    isLoading,
    error,
    refreshContext,
    getAuthConfigWithContext,
    clearContext,
  };
}

/**
 * Utility function to get auth config without using the hook
 * Useful for class components or non-React contexts
 *
 * @param customContextId - Optional custom context ID
 * @param customExecutorPublicKey - Optional custom executor public key
 * @returns Auth configuration object
 *
 * @example
 * ```ts
 * const authConfig = getAuthConfigWithDefaultContext();
 * const customAuthConfig = getAuthConfigWithDefaultContext(contextId, executorPublicKey);
 * ```
 */
export function getAuthConfigWithDefaultContext(
  customContextId?: string,
  customExecutorPublicKey?: string
): AuthConfig {
  const baseAuthConfig = getAuthConfig();

  // If custom context ID is provided, use it
  if (customContextId) {
    return {
      ...baseAuthConfig,
      contextId: customContextId,
      executorPublicKey:
        customExecutorPublicKey || baseAuthConfig.executorPublicKey || null,
    };
  }

  // Try to get stored default context
  const defaultContextService = DefaultContextService.getInstance(null);
  const defaultContext = defaultContextService.getStoredDefaultContext();

  if (defaultContext) {
    return {
      ...baseAuthConfig,
      contextId: defaultContext.contextId,
      executorPublicKey:
        defaultContext.memberPublicKey ||
        baseAuthConfig.executorPublicKey ||
        null,
    };
  }

  // Fallback to base auth config
  return {
    ...baseAuthConfig,
    contextId: baseAuthConfig.contextId || null,
    executorPublicKey: baseAuthConfig.executorPublicKey || null,
  };
}
