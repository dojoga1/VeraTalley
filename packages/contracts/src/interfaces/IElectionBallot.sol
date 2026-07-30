// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @title IElectionBallot
/// @notice The ballot casting surface of an election. This is the contract
///         between the Blockchain team and everyone else.
///
/// @dev FROZEN as of Monday 27 July 2026.
///
///      Changing anything in this file breaks the Voter App, the Admin console,
///      the audit dashboard and the indexer at the same time. A change needs a
///      pull request labelled `contract-change` and Bhargav's approval. Adding a
///      new optional function is fine. Renaming or removing one is not.
///
///      Two design decisions worth understanding before you implement this.
///
///      1. The contract never looks inside `ciphertext`. It takes opaque bytes.
///         That is deliberate: it means the encryption scheme can change in
///         Week 4 without changing this interface and breaking three teams.
///
///      2. The ciphertext goes in the event log, not in contract storage.
///         Storage costs 20,000 gas per 32 bytes. Event log data costs 8 gas per
///         byte. Both are permanently readable by anyone. Storage would cost
///         roughly three hundred times more for no benefit.
interface IElectionBallot {
    /// @notice Emitted once per accepted ballot. This event is the ballot log.
    ///         The indexer, the audit dashboard and the tally tool all read it.
    /// @param voter      The wallet that cast the ballot. Public by design:
    ///                   that someone voted is public, what they chose is not.
    /// @param ballotHash keccak256 of the ciphertext, the voter's receipt value.
    /// @param sequence   1-based position in this election. No gaps, no repeats.
    /// @param castAt     Block timestamp, unix seconds.
    /// @param ciphertext The sealed ballot. Meaningless without the election key.
    event BallotCast(
        address indexed voter,
        bytes32 indexed ballotHash,
        uint32 indexed sequence,
        uint64 castAt,
        bytes ciphertext
    );

    /// @notice The caller is not on the voter roll for this election.
    error NotRegistered();

    /// @notice This wallet has already cast a ballot. One wallet, one ballot.
    error AlreadyVoted();

    /// @notice Now is before startTime, or at or after endTime.
    error VotingClosed();

    /// @notice `ciphertext` was zero bytes long.
    error EmptyPayload();

    /// @notice `ciphertext` was longer than the maximum accepted payload.
    error PayloadTooLarge();

    /// @notice Cast a sealed ballot.
    /// @dev Checks, then effects, then the event, in that order. Never make an
    ///      external call from this function.
    ///
    ///      Check order is fixed so that error messages are predictable for the
    ///      frontend: registered, has not voted, voting open, payload not empty,
    ///      payload not too large, contract not paused.
    /// @param ciphertext The sealed ballot produced by the voter's browser.
    function castBallot(bytes calldata ciphertext) external;

    /// @notice Look up a wallet's ballot.
    /// @param voter The wallet to look up.
    /// @return ballotHash keccak256 of their ciphertext, or bytes32(0) if none.
    /// @return castAt     When they voted, unix seconds, or 0 if they have not.
    function ballotOf(address voter) external view returns (bytes32 ballotHash, uint64 castAt);

    /// @notice Total ballots accepted so far. This is public turnout.
    function ballotCount() external view returns (uint32);

    /// @notice True when now is within [startTime, endTime) and not paused.
    function isVotingOpen() external view returns (bool);
}
