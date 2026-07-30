// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {StubElection} from "./StubElection.sol";

/// @title StubElectionFactory
/// @notice Throwaway factory, live on Amoy so the frontend has real data in Week 1.
///
/// @dev **This contract is deleted when VT-112 lands.** Rahul's VT-103 replaces
///      it entirely with the real `ElectionFactory`.
///
///      It answers `getElections()`, `electionCount()` and `owner()` with the
///      same signatures as `IElectionFactory`, and each address it returns is a
///      `StubElection` answering `name()`, `startTime()` and `endTime()`. So
///      every read the elections list and the audit dashboard perform works
///      identically against this and against the real thing.
///
///      It does not implement `IElectionFactory`, deliberately. Declaring
///      conformance to a frozen interface it only partly honours would be a lie
///      that the compiler would then help enforce. It matches the shape where
///      the frontend touches it, and says plainly that it is a stub everywhere
///      else.
contract StubElectionFactory {
    /// @notice The account that deployed this. Matches `IElectionFactory.owner()`.
    address public immutable owner;

    /// @dev Every stub election created, in creation order.
    address[] private _elections;

    /// @notice Only the deployer may seed elections.
    error NotOwner();

    /// @notice `endTime` was at or before `startTime`.
    error InvalidWindow();

    /// @notice Emitted per seeded election. Same shape as the real factory's.
    /// @param election  Address of the new stub election.
    /// @param name      Human readable name.
    /// @param startTime Voting opens, inclusive, unix seconds.
    /// @param endTime   Voting closes, exclusive, unix seconds.
    event ElectionCreated(address indexed election, string name, uint64 startTime, uint64 endTime);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Seed a placeholder election.
    /// @param name              Human readable name.
    /// @param startTime         Voting opens, inclusive, unix seconds.
    /// @param endTime           Voting closes, exclusive, unix seconds.
    /// @param electionPublicKey Any non-empty bytes. Nothing is sealed to it.
    /// @return election         Address of the new stub election.
    function createElection(
        string calldata name,
        uint64 startTime,
        uint64 endTime,
        bytes calldata electionPublicKey
    ) external returns (address election) {
        if (msg.sender != owner) revert NotOwner();
        if (endTime <= startTime) revert InvalidWindow();

        election = address(new StubElection(name, startTime, endTime, electionPublicKey));
        _elections.push(election);

        emit ElectionCreated(election, name, startTime, endTime);
    }

    /// @notice Every stub election, in creation order.
    function getElections() external view returns (address[] memory) {
        return _elections;
    }

    /// @notice How many stub elections exist.
    function electionCount() external view returns (uint32) {
        return uint32(_elections.length);
    }
}
