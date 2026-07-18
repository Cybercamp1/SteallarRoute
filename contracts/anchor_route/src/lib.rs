#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// Data Structures
// ---------------------------------------------------------------------------

/// A single recorded transfer.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransferRecord {
    pub id: u64,
    pub sender: Address,
    pub source_asset: Symbol,
    pub dest_asset: Symbol,
    pub amount: i128,
    pub route_hash: BytesN<32>,
    pub score: u32,
    pub timestamp: u64,
}

/// Feedback submitted for a transfer.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Feedback {
    pub transfer_id: u64,
    pub sender: Address,
    pub rating: u32,
    pub comment: String,
    pub timestamp: u64,
}

/// Aggregated rating data for a route.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteRating {
    pub route_hash: BytesN<32>,
    pub total_ratings: u32,
    pub sum_ratings: u32,
    pub total_transfers: u32,
}

/// Global statistics.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stats {
    pub total_transfers: u64,
    pub total_feedback: u64,
}

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Global transfer counter (u64). Stored in instance storage.
    TransferCount,
    /// Global feedback counter (u64). Stored in instance storage.
    FeedbackCount,
    /// Individual transfer record. Stored in persistent storage.
    Transfer(u64),
    /// Vec of transfer IDs belonging to a user. Stored in persistent storage.
    UserTransfers(Address),
    /// Aggregated RouteRating for a route hash. Stored in persistent storage.
    RouteFeedback(BytesN<32>),
    /// Individual feedback record. Stored in persistent storage.
    FeedbackRecord(u64),
    /// Maps a transfer ID to its feedback ID. Stored in persistent storage.
    TransferFeedback(u64),
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct AnchorRouteContract;

#[contractimpl]
impl AnchorRouteContract {
    // -----------------------------------------------------------------------
    // Write operations
    // -----------------------------------------------------------------------

    /// Record a new transfer and return its ID.
    ///
    /// * `sender`       – the user performing the transfer (must authorise).
    /// * `source_asset` – symbol of the source asset.
    /// * `dest_asset`   – symbol of the destination asset.
    /// * `amount`       – amount transferred (must be > 0).
    /// * `route_hash`   – 32-byte hash identifying the route taken.
    /// * `score`        – quality score assigned to the route (0–100).
    pub fn log_transfer(
        env: Env,
        sender: Address,
        source_asset: Symbol,
        dest_asset: Symbol,
        amount: i128,
        route_hash: BytesN<32>,
        score: u32,
    ) -> u64 {
        // Authenticate the sender.
        sender.require_auth();

        // Validate inputs.
        if amount <= 0 {
            panic!("amount must be positive");
        }
        if score > 100 {
            panic!("score must be between 0 and 100");
        }

        // Increment the global transfer counter.
        let transfer_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TransferCount)
            .unwrap_or(0_u64)
            + 1;
        env.storage()
            .instance()
            .set(&DataKey::TransferCount, &transfer_id);

        // Build the record.
        let record = TransferRecord {
            id: transfer_id,
            sender: sender.clone(),
            source_asset,
            dest_asset,
            amount,
            route_hash: route_hash.clone(),
            score,
            timestamp: env.ledger().timestamp(),
        };

        // Persist the transfer record.
        env.storage()
            .persistent()
            .set(&DataKey::Transfer(transfer_id), &record);

