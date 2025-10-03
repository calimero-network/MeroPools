// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DarkPoolSettlement
 * @notice Simplified escrow and settlement for Dark Pool trades
 * @dev Minimal implementation: deposit tokens, settle trades between users
 */
contract DarkPoolSettlement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    
    // User -> Token -> Balance
    mapping(address => mapping(address => uint256)) public escrowBalances;
    
    // Trade nonce counter
    uint256 public tradeNonce;

    // ============ Events ============
    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event TradeSettled(
        address indexed userA,
        address tokenA,
        uint256 amountA,
        address indexed userB,
        address tokenB,
        uint256 amountB,
        uint256 indexed nonce,
        uint256 timestamp
    );

    // ============ Errors ============
    error InsufficientBalance();
    error InvalidAmount();
    error InvalidAddress();
    error SelfTrade();

    // ============ Deposit Functions ============
    
    /**
     * @notice Deposit tokens into escrow for trading
     * @dev For native VET: pass address(0) as token and send VET as msg.value
     * @dev For ERC20: pass token address, amount, and ensure token is approved
     * @param token The ERC20 token address (or address(0) for native VET)
     * @param amount The amount to deposit (ignored for native VET, uses msg.value)
     */
    function deposit(address token, uint256 amount) 
        external 
        payable
        nonReentrant 
    {
        if (token == address(0)) {
            // Native VET deposit
            if (msg.value == 0) revert InvalidAmount();
            
            // Update balance using msg.value
            escrowBalances[msg.sender][token] += msg.value;
            
            emit Deposited(msg.sender, token, msg.value, block.timestamp);
        } else {
            // ERC20 token deposit
            if (amount == 0) revert InvalidAmount();
            if (msg.value > 0) revert InvalidAmount(); // Don't send VET for ERC20 deposits
            
            // Transfer tokens from user to contract
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            
            // Update balance
            escrowBalances[msg.sender][token] += amount;
            
            emit Deposited(msg.sender, token, amount, block.timestamp);
        }
    }
    
    /**
     * @notice Withdraw tokens from escrow
     * @dev For native VET: pass address(0) as token
     * @param token The ERC20 token address (or address(0) for native VET)
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
    {
        if (amount == 0) revert InvalidAmount();
        if (escrowBalances[msg.sender][token] < amount) revert InsufficientBalance();
        
        // Update balance
        escrowBalances[msg.sender][token] -= amount;
        
        if (token == address(0)) {
            // Native VET withdrawal
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            if (!success) revert InvalidAmount(); // Reuse error for failed transfer
        } else {
            // ERC20 token withdrawal
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        
        emit Withdrawn(msg.sender, token, amount, block.timestamp);
    }

    // ============ Settlement Functions ============
    
    /**
     * @notice Settle a matched trade between two users
     * @dev Anyone can call this function (access control removed for MVP)
     * @dev Supports native VET (address(0)) and ERC20 tokens
     * @param userA First user in the trade
     * @param tokenA Token that userA is selling (address(0) for native VET)
     * @param amountA Amount of tokenA that userA is selling
     * @param userB Second user in the trade
     * @param tokenB Token that userB is selling (address(0) for native VET)
     * @param amountB Amount of tokenB that userB is selling (userA is buying)
     */
    function settleTrade(
        address userA,
        address tokenA,
        uint256 amountA,
        address userB,
        address tokenB,
        uint256 amountB
    ) 
        external 
        nonReentrant 
    {
        // Validate inputs
        if (userA == address(0) || userB == address(0)) revert InvalidAddress();
        if (userA == userB) revert SelfTrade();
        // Note: tokenA and tokenB can be address(0) for native VET
        if (amountA == 0 || amountB == 0) revert InvalidAmount();
        
        // Check if both users have sufficient escrow balances
        if (escrowBalances[userA][tokenA] < amountA) revert InsufficientBalance();
        if (escrowBalances[userB][tokenB] < amountB) revert InsufficientBalance();
        
        // Increment nonce for unique trade ID
        uint256 currentNonce = ++tradeNonce;
        
        // Execute atomic swap
        // Deduct from sellers
        escrowBalances[userA][tokenA] -= amountA;
        escrowBalances[userB][tokenB] -= amountB;
        
        // Credit to buyers
        escrowBalances[userA][tokenB] += amountB;
        escrowBalances[userB][tokenA] += amountA;
        
        emit TradeSettled(
            userA,
            tokenA,
            amountA,
            userB,
            tokenB,
            amountB,
            currentNonce,
            block.timestamp
        );
    }

    // ============ View Functions ============
    
    /**
     * @notice Get user's escrow balance for a specific token
     * @param user The user address
     * @param token The token address
     * @return The escrowed balance
     */
    function getEscrowBalance(address user, address token) 
        external 
        view 
        returns (uint256) 
    {
        return escrowBalances[user][token];
    }
    
    /**
     * @notice Get multiple token balances for a user
     * @param user The user address
     * @param tokens Array of token addresses
     * @return balances Array of corresponding balances
     */
    function getMultipleBalances(address user, address[] calldata tokens) 
        external 
        view 
        returns (uint256[] memory balances) 
    {
        balances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            balances[i] = escrowBalances[user][tokens[i]];
        }
    }
    
    /**
     * @notice Get the current trade nonce
     * @return The current nonce value
     */
    function getCurrentNonce() external view returns (uint256) {
        return tradeNonce;
    }
}