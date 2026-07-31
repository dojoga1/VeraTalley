// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

// Election is unused until VT-103 implements createElection. The import stays
// so the dependency between these two files is visible from the top of the file.
// solhint-disable-next-line no-unused-import
import {Election} from "./Election.sol";
import {IElectionFactory} from "./interfaces/IElectionFactory.sol";

/// @title ElectionFactory
/// @notice Creates elections and keeps the canonical list of them.
///
/// @dev SKELETON. `createElection` is VT-103, Rahul.
///
///      This is the one address the whole system is configured with. The web
///      app, the indexer and the audit dashboard all start from here and
///      discover everything else, which is why its address goes in
///      `NEXT_PUBLIC_FACTORY_ADDRESS` and nowhere else is hardcoded.
///
///      Ownership is `Ownable2Step`, not `Ownable`: transferring requires the
///      new owner to accept. A single mistyped address would otherwise orphan
///      the factory, and with it every election it has ever created, because
///      the administrator of an election is the factory's owner.
///
///      Until VT-103 lands, the deployed factory on Amoy is the throwaway in
///      `src/stub/`. See `deployments/amoy.json`.
contract ElectionFactory is IElectionFactory, Ownable2Step {
    /// @dev Every election ever created, in creation order.
    address[] private _elections;


    constructor(address administrator) Ownable(administrator) {}

    /// @inheritdoc IElectionFactory
    function createElection(
        string calldata name,
        uint64 startTime,
        uint64 endTime,
        bytes calldata electionPublicKey
    ) external override onlyOwner returns (address election) {
        if (endTime <= startTime) {
            revert InvalidWindow();
        }

        Election newElection = new Election(name, startTime, endTime, electionPublicKey, owner());
        election = address(newElection);

        _elections.push(election);

        emit ElectionCreated(election, name, startTime, endTime);

        return election;
    }

    /// @inheritdoc IElectionFactory
    function getElections() external view override returns (address[] memory) {
        return _elections;
    }

    /// @inheritdoc IElectionFactory
    function electionCount() external view override returns (uint32) {
        return uint32(_elections.length);
    }

    /// @inheritdoc IElectionFactory
    /// @dev Both `IElectionFactory` and OpenZeppelin's `Ownable` declare
    ///      `owner()`, so Solidity requires the derived contract to say
    ///      explicitly which one it is resolving. The behaviour is Ownable's.
    function owner() public view virtual override(IElectionFactory, Ownable) returns (address) {
        return super.owner();
    }
}
