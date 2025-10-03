#![allow(clippy::len_without_is_empty)]

use calimero_sdk::borsh::{BorshDeserialize, BorshSerialize};
use calimero_sdk::serde::{Deserialize, Serialize};
use calimero_sdk::{app, env};
use std::collections::HashMap;

mod types;
use types::id::UserId;

/// Operating modes for MeroPools context
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize, PartialEq)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub enum OperatingMode {
    /// Private user context for order preparation
    UserPrivate,
    /// Shared matching pool where users join for trading
    MatchingPool,
}

impl Default for OperatingMode {
    fn default() -> Self {
        OperatingMode::UserPrivate
    }
}

/// Pool configuration for matching pools
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct PoolConfig {
    pub pool_name: String,
    pub min_order_amount: u128,
    pub max_order_amount: u128,
    pub supported_tokens: Vec<String>,
    pub batch_frequency_seconds: u64,
    pub fee_basis_points: u32,
    pub created_at: u64,
}

/// Encrypted order commitment for privacy
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct OrderCommitment {
    pub commitment_hash: [u8; 32],
    pub encrypted_payload: Vec<u8>,
    pub nullifier_seed: [u8; 32],
    pub proof_of_funds: [u8; 32],
    pub timestamp: u64,
    pub expiry: u64,
}

/// Order status enumeration
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize, PartialEq)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub enum OrderStatus {
    Active,
    Cancelled,
    PartiallyMatched { filled_amount: u128 },
    FullyMatched,
    Expired,
}

/// User order with encrypted commitment and metadata
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct UserOrder {
    pub id: String,
    pub user_id: UserId,
    pub commitment: OrderCommitment,
    pub token_deposited: String,
    pub amount_deposited: u128,
    pub escrow_confirmed: bool,
    pub vechain_address: String,
    pub expected_price: u128,
    pub expected_exchange_token: String,
    pub spread: u32,
    pub time_limit: u64,
    pub order_context_id: String,
    pub user_context_id: String,
    pub status: OrderStatus,
    pub matched: bool,
    pub settlement_tx: Option<String>,
    pub transaction_id: Option<String>,
    pub created_at: u64,
    pub updated_at: u64,
}

/// Batch matching result
#[derive(Debug, Clone, BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
#[serde(crate = "calimero_sdk::serde")]
pub struct BatchMatchResult {
    pub batch_id: String,
    pub matched_orders: Vec<(String, String)>,
    pub clearing_price: u128,
    pub total_volume: u128,
    pub nullifiers: Vec<[u8; 32]>,
    pub timestamp: u64,
}

/// Application events
#[app::event]
#[derive(Debug, BorshSerialize, BorshDeserialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub enum MeroPoolsEvent {
    OrderSubmitted {
        order_id: String,
        user_id: UserId,
    },
    OrderCancelled {
        order_id: String,
        user_id: UserId,
    },
    UserJoinedPool {
        user_id: UserId,
        pool_name: String,
    },
    BatchProcessingStarted {
        batch_id: String,
        order_count: u32,
    },
    BatchMatched {
        batch_id: String,
        match_count: u32,
        clearing_price: u128,
    },
    BatchReady {
        batch_id: String,
        matched_orders: Vec<(String, String)>,
        clearing_price: u128,
        total_volume: u128,
    },
    SettlementSubmitted {
        batch_id: String,
        tx_hash: String,
    },
}

/// Application state
#[app::state(emits = MeroPoolsEvent)]
#[derive(BorshDeserialize, BorshSerialize)]
#[borsh(crate = "calimero_sdk::borsh")]
pub struct MeroPoolsState {
    pub mode: OperatingMode,
    pub admin: UserId,
    pub pool_config: Option<PoolConfig>,
    pub user_orders: HashMap<String, UserOrder>,
    pub user_order_index: HashMap<String, Vec<String>>,
    pub order_counter: u64,
    pub batch_counter: u64,
    pub batch_history: HashMap<String, BatchMatchResult>,
    pub active_users: Vec<UserId>,
}

