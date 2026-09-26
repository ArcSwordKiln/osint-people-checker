//! Checks, verdicts and receipts for Marlowe.

use std::fmt;

/// What the person is checking. It decides which checks run and how the
/// verdict is worded.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Reason {
    Seller,
    RecruiterOrJob,
    Landlord,
    WebsiteOrShop,
    Myself,
}

impl Reason {
    pub fn label(self) -> &'static str {
        match self {
            Reason::Seller => "A seller",
            Reason::RecruiterOrJob => "A recruiter or job",
            Reason::Landlord => "A landlord",
            Reason::WebsiteOrShop => "A website or shop",
            Reason::Myself => "Myself",
        }
    }
}

/// The one-line answer at the top of every case.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Verdict {
    LooksFine,
    BeCareful,
    RedFlags,
}

impl Verdict {
    pub fn label(self) -> &'static str {
        match self {
            Verdict::LooksFine => "Looks fine",
            Verdict::BeCareful => "Be careful",
            Verdict::RedFlags => "Red flags",
        }
    }

    /// Mixed signals never produce `RedFlags` on their own: it takes at least
    /// two strong signals, and any doubt falls back to `BeCareful`.
    pub fn from_signals(strong: usize, weak: usize) -> Verdict {
        match (strong, weak) {
            (s, _) if s >= 2 => Verdict::RedFlags,
            (1, _) | (0, 2..) => Verdict::BeCareful,
            _ => Verdict::LooksFine,
        }
    }
}

impl fmt::Display for Verdict {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.label())
    }
}

/// Proof that a page said what it said, at the moment it was found.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Receipt {
    /// Exhibit number shown in the app and the report, e.g. `A3`.
    pub exhibit: String,
    pub url: String,
    /// RFC 3339 timestamp in UTC.
    pub captured_at: String,
    /// Lowercase hex SHA-256 of the saved snapshot.
    pub sha256: String,
    /// Wayback Machine copy, if one was made.
    pub archive_url: Option<String>,
}

impl Receipt {
    /// A receipt is only usable as proof if its hash is a full SHA-256.
    pub fn is_well_formed(&self) -> bool {
        self.sha256.len() == 64
            && self
                .sha256
                .bytes()
                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
    }

    pub fn short_hash(&self) -> String {
        format!("{}…{}", &self.sha256[..6], &self.sha256[60..])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verdict_needs_two_strong_signals_for_red_flags() {
        assert_eq!(Verdict::from_signals(2, 0), Verdict::RedFlags);
        assert_eq!(Verdict::from_signals(1, 3), Verdict::BeCareful);
        assert_eq!(Verdict::from_signals(0, 2), Verdict::BeCareful);
        assert_eq!(Verdict::from_signals(0, 1), Verdict::LooksFine);
        assert_eq!(Verdict::RedFlags.to_string(), "Red flags");
    }

    #[test]
    fn receipt_hash_must_be_full_lowercase_sha256() {
        let mut r = Receipt {
            exhibit: "A3".into(),
            url: "https://example.org/photo/48213".into(),
            captured_at: "2026-10-30T14:02:11Z".into(),
            sha256: "a28cce669ab76071a1338dd45a6b2335fbc2ae1d563e8026ab6165843f3667ca".into(),
            archive_url: None,
        };
        assert!(r.is_well_formed());
        assert_eq!(r.short_hash(), "a28cce…67ca");
        r.sha256.make_ascii_uppercase();
        assert!(!r.is_well_formed());
        assert_eq!(Reason::RecruiterOrJob.label(), "A recruiter or job");
    }
}
