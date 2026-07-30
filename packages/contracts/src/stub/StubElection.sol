// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {IElectionMetadata} from "../interfaces/IElectionMetadata.sol";

/// @title StubElection
/// @notice Throwaway. Answers the read calls the frontend needs, and nothing else.
///
/// @dev **This contract is deleted when VT-112 lands.** Do not build on it, do
///      not import it from application code, and do not copy anything out of it
///      into `Election.sol`.
///
///      It exists for one reason. VT-105 (elections list) and VT-108 (audit
///      dashboard) both need a real factory address on Amoy with real elections
///      in it before they can do anything. Without this, two frontend
///      developers spend week one of five waiting on a contracts developer who
///      is writing their first Solidity. This removes that dependency entirely.
///
///      It implements `IElectionMetadata` exactly, and matches the signatures
///      of `ballotCount()` and `isVotingOpen()` from `IElectionBallot`, so the
///      generated ABI the frontend calls is the same before and after the swap.
///      Nothing on the read path changes when the real contracts replace it.
///
///      What it deliberately does not do: register voters, accept a ballot, or
///      store anything. `ballotCount()` is always 0. Any attempt to vote
///      reverts. That is correct behaviour for a placeholder, and it means
///      nobody can mistake it for the real thing.
contract StubElection is IElectionMetadata {
    /// @inheritdoc IElectionMetadata
    string public override name;

    /// @inheritdoc IElectionMetadata
    uint64 public immutable override startTime;

    /// @inheritdoc IElectionMetadata
    uint64 public immutable override endTime;

    /// @inheritdoc IElectionMetadata
    bytes public override electionPublicKey;

    /// @notice This is a placeholder contract, not a real election.
    error ThisIsAStub();

    /// @notice Create a placeholder election.
    /// @param name_              Human readable name.
    /// @param startTime_         Voting opens, inclusive, unix seconds.
    /// @param endTime_           Voting closes, exclusive, unix seconds.
    /// @param electionPublicKey_ Any non-empty bytes. Nothing is sealed to it.
    constructor(
        string memory name_,
        uint64 startTime_,
        uint64 endTime_,
        bytes memory electionPublicKey_
    ) {
        name = name_;
        startTime = startTime_;
        endTime = endTime_;
        electionPublicKey = electionPublicKey_;
    }

    /// @notice Always 0. Nothing can be cast here.
    /// @dev Present so the audit dashboard can render a turnout column against
    ///      the stub without special-casing it.
    function ballotCount() external pure returns (uint32) {
        return 0;
    }

    /// @notice True when now is within [startTime, endTime).
    /// @dev The same window arithmetic the real contract uses, so the status
    ///      badge on the elections list is correct against the stub too.
    function isVotingOpen() external view returns (bool) {
        return block.timestamp >= startTime && block.timestamp < endTime;
    }

    /// @notice Always reverts. This is a placeholder, not an election.
    function castBallot(bytes calldata) external pure {
        revert ThisIsAStub();
    }
}
