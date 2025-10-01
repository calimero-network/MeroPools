import type {
  CreateContextProps,
  CreateContextResponse,
  InviteToContextProps,
  JoinContextProps,
  JoinContextResponse,
  NodeApi,
  VerifyContextProps,
  VerifyContextResponse,
} from "../nodeApi";
import { apiClient, type ApiResponse } from "@calimero-network/calimero-client";

export class ContextApiDataSource implements NodeApi {
  async createContext(
    props: CreateContextProps
  ): ApiResponse<CreateContextResponse> {
    try {
      const applicationId = import.meta.env.VITE_APPLICATION_ID;
      if (!applicationId) {
        throw new Error("Application ID not configured in environment");
      }

      const result = await apiClient
        .node()
        .createContext(applicationId, JSON.stringify(props), "near");

      return { data: result.data as CreateContextResponse, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during createContext";

      return {
        data: undefined,
        error: {
          code: 500,
          message: errorMessage,
        },
      };
    }
  }

  async inviteToContext(props: InviteToContextProps): ApiResponse<string> {
    try {
      const result = await apiClient
        .node()
        .contextInvite(props.contextId, props.inviter, props.invitee);

      return { data: result.data || "", error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during inviteToContext";

      return {
        data: undefined,
        error: {
          code: 500,
          message: errorMessage,
        },
      };
    }
  }

  async joinContext(props: JoinContextProps): ApiResponse<JoinContextResponse> {
    try {
      const result = await apiClient
        .node()
        .joinContext(props.invitationPayload);

      return { data: result.data as JoinContextResponse, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during joinContext";

      return {
        data: undefined,
        error: {
          code: 500,
          message: errorMessage,
        },
      };
    }
  }

  async verifyContext(
    props: VerifyContextProps
  ): ApiResponse<VerifyContextResponse> {
    try {
      const result = await apiClient.node().getContext(props.contextId);

      return { data: { joined: !!result.data }, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch context data";

      return {
        data: undefined,
        error: {
          code: 500,
          message: errorMessage,
        },
      };
    }
  }
}