        // Append transfer ID to the user's list.
        let mut user_transfers: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserTransfers(sender.clone()))
            .unwrap_or(Vec::new(&env));
        user_transfers.push_back(transfer_id);
        env.storage()
            .persistent()
            .set(&DataKey::UserTransfers(sender), &user_transfers);

        // Update the route's aggregate transfer count.
        let mut route_rating: RouteRating = env
            .storage()
            .persistent()
            .get(&DataKey::RouteFeedback(route_hash.clone()))
            .unwrap_or(RouteRating {
                route_hash: route_hash.clone(),
                total_ratings: 0,
                sum_ratings: 0,
                total_transfers: 0,
            });
        route_rating.total_transfers += 1;
        env.storage()
            .persistent()
            .set(&DataKey::RouteFeedback(route_hash), &route_rating);

        transfer_id
    }

    /// Submit feedback for a transfer and return the feedback ID.
    ///
    /// * `transfer_id` – ID of the transfer being reviewed.
    /// * `sender`      – must match the original transfer sender.
    /// * `rating`      – integer from 1 to 5.
    /// * `comment`     – textual feedback.
    pub fn submit_feedback(
        env: Env,
        transfer_id: u64,
        sender: Address,
        rating: u32,
        comment: String,
    ) -> u64 {
        // Authenticate the sender.
        sender.require_auth();

        // Validate rating range.
        if rating < 1 || rating > 5 {
            panic!("rating must be between 1 and 5");
        }

        // Retrieve the transfer and verify the sender matches.
        let record: TransferRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Transfer(transfer_id))
            .unwrap_or_else(|| panic!("transfer not found"));

        if record.sender != sender {
            panic!("sender does not match transfer sender");
        }

        // Ensure no duplicate feedback for this transfer.
        if env
            .storage()
            .persistent()
            .has(&DataKey::TransferFeedback(transfer_id))
        {
            panic!("feedback already submitted for this transfer");
        }

        // Increment the global feedback counter.
        let feedback_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::FeedbackCount)
            .unwrap_or(0_u64)
            + 1;
        env.storage()
            .instance()
            .set(&DataKey::FeedbackCount, &feedback_id);

        // Build and persist the feedback record.
        let feedback = Feedback {
            transfer_id,
            sender,
            rating,
            comment,
            timestamp: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::FeedbackRecord(feedback_id), &feedback);

        // Link the transfer to its feedback.
        env.storage()
            .persistent()
            .set(&DataKey::TransferFeedback(transfer_id), &feedback_id);

        // Update the route's aggregate rating.
        let route_hash = record.route_hash.clone();
        let mut route_rating: RouteRating = env
            .storage()
            .persistent()
            .get(&DataKey::RouteFeedback(route_hash.clone()))
            .unwrap_or(RouteRating {
                route_hash: route_hash.clone(),
                total_ratings: 0,
                sum_ratings: 0,
                total_transfers: 0,
            });
        route_rating.total_ratings += 1;
        route_rating.sum_ratings += rating;
        env.storage()
            .persistent()
            .set(&DataKey::RouteFeedback(route_hash), &route_rating);

        feedback_id
    }

    // -----------------------------------------------------------------------
    // Read operations
    // -----------------------------------------------------------------------

    /// Return aggregated rating data for a route identified by `route_hash`.
    pub fn get_route_rating(env: Env, route_hash: BytesN<32>) -> RouteRating {
        env.storage()
            .persistent()
            .get(&DataKey::RouteFeedback(route_hash.clone()))
            .unwrap_or(RouteRating {
                route_hash,
                total_ratings: 0,
                sum_ratings: 0,
                total_transfers: 0,
            })
    }

    /// Return the last 20 (at most) transfers for a given user.
    pub fn get_user_transfers(env: Env, user: Address) -> Vec<TransferRecord> {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserTransfers(user))
            .unwrap_or(Vec::new(&env));

        let len = ids.len();
        let start = if len > 20 { len - 20 } else { 0 };

        let mut results: Vec<TransferRecord> = Vec::new(&env);
        for i in start..len {
            let id = ids.get(i).unwrap();
            let record: TransferRecord = env
                .storage()
                .persistent()
                .get(&DataKey::Transfer(id))
                .unwrap();
            results.push_back(record);
        }
        results
    }

    /// Return a single transfer by its ID.
    pub fn get_transfer(env: Env, transfer_id: u64) -> TransferRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Transfer(transfer_id))
            .unwrap_or_else(|| panic!("transfer not found"))
    }

    /// Return global statistics.
    pub fn get_stats(env: Env) -> Stats {
        let total_transfers: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TransferCount)
            .unwrap_or(0);
        let total_feedback: u64 = env
            .storage()
            .instance()
            .get(&DataKey::FeedbackCount)
            .unwrap_or(0);
        Stats {
            total_transfers,
            total_feedback,
        }
    }

    /// Return feedback for a specific transfer.
    pub fn get_feedback(env: Env, transfer_id: u64) -> Feedback {
        let feedback_id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TransferFeedback(transfer_id))
            .unwrap_or_else(|| panic!("no feedback for this transfer"));
        env.storage()
            .persistent()
            .get(&DataKey::FeedbackRecord(feedback_id))
            .unwrap_or_else(|| panic!("feedback record not found"))
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Env, String, Symbol};

    fn setup_env() -> (Env, AnchorRouteContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(AnchorRouteContract, ());
        let client = AnchorRouteContractClient::new(&env, &contract_id);
        (env, client)
    }

    fn sample_route_hash(env: &Env) -> BytesN<32> {
        BytesN::from_array(env, &[1u8; 32])
    }

    #[test]
    fn test_log_transfer() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let id = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );
        assert_eq!(id, 1);

        let record = client.get_transfer(&1_u64);
        assert_eq!(record.sender, sender);
        assert_eq!(record.amount, 1000);
        assert_eq!(record.score, 85);
    }

    #[test]
    fn test_multiple_transfers_increments_counter() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let id1 = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &500_i128,
            &route_hash,
            &50_u32,
        );
        let id2 = client.log_transfer(
            &sender,
            &Symbol::new(&env, "XLM"),
            &Symbol::new(&env, "USDC"),
            &200_i128,
            &route_hash,
            &70_u32,
        );

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);

        let stats = client.get_stats();
        assert_eq!(stats.total_transfers, 2);
        assert_eq!(stats.total_feedback, 0);
    }

    #[test]
    fn test_get_user_transfers() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &100_i128,
            &route_hash,
            &90_u32,
        );
        client.log_transfer(
            &sender,
            &Symbol::new(&env, "XLM"),
            &Symbol::new(&env, "USDC"),
            &200_i128,
            &route_hash,
            &80_u32,
        );

        let transfers = client.get_user_transfers(&sender);
        assert_eq!(transfers.len(), 2);
        assert_eq!(transfers.get(0).unwrap().amount, 100);
        assert_eq!(transfers.get(1).unwrap().amount, 200);
    }

    #[test]
    fn test_submit_feedback() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let transfer_id = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );

        let feedback_id = client.submit_feedback(
            &transfer_id,
            &sender,
            &4_u32,
            &String::from_str(&env, "Great route!"),
        );
        assert_eq!(feedback_id, 1);

        let fb = client.get_feedback(&transfer_id);
        assert_eq!(fb.rating, 4);
        assert_eq!(fb.transfer_id, transfer_id);

        let stats = client.get_stats();
        assert_eq!(stats.total_feedback, 1);
    }

    #[test]
    fn test_route_rating_aggregation() {
        let (env, client) = setup_env();
        let sender1 = Address::generate(&env);
        let sender2 = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let t1 = client.log_transfer(
            &sender1,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );
        let t2 = client.log_transfer(
            &sender2,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &2000_i128,
            &route_hash,
            &90_u32,
        );

        client.submit_feedback(
            &t1,
            &sender1,
            &5_u32,
            &String::from_str(&env, "Excellent!"),
        );
        client.submit_feedback(
            &t2,
            &sender2,
            &3_u32,
            &String::from_str(&env, "Okay route"),
        );

        let rating = client.get_route_rating(&route_hash);
        assert_eq!(rating.total_transfers, 2);
        assert_eq!(rating.total_ratings, 2);
        assert_eq!(rating.sum_ratings, 8); // 5 + 3
    }

    #[test]
    #[should_panic(expected = "rating must be between 1 and 5")]
    fn test_invalid_rating() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let transfer_id = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );

        client.submit_feedback(
            &transfer_id,
            &sender,
            &6_u32,
            &String::from_str(&env, "Bad rating"),
        );
    }

    #[test]
    #[should_panic(expected = "amount must be positive")]
    fn test_invalid_amount() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &0_i128,
            &route_hash,
            &50_u32,
        );
    }

    #[test]
    #[should_panic(expected = "sender does not match transfer sender")]
    fn test_wrong_sender_feedback() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let other = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let transfer_id = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );

        client.submit_feedback(
            &transfer_id,
            &other,
            &4_u32,
            &String::from_str(&env, "Not my transfer"),
        );
    }

    #[test]
    #[should_panic(expected = "feedback already submitted for this transfer")]
    fn test_duplicate_feedback() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        let transfer_id = client.log_transfer(
            &sender,
            &Symbol::new(&env, "USDC"),
            &Symbol::new(&env, "EURC"),
            &1000_i128,
            &route_hash,
            &85_u32,
        );

        client.submit_feedback(
            &transfer_id,
            &sender,
            &4_u32,
            &String::from_str(&env, "First review"),
        );
        // Second feedback should panic.
        client.submit_feedback(
            &transfer_id,
            &sender,
            &5_u32,
            &String::from_str(&env, "Duplicate review"),
        );
    }

    #[test]
    fn test_user_transfers_max_20() {
        let (env, client) = setup_env();
        let sender = Address::generate(&env);
        let route_hash = sample_route_hash(&env);

        // Log 25 transfers.
        for _i in 0..25 {
            client.log_transfer(
                &sender,
                &Symbol::new(&env, "USDC"),
                &Symbol::new(&env, "EURC"),
                &100_i128,
                &route_hash,
                &50_u32,
            );
        }

        let transfers = client.get_user_transfers(&sender);
        // Should only return the last 20.
        assert_eq!(transfers.len(), 20);
        // First returned transfer should be #6 (IDs 6–25).
        assert_eq!(transfers.get(0).unwrap().id, 6);
        assert_eq!(transfers.get(19).unwrap().id, 25);
    }
}
