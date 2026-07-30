// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @title IElectionFactory
/// @notice Creates elections and keeps the canonical list of them.
///
/// @dev FROZEN as of Monday 27 July 2026.
///
///      Each election gets its own contract instance so that one election's
///      state cannot affect another's. The factory is the single address the
///      frontend, the indexer and the audit dashboard are configured with, and
///      everything else is discovered from it.
///
///      The factory owner is the administrator. `IElectionFactory.owner()` is
///      also what Sign In With Ethereum checks against in VT-107: the only
///      wallet that can reach the admin console is the one that owns this.
interface IElectionFactory {
    /// @notice Emitted for every election created. The indexer backfills from this.
    /// @dev `election` is indexed so the indexer and the audit dashboard can
    ///      filter the log for one election without downloading every event
    ///      ever emitted by the factory.
    /// @param election  Address of the newly deployed election contract.
    /// @param name      Human readable name.
    /// @param startTime Voting opens, inclusive, unix seconds.
    /// @param endTime   Voting closes, exclusive, unix seconds.
    event ElectionCreated(address indexed election, string name, uint64 startTime, uint64 endTime);

    /// @notice `endTime` was at or before `startTime`.
    error InvalidWindow();

    /// @notice Deploy a new election. Administrator only.
    /// @param name              Human readable name.
    /// @param startTime         Voting opens, inclusive, unix seconds.
    /// @param endTime           Voting closes, exclusive, unix seconds.
    /// @param electionPublicKey 32 byte X25519 public key ballots are sealed to.
    /// @return election         Address of the newly deployed election contract.
    function createElection(
        string calldata name,
        uint64 startTime,
        uint64 endTime,
        bytes calldata electionPublicKey
    ) external returns (address election);

    /// @notice Every election ever created, in creation order.
    function getElections() external view returns (address[] memory);

    /// @notice How many elections exist.
    function electionCount() external view returns (uint32);

    /// @notice The administrator wallet. Sign In With Ethereum checks this.
    /// @dev Ownership transfer is two step: the current owner nominates, and
    ///      the nominee has to accept. A mistyped address therefore cannot
    ///      orphan the factory, which would leave every election it created
    ///      with no administrator and no way to appoint one.
    function owner() external view returns (address);
}
