// Keep the journal module independently testable until the application crate
// wires its command surface into `lib.rs`.  The module itself owns the unit
// tests; this integration target provides a focused Cargo test entry point.
#[path = "../src/mutation_journal.rs"]
mod mutation_journal;
