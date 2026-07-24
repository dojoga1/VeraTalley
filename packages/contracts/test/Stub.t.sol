// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {StubElection} from "../src/stub/StubElection.sol";
import {StubElectionFactory} from "../src/stub/StubElectionFactory.sol";

/// @title StubTest
/// @notice Proves the stub answers the reads VT-105 and VT-108 depend on.
///
/// @dev Deleted along with the stub when VT-112 lands.
///
///      These are worth writing even for a throwaway. The stub goes onto a real
///      network and two people build against it for a week, so "it deployed" is
///      not the same as "it returns the right thing".
contract StubTest is Test {
    bytes internal constant PUBLIC_KEY = hex"1111111111111111111111111111111111111111111111111111111111111111";

    uint64 internal constant DAY = 86_400;

    StubElectionFactory internal factory;

    function setUp() public {
        // Start from a fixed, far-from-zero timestamp so the "closed" window can
        // sit in the past without underflowing.
        vm.warp(1_800_000_000);
        factory = new StubElectionFactory();
    }

    function test_FactoryStartsEmpty() public view {
        require(factory.electionCount() == 0, "should start empty");
        require(factory.getElections().length == 0, "list should be empty");
    }

    function test_OwnerIsTheDeployer() public view {
        require(factory.owner() == address(this), "deployer should be owner");
    }

    function test_SeedsThreeElectionsInOrder() public {
        uint64 t = uint64(block.timestamp);

        address upcoming = factory.createElection("Upcoming", t + 7 * DAY, t + 14 * DAY, PUBLIC_KEY);
        address open = factory.createElection("Open", t - 1 * DAY, t + 6 * DAY, PUBLIC_KEY);
        address closed = factory.createElection("Closed", t - 14 * DAY, t - 7 * DAY, PUBLIC_KEY);

        require(factory.electionCount() == 3, "should hold three");

        address[] memory all = factory.getElections();
        require(all[0] == upcoming, "creation order should be preserved");
        require(all[1] == open, "creation order should be preserved");
        require(all[2] == closed, "creation order should be preserved");
    }

    /// @dev The three states VT-105 criterion 2 tests against.
    function test_TheThreeLifecycleStatesAreDistinguishable() public {
        uint64 t = uint64(block.timestamp);

        StubElection upcoming = StubElection(
            factory.createElection("Upcoming", t + 7 * DAY, t + 14 * DAY, PUBLIC_KEY)
        );
        StubElection open = StubElection(
            factory.createElection("Open", t - 1 * DAY, t + 6 * DAY, PUBLIC_KEY)
        );
        StubElection closed = StubElection(
            factory.createElection("Closed", t - 14 * DAY, t - 7 * DAY, PUBLIC_KEY)
        );

        require(!upcoming.isVotingOpen(), "upcoming should not be open");
        require(open.isVotingOpen(), "open should be open");
        require(!closed.isVotingOpen(), "closed should not be open");
    }

    function test_MetadataRoundTrips() public {
        uint64 t = uint64(block.timestamp);

        StubElection e = StubElection(factory.createElection("Round trip", t, t + DAY, PUBLIC_KEY));

        require(keccak256(bytes(e.name())) == keccak256(bytes("Round trip")), "name");
        require(e.startTime() == t, "startTime");
        require(e.endTime() == t + DAY, "endTime");
        require(keccak256(e.electionPublicKey()) == keccak256(PUBLIC_KEY), "public key");
    }

    function test_TurnoutIsAlwaysZero() public {
        uint64 t = uint64(block.timestamp);
        StubElection e = StubElection(factory.createElection("Empty", t, t + DAY, PUBLIC_KEY));

        require(e.ballotCount() == 0, "a stub holds no ballots");
    }

    function test_VotingAlwaysReverts() public {
        uint64 t = uint64(block.timestamp);
        StubElection e = StubElection(factory.createElection("No voting", t, t + DAY, PUBLIC_KEY));

        vm.expectRevert(StubElection.ThisIsAStub.selector);
        e.castBallot(hex"00");
    }

    function test_OnlyTheOwnerCanSeed() public {
        uint64 t = uint64(block.timestamp);

        vm.prank(address(0xBEEF));
        vm.expectRevert(StubElectionFactory.NotOwner.selector);
        factory.createElection("Not allowed", t, t + DAY, PUBLIC_KEY);
    }

    function test_RejectsABackToFrontWindow() public {
        uint64 t = uint64(block.timestamp);

        vm.expectRevert(StubElectionFactory.InvalidWindow.selector);
        factory.createElection("Bad", t + DAY, t, PUBLIC_KEY);
    }
}
