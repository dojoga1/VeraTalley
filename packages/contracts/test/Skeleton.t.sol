// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {Election} from "../src/Election.sol";
import {ElectionFactory} from "../src/ElectionFactory.sol";

/// @title SkeletonTest
/// @notice Proves the test harness itself works, before anyone writes a feature.
///
/// @dev This file covers only the parts of the skeleton that are finished: the
///      constructors, the metadata getters and the factory's empty list. It is
///      here so that `pnpm test` is green on day one and a red CI run always
///      means you broke something.
///
///      Do not add feature tests here. VT-101 and VT-102 create
///      `test/Election.t.sol`, VT-103 creates `test/ElectionFactory.t.sol`.
contract SkeletonTest is Test {
    address internal constant ADMIN = address(0xA11CE);

    uint64 internal constant START = 1_800_000_000;
    uint64 internal constant END = 1_800_086_400;

    bytes internal constant PUBLIC_KEY =
        hex"8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f";

    Election internal election;
    ElectionFactory internal factory;

    function setUp() public {
        election = new Election("Skeleton Election", START, END, PUBLIC_KEY, ADMIN);
        factory = new ElectionFactory(ADMIN);
    }

    // -----------------------------------------------------------------------
    // Election metadata
    // -----------------------------------------------------------------------

    function test_ElectionStoresItsMetadata() public view {
        require(
            keccak256(bytes(election.name())) == keccak256(bytes("Skeleton Election")),
            "name should round trip"
        );
        require(election.startTime() == START, "startTime should round trip");
        require(election.endTime() == END, "endTime should round trip");
        require(
            keccak256(election.electionPublicKey()) == keccak256(PUBLIC_KEY),
            "public key should round trip"
        );
    }

    function test_ElectionOwnerIsTheAdministrator() public view {
        require(election.owner() == ADMIN, "administrator should own the election");
    }

    function test_MaxBatchIs250() public view {
        require(election.MAX_BATCH() == 250, "MAX_BATCH should be 250");
    }

    function test_MaxPayloadIs4096() public view {
        require(election.MAX_PAYLOAD_BYTES() == 4096, "MAX_PAYLOAD_BYTES should be 4096");
    }

    // -----------------------------------------------------------------------
    // Election construction is validated
    // -----------------------------------------------------------------------

    function test_RevertsWhenTheWindowIsBackToFront() public {
        vm.expectRevert(Election.InvalidWindow.selector);
        new Election("Bad window", END, START, PUBLIC_KEY, ADMIN);
    }

    function test_RevertsWhenTheWindowIsZeroLength() public {
        vm.expectRevert(Election.InvalidWindow.selector);
        new Election("Zero window", START, START, PUBLIC_KEY, ADMIN);
    }

    function test_RevertsWithoutAPublicKey() public {
        vm.expectRevert(Election.MissingPublicKey.selector);
        new Election("No key", START, END, "", ADMIN);
    }

    // -----------------------------------------------------------------------
    // Factory
    // -----------------------------------------------------------------------

    function test_FactoryStartsEmpty() public view {
        require(factory.electionCount() == 0, "a new factory should hold no elections");
        require(factory.getElections().length == 0, "the list should be empty");
    }

    function test_FactoryOwnerIsTheAdministrator() public view {
        require(factory.owner() == ADMIN, "administrator should own the factory");
    }
}
