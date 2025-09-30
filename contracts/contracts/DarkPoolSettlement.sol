// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DarkPoolSettlement
 * @notice Escrow and settlement layer for Dark Pool trades on VeChain
 * @dev Handles deposits, withdrawals, and atomic settlement of matched trades
 */
contract DarkPoolSettlement is ReentrancyGuard, AccessControl, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ State Variables ============
    
    // User -> Token -> Balance
    mapping(address => mapping(address => uint256)) public escrowBalances;
    
    // Track total deposits per token (for security monitoring)
    mapping(address => uint256) public totalEscrowedPerToken;
    
    // Supported tokens whitelist (optional safety feature)
    mapping(address => bool) public supportedTokens;
    bool public whitelistEnabled = true;
    
    // Trade nonce to prevent replay attacks
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
    
    event TokenWhitelistUpdated(address indexed token, bool supported);
    event WhitelistStatusChanged(bool enabled);
    event EmergencyWithdraw(address indexed user, address indexed token, uint256 amount);

    // ============ Errors ============
    error InsufficientBalance();
    error InvalidAmount();
    error UnsupportedToken();
    error InvalidAddress();
    error InsufficientEscrowBalance();
    error SelfTrade();
    error MismatchedTrade();

    // ============ Constructor ============
    constructor(address _relayer) {
        if (_relayer == address(0)) revert InvalidAddress();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, _relayer);
    }

    // ============ Deposit Functions ============
    
    /**
     * @notice Deposit tokens into escrow for trading
     * @param token The ERC20 token address
     * @param amount The amount to deposit
     */
    function deposit(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (amount == 0) revert InvalidAmount();
        if (token == address(0)) revert InvalidAddress();
        if (whitelistEnabled && !supportedTokens[token]) revert UnsupportedToken();
        
        // Transfer tokens from user to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update balances
        escrowBalances[msg.sender][token] += amount;
        totalEscrowedPerToken[token] += amount;
        
        emit Deposited(msg.sender, token, amount, block.timestamp);
    }
    
    /**
     * @notice Withdraw tokens from escrow
     * @param token The ERC20 token address
     * @param amount The amount to withdraw
     */
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (amount == 0) revert InvalidAmount();
        if (escrowBalances[msg.sender][token] < amount) revert InsufficientBalance();
        
        // Update balances
        escrowBalances[msg.sender][token] -= amount;
        totalEscrowedPerToken[token] -= amount;
        
        // Transfer tokens back to user
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, token, amount, block.timestamp);
    }

    // ============ Settlement Functions ============
    
    /**
     * @notice Settle a matched trade between two users
     * @dev Only callable by authorized relayer
     * @param userA First user in the trade
     * @param tokenA Token that userA is selling
     * @param amountA Amount of tokenA that userA is selling
     * @param userB Second user in the trade
     * @param tokenB Token that userB is selling (userA is buying)
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
        whenNotPaused 
        onlyRole(RELAYER_ROLE)
    {
        // Validate inputs
        if (userA == address(0) || userB == address(0)) revert InvalidAddress();
        if (userA == userB) revert SelfTrade();
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidAddress();
        if (amountA == 0 || amountB == 0) revert InvalidAmount();
        
        // Check if both users have sufficient escrow balances
        if (escrowBalances[userA][tokenA] < amountA) revert InsufficientEscrowBalance();
        if (escrowBalances[userB][tokenB] < amountB) revert InsufficientEscrowBalance();
        
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

    // ============ Admin Functions ============
    
    /**
     * @notice Update token whitelist status
     * @param token The token address
     * @param supported Whether the token is supported
     */
    function setTokenSupport(address token, bool supported) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        supportedTokens[token] = supported;
        emit TokenWhitelistUpdated(token, supported);
    }
    
    /**
     * @notice Enable or disable token whitelist
     * @param enabled Whether whitelist should be enabled
     */
    function setWhitelistEnabled(bool enabled) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        whitelistEnabled = enabled;
        emit WhitelistStatusChanged(enabled);
    }
    
    /**
     * @notice Pause contract operations
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Add a new relayer address
     * @param relayer The address to grant relayer role
     */
    function addRelayer(address relayer) external onlyRole(ADMIN_ROLE) {
        grantRole(RELAYER_ROLE, relayer);
    }
    
    /**
     * @notice Remove a relayer address
     * @param relayer The address to revoke relayer role from
     */
    function removeRelayer(address relayer) external onlyRole(ADMIN_ROLE) {
        revokeRole(RELAYER_ROLE, relayer);
    }

    // ============ Emergency Functions ============
    
    /**
     * @notice Emergency withdraw function for users (only when paused)
     * @param token The token to withdraw
     */
    function emergencyWithdraw(address token) 
        external 
        nonReentrant 
        whenPaused 
    {
        uint256 balance = escrowBalances[msg.sender][token];
        if (balance == 0) revert InsufficientBalance();
        
        escrowBalances[msg.sender][token] = 0;
        totalEscrowedPerToken[token] -= balance;
        
        IERC20(token).safeTransfer(msg.sender, balance);
        
        emit EmergencyWithdraw(msg.sender, token, balance);
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
     * @notice Check if a token is supported (when whitelist is enabled)
     * @param token The token address to check
     * @return Whether the token is supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        if (!whitelistEnabled) return true;
        return supportedTokens[token];
    }
    
    /**
     * @notice Get the current trade nonce
     * @return The current nonce value
     */
    function getCurrentNonce() external view returns (uint256) {
        return tradeNonce;
    }
}