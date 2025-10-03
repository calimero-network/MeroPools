import { useMemo, useState, useEffect } from "react";
import { useWallet } from "@vechain/vechain-kit";
import { ethers } from "ethers";
import DarkPoolSettlementABI from "../abis/DarkPoolSettlement.json";

// Standard ERC20 ABI (only the functions we need)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

// Deployed contract address on VeChain Testnet
export const DARKPOOL_CONTRACT_ADDRESS =
  "0xc45adc41c6be7d172b7841b072b90c0abb6f663f";

// Token addresses on VeChain Testnet
export const TOKEN_ADDRESSES: Record<string, string> = {
  B3TR: "0xbf64cf86894Ee0877C4e7d03936e35Ee8D8b864F", // VeBetterDAO Incentive Token
  VOT3: "0xa704c45971995467696EE9544Da77DD42Bc9706E", // VeBetterDAO Governance Token
  VTHO: "0x0000000000000000000000000000456E65726779", // VeThor Token (gas token)
  VET: "0x0000000000000000000000000000000000000000", // Native VET (VeChain)
};

export interface DarkPoolContractHook {
  contractAddress: string;
  contractInterface: ethers.Interface;
  erc20Interface: ethers.Interface;
  account: ReturnType<typeof useWallet>["account"];
  isConnected: boolean;
  getTokenAddress: (symbol: string) => string;
}

/**
 * Hook to interact with the DarkPoolSettlement contract on VeChain
 * Provides contract interface and user account information
 */
export function useDarkPoolContract(): DarkPoolContractHook {
  const { account } = useWallet();

  const contractInterface = useMemo(() => {
    return new ethers.Interface(DarkPoolSettlementABI);
  }, []);

  const erc20Interface = useMemo(() => {
    return new ethers.Interface(ERC20_ABI);
  }, []);

  const getTokenAddress = (symbol: string): string => {
    const address = TOKEN_ADDRESSES[symbol];
    if (!address) {
      console.warn(
        `Token ${symbol} not found in TOKEN_ADDRESSES, using placeholder`
      );
      return "0x0000000000000000000000000000000000000000";
    }
    return address;
  };

  return {
    contractAddress: DARKPOOL_CONTRACT_ADDRESS,
    contractInterface,
    erc20Interface,
    account,
    isConnected: !!account?.address,
    getTokenAddress,
  };
}

/**
 * Hook to read escrow balance for a specific token
 */
export function useEscrowBalance(tokenAddress: string) {
  const { account } = useWallet();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (!account?.address || !tokenAddress) return;

      setIsLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider(
          "https://testnet.vechain.org"
        );
        const contract = new ethers.Contract(
          DARKPOOL_CONTRACT_ADDRESS,
          DarkPoolSettlementABI,
          provider
        );

        const bal = await contract.getEscrowBalance(
          account.address,
          tokenAddress
        );
        setBalance(ethers.formatUnits(bal, 18));
      } catch (error) {
        console.error("Error fetching escrow balance:", error);
        setBalance("0");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, [account?.address, tokenAddress]);

  return { balance, isLoading };
}