#[app::logic]
impl MeroPoolsState {
    /// Initialize context with operating mode and optional pool config
    #[app::init]
    pub fn init(mode: OperatingMode, pool_config: Option<PoolConfig>) -> MeroPoolsState {
        let admin_raw = env::executor_id();
        let admin = UserId::new(hex::encode(admin_raw));

        MeroPoolsState {
            mode,
            admin,
            pool_config,
            user_orders: HashMap::new(),
            user_order_index: HashMap::new(),
            order_counter: 0,
            batch_counter: 0,
            batch_history: HashMap::new(),
            active_users: Vec::new(),
        }
    }

    // User API

    /// Submit a new order
    pub fn submit_order(
        &mut self,
        user_id: UserId,
        commitment: OrderCommitment,
        token_deposited: String,
        amount_deposited: u128,
        escrow_confirmed: bool,
        vechain_address: String,
        expected_price: u128,
        expected_exchange_token: String,
        spread: u32,
        time_limit: u64,
    ) -> Result<String, String> {
        let caller = user_id;

        if amount_deposited == 0 {
            return Err("Amount must be > 0".to_string());
        }

        // Validate pool constraints for matching pool mode
        if self.mode == OperatingMode::MatchingPool {
            if let Some(config) = &self.pool_config {
                if amount_deposited < config.min_order_amount
                    || amount_deposited > config.max_order_amount
                {
                    return Err("Order amount outside pool limits".to_string());
                }
                if !config.supported_tokens.contains(&token_deposited) {
                    return Err("Token not supported by this pool".to_string());
                }
            }

            // Auto-join pool if not already joined
            if !self.active_users.contains(&caller) {
                self.join_matching_pool(caller.clone())?;
            }
        }

        self.order_counter += 1;
        let order_id = format!("order_{}", self.order_counter);
        let order_context_id = format!("trade_ctx_{}_{}", caller.0, order_id);

        let now = env::time_now();

        let order = UserOrder {
            id: order_id.clone(),
            user_id: caller.clone(),
            commitment,
            token_deposited,
            amount_deposited,
            escrow_confirmed,
            vechain_address,
            expected_price,
            expected_exchange_token,
            spread,
            time_limit,
            order_context_id: order_context_id.clone(),
            user_context_id: caller.0.clone(),
            status: OrderStatus::Active,
            matched: false,
            settlement_tx: None,
            transaction_id: None,
            created_at: now,
            updated_at: now,
        };

        self.user_orders.insert(order_id.clone(), order);

        self.user_order_index
            .entry(caller.0.clone())
            .or_insert_with(Vec::new)
            .push(order_id.clone());

        app::emit!(MeroPoolsEvent::OrderSubmitted {
            order_id: order_id.clone(),
            user_id: caller
        });

        app::log!("Order submitted: {}", order_id);
        Ok(order_id)
    }

    /// Cancel an active order
    pub fn cancel_order(&mut self, user_id: UserId, order_id: String) -> Result<(), String> {
        let caller = user_id;

        if let Some(order) = self.user_orders.get_mut(&order_id) {
            if order.user_id != caller {
                return Err("Not order owner".to_string());
            }

            if order.status != OrderStatus::Active {
                return Err("Order not active".to_string());
            }

            order.status = OrderStatus::Cancelled;
            order.updated_at = env::time_now();

            app::emit!(MeroPoolsEvent::OrderCancelled {
                order_id,
                user_id: caller
            });

            app::log!("Order cancelled");
            Ok(())
        } else {
            Err("Order not found".to_string())
        }
    }

    /// Join matching pool (for shared contexts)
    pub fn join_matching_pool(&mut self, user_id: UserId) -> Result<(), String> {
        if self.mode != OperatingMode::MatchingPool {
            return Err("Can only join matching pools".to_string());
        }

        let caller = user_id;

        if !self.active_users.contains(&caller) {
            self.active_users.push(caller.clone());

            let pool_name = self
                .pool_config
                .as_ref()
                .map(|c| c.pool_name.clone())
                .unwrap_or_else(|| "Unknown Pool".to_string());

            app::emit!(MeroPoolsEvent::UserJoinedPool {
                user_id: caller,
                pool_name,
            });

            app::log!("User joined matching pool");
        }

        Ok(())
    }

    // Matching Pool API

