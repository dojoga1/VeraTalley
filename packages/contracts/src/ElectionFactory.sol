// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Election is unused until VT-103 implements createElection. The import stays
// so the dependency between these two files is visible from the top of the file.
// solhint-disable-next-line no-unused-import
import {Election} from "./Election.sol";
import {IElectionFactory} from "./interfaces/IElectionFactory.sol";

/// @title ElectionFactory
/// @notice Creates elections and keeps the canonical list of them.
///
/// @dev SKELETON. `createElection` is VT-103, Utkarsh.
///
///      This is the one address the whole system is configured with. The web
///      app, the indexer and the audit dashboard all start from here and
///      discover everything else, which is why its address goes in
///      `NEXT_PUBLIC_FACTORY_ADDRESS` and nowhere else is hardcoded.
contract ElectionFactory is IElectionFactory, Ownable {
    /// @dev Every election ever created, in creation order.
    address[] private _elections;

    /// @notice Placeholder while this function is unimplemented.
    /// @dev Delete this error once VT-103 is merged.
    error NotImplemented();

    constructor(address administrator) Ownable(administrator) {}

    /// @inheritdoc IElectionFactory
    function createElection(
        string calldata name,
        uint64 startTime,
        uint64 endTime,
        bytes calldata electionPublicKey
    ) external override onlyOwner returns (address election) {
        // VT-103.
        //   1. Revert InvalidWindow() if endTime <= startTime. Note that
        //      Election's own constructor also checks this. Check here too so
        //      the caller gets the factory's error rather than a failed deploy.
        //   2. Deploy `new Election(name, startTime, endTime, electionPublicKey,
        //      owner())`. Pass owner(), not msg.sender, so that transferring the
        //      factory later does not leave elections behind.
        //   3. Push the address onto _elections.
        //   4. Emit ElectionCreated.
        //   5. Return the address.
        name;
        startTime;
        endTime;
        electionPublicKey;
        revert NotImplemented();
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
