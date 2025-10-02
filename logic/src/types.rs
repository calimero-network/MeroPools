pub mod id {
    use calimero_sdk::borsh::{BorshDeserialize, BorshSerialize};
    use calimero_sdk::serde::{Deserialize, Serialize};

    #[derive(
        Debug, Clone, PartialEq, Eq, Hash, BorshSerialize, BorshDeserialize, Serialize, Deserialize,
    )]
    #[borsh(crate = "calimero_sdk::borsh")]
    #[serde(crate = "calimero_sdk::serde")]
    #[serde(transparent)]
    pub struct UserId(pub String);

    impl UserId {
        pub fn new(id: String) -> Self {
            Self(id)
        }
    }

    impl std::fmt::Display for UserId {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "{}", self.0)
        }
    }
}
