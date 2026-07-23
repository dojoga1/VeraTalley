// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @title IElectionMetadata
/// @notice The descriptive facts about an election: what it is called, when it
///         runs, and the public key ballots are sealed to.
///
/// @dev FROZEN as of Monday 27 July 2026.
///
///      This exists as its own interface because the Voter App (VT-105) and the
///      audit dashboard (VT-108) read these four values for every election in a
///      list, and neither of them needs, or should depend on, the ballot casting
///      surface to do it.
///
///      `electionPublicKey` is a 32 byte X25519 public key. The matching private
///      key is generated off chain and held by the election authority. Publishing
///      the public key on chain is what lets any browser seal a ballot that only
///      the authority can open, with no server involved.
interface IElectionMetadata {
    /// @notice Human readable name, for example "UTA Student Government 2026".
    function name() external view returns (string memory);

    /// @notice Voting opens at this timestamp, inclusive. Unix seconds.
    function startTime() external view returns (uint64);

    /// @notice Voting closes at this timestamp, exclusive. Unix seconds.
    /// @dev The window is [startTime, endTime). A ballot cast in the same second
    ///      as endTime is rejected. This is stated so nobody has to guess.
    function endTime() external view returns (uint64);

    /// @notice The X25519 public key that ballots in this election are sealed to.
    function electionPublicKey() external view returns (bytes memory);
}
