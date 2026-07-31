// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {Election} from "../src/Election.sol";
import {IVoterRegistry} from "../src/interfaces/IVoterRegistry.sol";

/// @title ElectionTest
/// @notice Tests for VT-101 voter registration and revocation.
contract ElectionTest is Test {
    address internal constant ADMIN = address(0xA11CE);
    address internal constant NON_OWNER = address(0xBEEF);
    address internal constant ALICE = address(0xA11);
    address internal constant BOB = address(0xB0B);

    uint64 internal constant START = 1_800_000_000;
    uint64 internal constant END = 1_800_086_400;

    bytes internal constant PUBLIC_KEY =
        hex"8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f";

    Election internal election;

    function setUp() public {
        vm.warp(START - 1 days);

        election = new Election(
            "VT-101 Election",
            START,
            END,
            PUBLIC_KEY,
            ADMIN
        );
    }

    function test_OwnerRegisters250FreshVoters() public {
        address[] memory voters = new address[](250);

        for (uint256 i = 0; i < voters.length; i++) {
            voters[i] = address(uint160(i + 1));
        }

        vm.prank(ADMIN);
        election.registerVoters(voters);

        require(election.registeredCount() == 250, "count should be 250");

        for (uint256 i = 0; i < voters.length; i++) {
            require(election.isRegistered(voters[i]), "voter should be registered");
        }
    }

    function test_DuplicatesAreCountedOnce() public {
        address[] memory voters = new address[](3);
        voters[0] = ALICE;
        voters[1] = ALICE;
        voters[2] = BOB;

        vm.prank(ADMIN);
        election.registerVoters(voters);

        require(election.isRegistered(ALICE), "Alice should be registered");
        require(election.isRegistered(BOB), "Bob should be registered");
        require(election.registeredCount() == 2, "duplicates should count once");
    }

    function test_AlreadyRegisteredAddressIsSkipped() public {
        address[] memory firstBatch = new address[](1);
        firstBatch[0] = ALICE;

        vm.prank(ADMIN);
        election.registerVoters(firstBatch);

        address[] memory secondBatch = new address[](2);
        secondBatch[0] = ALICE;
        secondBatch[1] = BOB;

        vm.prank(ADMIN);
        election.registerVoters(secondBatch);

        require(election.registeredCount() == 2, "existing voter should not be recounted");
    }

    function test_NonOwnerCannotRegisterVoters() public {
        address[] memory voters = new address[](1);
        voters[0] = ALICE;

        vm.prank(NON_OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                NON_OWNER
            )
        );

        election.registerVoters(voters);
    }

    function test_NonOwnerCannotRevokeVoter() public {
        address[] memory voters = new address[](1);
        voters[0] = ALICE;

        vm.prank(ADMIN);
        election.registerVoters(voters);

        vm.prank(NON_OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                NON_OWNER
            )
        );

        election.revokeVoter(ALICE);
    }

    function test_OwnerCanRevokeVoter() public {
        address[] memory voters = new address[](1);
        voters[0] = ALICE;

        vm.prank(ADMIN);
        election.registerVoters(voters);

        vm.prank(ADMIN);
        election.revokeVoter(ALICE);

        require(!election.isRegistered(ALICE), "Alice should be revoked");
        require(election.registeredCount() == 0, "count should decrease");
    }

    function test_RevokingUnregisteredVoterDoesNotUnderflow() public {
        vm.prank(ADMIN);
        election.revokeVoter(ALICE);

        require(election.registeredCount() == 0, "count should remain zero");
    }

    function test_RegistrationAfterVotingOpensReverts() public {
        address[] memory voters = new address[](1);
        voters[0] = ALICE;

        vm.warp(START);

        vm.prank(ADMIN);
        vm.expectRevert(IVoterRegistry.RegistrationClosed.selector);

        election.registerVoters(voters);
    }

    function test_BatchOf251Reverts() public {
        address[] memory voters = new address[](251);

        for (uint256 i = 0; i < voters.length; i++) {
            voters[i] = address(uint160(i + 1));
        }

        vm.prank(ADMIN);
        vm.expectRevert(IVoterRegistry.BatchTooLarge.selector);

        election.registerVoters(voters);
    }

    function testFuzz_RegisteredCountMatchesTrueNumber(
        uint256 seed
    ) public {
        bool[16] memory expected;
        uint32 expectedCount;

        for (uint256 step = 0; step < 64; step++) {
            uint256 randomValue = uint256(
                keccak256(abi.encode(seed, step))
            );

            uint256 voterIndex = randomValue % 16;
            address voter = address(uint160(voterIndex + 1));
            bool shouldRegister = ((randomValue >> 8) & 1) == 0;

            if (shouldRegister) {
                address[] memory voters = new address[](1);
                voters[0] = voter;

                vm.prank(ADMIN);
                election.registerVoters(voters);

                if (!expected[voterIndex]) {
                    expected[voterIndex] = true;
                    expectedCount++;
                }
            } else {
                vm.prank(ADMIN);
                election.revokeVoter(voter);

                if (expected[voterIndex]) {
                    expected[voterIndex] = false;
                    expectedCount--;
                }
            }

            require(
                election.registeredCount() == expectedCount,
                "registered count mismatch"
            );
        }

        for (uint256 i = 0; i < expected.length; i++) {
            require(
                election.isRegistered(address(uint160(i + 1))) == expected[i],
                "registration state mismatch"
            );
        }
    }


    function test_RevokeAfterVotingDoesNotAlterBallot() public {
        address[] memory voters = new address[](1);
        voters[0] = ALICE;

        vm.prank(ADMIN);
        election.registerVoters(voters);

        vm.warp(START);

        bytes memory payload = bytes("alice-ballot");
        bytes32 expectedHash = keccak256(payload);

        vm.prank(ALICE);
        election.castBallot(payload);

        (bytes32 hashBefore, uint64 castAtBefore) = election.ballotOf(ALICE);

        vm.prank(ADMIN);
        election.revokeVoter(ALICE);

        require(!election.isRegistered(ALICE), "Alice should be revoked");
        require(election.registeredCount() == 0, "registered count should be zero");

        (bytes32 hashAfter, uint64 castAtAfter) = election.ballotOf(ALICE);

        require(hashBefore == expectedHash, "hash before mismatch");
        require(hashAfter == expectedHash, "hash changed after revoke");
        require(castAtAfter == castAtBefore, "timestamp changed after revoke");
    }
}