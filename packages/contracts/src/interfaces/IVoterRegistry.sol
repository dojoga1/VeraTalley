// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @title IVoterRegistry
/// @notice Who is allowed to vote in this election. Implemented by `Election`.
///
/// @dev FROZEN as of Monday 27 July 2026. See IElectionBallot for what that means.
///
///      Registration is a roll upload, not a sign-up. The administrator uploads
///      a list of eligible wallet addresses. Nobody self-registers.
interface IVoterRegistry {
    /// @notice Emitted once per `registerVoters` call, carrying the whole batch.
    /// @param voters The addresses in the batch, including any that were already
    ///               registered and therefore counted only once.
    event VotersRegistered(address[] voters);

    /// @notice Emitted when the administrator removes a voter from the roll.
    /// @param voter The address that was removed.
    event VoterRevoked(address voter);

    /// @notice More than MAX_BATCH addresses were passed in a single call.
    error BatchTooLarge();

    /// @notice Voting has already opened, so the roll can no longer change.
    error RegistrationClosed();

    /// @notice The largest number of addresses accepted in one transaction.
    /// @dev 250 keeps a batch comfortably under the block gas limit on Amoy.
    ///      The admin console splits larger rolls into batches of this size.
    function MAX_BATCH() external view returns (uint32);

    /// @notice Add addresses to the voter roll. Administrator only.
    /// @dev Addresses already on the roll are skipped rather than reverting, so
    ///      that an administrator re-uploading the same spreadsheet does not
    ///      fail. Duplicates inside one batch count once.
    /// @param voters Up to MAX_BATCH addresses.
    function registerVoters(address[] calldata voters) external;

    /// @notice Remove one address from the roll. Administrator only.
    /// @dev Revoking someone who has already voted does not delete or alter
    ///      their ballot. A cast ballot is permanent, which is the point.
    /// @param voter The address to remove from the roll.
    function revokeVoter(address voter) external;

    /// @notice True if this address may cast a ballot in this election.
    /// @param voter The address to check.
    function isRegistered(address voter) external view returns (bool);

    /// @notice How many addresses are currently on the roll.
    function registeredCount() external view returns (uint32);
}
