# MeroPools - Dark Pool Settlement Contract

A decentralized escrow and settlement system for dark pool trading on VeChain.

## Contract Overview

The DarkPoolSettlement contract provides a secure escrow mechanism for trading ERC20 tokens off-chain with on-chain settlement. It enables privacy-preserving trades where order details remain confidential until settlement.

### Key Features

- **Escrow System**: Secure token deposits and withdrawals
- **Atomic Settlement**: Simultaneous execution of matched trades
- **Access Control**: Role-based permissions for relayers and admins
- **Token Whitelist**: Optional token support controls
- **Emergency Functions**: Pausable contract with emergency withdrawals
- **Reentrancy Protection**: Built-in security against reentrancy attacks

## Deployment Information

### VeChain Testnet

- **Contract Address**: `0x3cb3b2782f4cbfbaa035daab7939970563b79527`
- **Network**: VeChain Thor Testnet
- **Explorer**: [View on VeChain Explorer](https://explore-testnet.vechain.org/accounts/0x3cb3b2782f4cbfbaa035daab7939970563b79527)

## Development Setup

### Prerequisites

- Node.js v16+
- npm or yarn

### Installation

```bash
npm install
```

### Compilation

```bash
npx hardhat compile
```

### Deployment

```bash
# Deploy to VeChain testnet
npx hardhat run scripts/deploy-darkpool.ts --network vechain_testnet
```

### Testing

```bash
npx hardhat test
```

## Contract Functions

### User Functions

- `deposit(token, amount)` - Deposit tokens into escrow
- `withdraw(token, amount)` - Withdraw tokens from escrow
- `emergencyWithdraw(token)` - Emergency withdrawal when paused

### Relayer Functions

- `settleTrade(userA, tokenA, amountA, userB, tokenB, amountB)` - Execute matched trades

### Admin Functions

- `setTokenSupport(token, supported)` - Update token whitelist
- `setWhitelistEnabled(enabled)` - Enable/disable whitelist
- `pause()` / `unpause()` - Pause/unpause contract
- `addRelayer(relayer)` / `removeRelayer(relayer)` - Manage relayers

### View Functions

- `getEscrowBalance(user, token)` - Get user's token balance
- `getMultipleBalances(user, tokens)` - Get multiple balances
- `isTokenSupported(token)` - Check token support
- `getCurrentNonce()` - Get current trade nonce