    /// Run batch matching algorithm (for matching pools)
    pub fn run_batch_matching(&mut self) -> Result<String, String> {
        if self.mode != OperatingMode::MatchingPool {
            return Err("Batch matching only available in matching pools".to_string());
        }

        self.batch_counter += 1;
        let batch_id = format!("batch_{}", self.batch_counter);

        let active_orders: Vec<&UserOrder> = self
            .user_orders
            .values()
            .filter(|order| order.status == OrderStatus::Active && order.escrow_confirmed)
            .collect();

        app::emit!(MeroPoolsEvent::BatchProcessingStarted {
            batch_id: batch_id.clone(),
            order_count: active_orders.len() as u32
        });

        let match_result = self.execute_batch_matching(&active_orders, &batch_id)?;
        let nullifiers = self.generate_nullifiers(&match_result.matched_orders)?;

        let final_result = BatchMatchResult {
            batch_id: batch_id.clone(),
            matched_orders: match_result.matched_orders.clone(),
            clearing_price: match_result.clearing_price,
            total_volume: match_result.total_volume,
            nullifiers: nullifiers.clone(),
            timestamp: env::time_now(),
        };

        self.batch_history
            .insert(batch_id.clone(), final_result.clone());

        app::emit!(MeroPoolsEvent::BatchMatched {
            batch_id: batch_id.clone(),
            match_count: final_result.matched_orders.len() as u32,
            clearing_price: final_result.clearing_price
        });

        app::emit!(MeroPoolsEvent::BatchReady {
            batch_id: batch_id.clone(),
            matched_orders: final_result.matched_orders.clone(),
            clearing_price: final_result.clearing_price,
            total_volume: final_result.total_volume,
        });

        // Update matched orders status
        for (a, b) in match_result.matched_orders.iter() {
            if let Some(oa) = self.user_orders.get_mut(a) {
                oa.status = OrderStatus::FullyMatched;
                oa.matched = true;
                oa.updated_at = env::time_now();
            }
            if let Some(ob) = self.user_orders.get_mut(b) {
                ob.status = OrderStatus::FullyMatched;
                ob.matched = true;
                ob.updated_at = env::time_now();
            }
        }

        app::log!("Batch matching completed: {}", batch_id);
        Ok(batch_id)
    }

    /// Record settlement transaction result
    pub fn submit_settlement_result(
        &mut self,
        batch_id: String,
        tx_hash: String,
    ) -> Result<(), String> {
        if self.mode != OperatingMode::MatchingPool {
            return Err("Operation only valid in matching pools".to_string());
        }

        if let Some(batch) = self.batch_history.get(&batch_id) {
            for (a, b) in &batch.matched_orders {
                if let Some(oa) = self.user_orders.get_mut(a) {
                    oa.settlement_tx = Some(tx_hash.clone());
                    oa.status = OrderStatus::FullyMatched;
                    oa.updated_at = env::time_now();
                }
                if let Some(ob) = self.user_orders.get_mut(b) {
                    ob.settlement_tx = Some(tx_hash.clone());
                    ob.status = OrderStatus::FullyMatched;
                    ob.updated_at = env::time_now();
                }
            }
        }

        app::emit!(MeroPoolsEvent::SettlementSubmitted { batch_id, tx_hash });

        Ok(())
    }

    // Query methods

    /// Get pool configuration (for matching pools)
    pub fn get_pool_config(&self) -> Option<PoolConfig> {
        self.pool_config.clone()
    }

    /// Get all active users in the pool
    pub fn get_active_users(&self) -> Vec<UserId> {
        self.active_users.clone()
    }

    /// Get all active orders in the pool (for matching)
    pub fn get_active_orders(&self) -> Vec<UserOrder> {
        self.user_orders
            .values()
            .filter(|order| order.status == OrderStatus::Active && order.escrow_confirmed)
            .cloned()
            .collect()
    }

    /// Admin: Add user to pool (alternative to invite flow)
    pub fn add_user_to_pool(&mut self, user_id: UserId) -> Result<(), String> {
        if self.mode != OperatingMode::MatchingPool {
            return Err("Can only add users to matching pools".to_string());
        }

        if !self.active_users.contains(&user_id) {
            self.active_users.push(user_id.clone());

            let pool_name = self
                .pool_config
                .as_ref()
                .map(|c| c.pool_name.clone())
                .unwrap_or_else(|| "Unknown Pool".to_string());

            app::emit!(MeroPoolsEvent::UserJoinedPool {
                user_id: user_id.clone(),
                pool_name,
            });

            app::log!("User added to pool: {}", user_id.0);
        }

        Ok(())
    }

    /// Get user's orders
    pub fn get_user_orders(&self, user_id: UserId) -> Vec<UserOrder> {
        if let Some(order_ids) = self.user_order_index.get(&user_id.0) {
            order_ids
                .iter()
                .filter_map(|id| self.user_orders.get(id))
                .cloned()
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_batch_result(&self, batch_id: String) -> Option<BatchMatchResult> {
        self.batch_history.get(&batch_id).cloned()
    }

    /// Get batch result with full order details for frontend settlement
    pub fn get_batch_orders(&self, batch_id: String) -> Option<(BatchMatchResult, Vec<UserOrder>)> {
        if let Some(batch) = self.batch_history.get(&batch_id) {
            let mut orders = Vec::new();
            for (order_a_id, order_b_id) in &batch.matched_orders {
                if let Some(order_a) = self.user_orders.get(order_a_id) {
                    orders.push(order_a.clone());
                }
                if let Some(order_b) = self.user_orders.get(order_b_id) {
                    orders.push(order_b.clone());
                }
            }
            Some((batch.clone(), orders))
        } else {
            None
        }
    }

    pub fn get_mode(&self) -> OperatingMode {
        self.mode.clone()
    }

    // Private calculation helpers

    fn calculate_clearing_price(&self, order_a: &UserOrder, order_b: &UserOrder) -> u128 {
        if order_a.expected_price > 0 && order_b.expected_price > 0 {
            (order_a.expected_price + order_b.expected_price) / 2
        } else {
            order_a.expected_price.max(order_b.expected_price)
        }
    }

    /// Sequential batch matching algorithm
    fn execute_batch_matching(
        &self,
        orders: &[&UserOrder],
        batch_id: &str,
    ) -> Result<BatchMatchResult, String> {
        app::log!("Executing batch matching for batch: {}", batch_id);

        let mut matched_orders: Vec<(String, String)> = Vec::new();
        let mut total_volume: u128 = 0;
        let mut i = 0;

        while i + 1 < orders.len() {
            let a = orders[i];
            let b = orders[i + 1];

            // For safety: ensure both escrow_confirmed
            if !a.escrow_confirmed || !b.escrow_confirmed {
                i += 2;
                continue;
            }

            // Simple matching logic: match any two orders for now
            matched_orders.push((a.id.clone(), b.id.clone()));
            total_volume += a.amount_deposited.min(b.amount_deposited);
            app::log!(
                "Matched orders: {} <-> {} (amounts: {} vs {})",
                a.id,
                b.id,
                a.amount_deposited,
                b.amount_deposited
            );

            i += 2;
        }

        let clearing_price = if matched_orders.is_empty() {
            0
        } else {
            // Use the first matched pair to calculate clearing price
            if let Some((a_id, b_id)) = matched_orders.get(0) {
                if let (Some(a), Some(b)) = (self.user_orders.get(a_id), self.user_orders.get(b_id))
                {
                    self.calculate_clearing_price(a, b)
                } else {
                    0
                }
            } else {
                0
            }
        };

        Ok(BatchMatchResult {
            batch_id: batch_id.to_string(),
            matched_orders,
            clearing_price,
            total_volume,
            nullifiers: Vec::new(),
            timestamp: env::time_now(),
        })
    }

    /// Generate nullifiers for matched orders
    fn generate_nullifiers(
        &self,
        matched_orders: &[(String, String)],
    ) -> Result<Vec<[u8; 32]>, String> {
        let mut nullifiers = Vec::new();

        for (a, b) in matched_orders {
            if let Some(order_a) = self.user_orders.get(a) {
                let n = self.compute_nullifier(order_a.commitment.nullifier_seed)?;
                nullifiers.push(n);
            }
            if let Some(order_b) = self.user_orders.get(b) {
                let n = self.compute_nullifier(order_b.commitment.nullifier_seed)?;
                nullifiers.push(n);
            }
        }

        Ok(nullifiers)
    }

    fn compute_nullifier(&self, seed: [u8; 32]) -> Result<[u8; 32], String> {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        seed.hash(&mut hasher);
        env::time_now().hash(&mut hasher);

        let hash = hasher.finish();
        let mut nullifier = [0u8; 32];
        nullifier[..8].copy_from_slice(&hash.to_le_bytes());
        Ok(nullifier)
    }
}
