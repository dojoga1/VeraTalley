// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";

import {Election} from "../src/Election.sol";
import {IElectionBallot} from "../src/interfaces/IElectionBallot.sol";

/// @title ElectionBallotTest
/// @notice Tests for VT-102: castBallot and the BallotCast event.
///
/// @dev Because VT-101 (voter registry) is not yet implemented, we use
///      `vm.store` to write directly to the `_registered` mapping so that
///      voters appear on the roll without calling `registerVoters`.
///
///      Storage layout (verified empirically with SlotFinder diagnostic):
///        slot 0: Ownable._owner (20 bytes) + Pausable._paused (1 byte) PACKED
///        slot 1: name (dynamic string)
///        slot 2: electionPublicKey (dynamic bytes)
///        slot 3: _registered mapping   <-- this is the one we vm.store into
///        slot 4: _hasVoted mapping
///        slot 5: _ballotHash mapping
///        slot 6: _castAt mapping
///        slot 7: _registeredCount + _ballotCount (packed uint32s)
contract ElectionBallotTest is Test {
    address internal constant ADMIN = address(0xA11CE);
    address internal constant VOTER = address(0xBEEF);
    address internal constant STRANGER = address(0xDEAD);

    uint64 internal constant START = 1_800_000_000;
    uint64 internal constant END = 1_800_086_400; // START + 1 day

    bytes internal constant PUBLIC_KEY =
        hex"8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f";

    /// @dev Slot index of the `_registered` mapping in Election's storage.
    uint256 internal constant REGISTERED_SLOT = 3;

    Election internal election;

    // -- helpers --------------------------------------------------------------

    /// @dev Write `_registered[voter] = true` directly into storage.
    function _forceRegister(address voter) internal {
        bytes32 slot = keccak256(abi.encode(voter, REGISTERED_SLOT));
        vm.store(address(election), slot, bytes32(uint256(1)));
    }

    /// @dev Build a deterministic ciphertext of the requested length.
    function _payload(uint256 length) internal pure returns (bytes memory) {
        bytes memory data = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            data[i] = bytes1(uint8(i % 256));
        }
        return data;
    }

    // -- setup ----------------------------------------------------------------

    function setUp() public {
        election = new Election("Ballot Test Election", START, END, PUBLIC_KEY, ADMIN);

        // Warp into the voting window so castBallot does not revert with
        // VotingClosed by default.
        vm.warp(START + 1);
    }

    // =========================================================================
    // Criterion 1: a registered voter with a 200 byte payload succeeds.
    //   ballotCount becomes 1, ballotOf returns the correct hash and timestamp,
    //   and the event carries all five fields.
    // =========================================================================

    function test_RegisteredVoterCanCastBallot() public {
        _forceRegister(VOTER);

        bytes memory payload = _payload(200);
        bytes32 expectedHash = keccak256(payload);

        // Expect the BallotCast event with all five fields.
        vm.expectEmit(true, true, true, true, address(election));
        emit IElectionBallot.BallotCast(
            VOTER,
            expectedHash,
            1, // sequence
            uint64(block.timestamp),
            payload
        );

        vm.prank(VOTER);
        election.castBallot(payload);

        // ballotCount should be 1.
        require(election.ballotCount() == 1, "ballotCount should be 1");

        // ballotOf should return the correct hash and timestamp.
        (bytes32 hash, uint64 castAt) = election.ballotOf(VOTER);
        require(hash == expectedHash, "ballotOf hash mismatch");
        require(castAt == uint64(block.timestamp), "ballotOf castAt mismatch");
    }

    // =========================================================================
    // Criterion 2: the same voter calling again reverts with AlreadyVoted()
    //   and ballotCount is unchanged.
    // =========================================================================

    function test_SameVoterRevertsAlreadyVoted() public {
        _forceRegister(VOTER);

        vm.prank(VOTER);
        election.castBallot(_payload(200));

        // Second attempt should revert.
        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.AlreadyVoted.selector);
        election.castBallot(_payload(200));

        // ballotCount should still be 1.
        require(election.ballotCount() == 1, "ballotCount should still be 1");
    }

    // =========================================================================
    // Criterion 3: an unregistered address reverts with NotRegistered().
    // =========================================================================

    function test_UnregisteredVoterRevertsNotRegistered() public {
        vm.prank(STRANGER);
        vm.expectRevert(IElectionBallot.NotRegistered.selector);
        election.castBallot(_payload(200));
    }

    // =========================================================================
    // Criterion 4: before startTime or at/after endTime reverts VotingClosed().
    //   The window includes the start second and excludes the end second.
    // =========================================================================

    function test_BeforeStartTimeRevertsVotingClosed() public {
        _forceRegister(VOTER);

        // One second before the window opens.
        vm.warp(START - 1);

        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.VotingClosed.selector);
        election.castBallot(_payload(200));
    }

    function test_AtStartTimeSucceeds() public {
        _forceRegister(VOTER);

        // Exactly at startTime — should succeed (window is inclusive of start).
        vm.warp(START);

        vm.prank(VOTER);
        election.castBallot(_payload(200));

        require(election.ballotCount() == 1, "ballot at startTime should succeed");
    }

    function test_AtEndTimeRevertsVotingClosed() public {
        _forceRegister(VOTER);

        // Exactly at endTime — should revert (window excludes end).
        vm.warp(END);

        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.VotingClosed.selector);
        election.castBallot(_payload(200));
    }

    function test_AfterEndTimeRevertsVotingClosed() public {
        _forceRegister(VOTER);

        vm.warp(END + 1);

        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.VotingClosed.selector);
        election.castBallot(_payload(200));
    }

    // =========================================================================
    // Criterion 5: empty payload reverts EmptyPayload().
    //   Payload over 4096 bytes reverts PayloadTooLarge().
    // =========================================================================

    function test_EmptyPayloadRevertsEmptyPayload() public {
        _forceRegister(VOTER);

        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.EmptyPayload.selector);
        election.castBallot("");
    }

    function test_PayloadOver4096RevertsPayloadTooLarge() public {
        _forceRegister(VOTER);

        vm.prank(VOTER);
        vm.expectRevert(IElectionBallot.PayloadTooLarge.selector);
        election.castBallot(_payload(4097));
    }

    function test_PayloadExactly4096Succeeds() public {
        _forceRegister(VOTER);

        vm.prank(VOTER);
        election.castBallot(_payload(4096));

        require(election.ballotCount() == 1, "4096 byte payload should be accepted");
    }

    // =========================================================================
    // Criterion 6: when the owner has paused the contract, it reverts.
    // =========================================================================

    function test_PausedContractReverts() public {
        _forceRegister(VOTER);

        vm.prank(ADMIN);
        election.pause();

        vm.prank(VOTER);
        vm.expectRevert(); // Pausable: EnforcedPause
        election.castBallot(_payload(200));
    }

    function test_UnpausedContractResumes() public {
        _forceRegister(VOTER);

        vm.prank(ADMIN);
        election.pause();

        vm.prank(ADMIN);
        election.unpause();

        vm.prank(VOTER);
        election.castBallot(_payload(200));

        require(election.ballotCount() == 1, "should work after unpause");
    }

    // =========================================================================
    // Criterion 7: 50 different registered voters vote in sequence and get
    //   sequence numbers 1 through 50 with no gaps and no duplicates.
    // =========================================================================

    function test_FiftyVotersGetSequentialNumbers() public {
        bytes memory payload = _payload(200);

        for (uint256 i = 1; i <= 50; i++) {
            address voter = address(uint160(0x1000 + i));
            _forceRegister(voter);

            bytes32 expectedHash = keccak256(payload);

            // Expect BallotCast with the correct sequence number.
            vm.expectEmit(true, true, true, true, address(election));
            emit IElectionBallot.BallotCast(
                voter,
                expectedHash,
                uint32(i), // sequence must be i
                uint64(block.timestamp),
                payload
            );

            vm.prank(voter);
            election.castBallot(payload);
        }

        require(election.ballotCount() == 50, "ballotCount should be 50");
    }

    // =========================================================================
    // isVotingOpen view function
    // =========================================================================

    function test_IsVotingOpenTrueInsideWindow() public view {
        // setUp warped to START + 1, which is inside the window.
        require(election.isVotingOpen(), "should be open inside window");
    }

    function test_IsVotingOpenFalseBeforeStart() public {
        vm.warp(START - 1);
        require(!election.isVotingOpen(), "should be closed before start");
    }

    function test_IsVotingOpenFalseAtEnd() public {
        vm.warp(END);
        require(!election.isVotingOpen(), "should be closed at end");
    }

    function test_IsVotingOpenFalseWhenPaused() public {
        vm.prank(ADMIN);
        election.pause();
        require(!election.isVotingOpen(), "should be closed when paused");
    }

    // =========================================================================
    // ballotOf for a non-voter returns zeros
    // =========================================================================

    function test_BallotOfNonVoterReturnsZeros() public view {
        (bytes32 hash, uint64 castAt) = election.ballotOf(STRANGER);
        require(hash == bytes32(0), "hash should be zero");
        require(castAt == 0, "castAt should be zero");
    }

    // =========================================================================
    // Gas snapshot: 200 byte ballot
    // =========================================================================

    function test_GasSnapshot_200ByteBallot() public {
        _forceRegister(VOTER);

        bytes memory payload = _payload(200);

        vm.prank(VOTER);
        election.castBallot(payload);
    }
}

// =============================================================================
// Invariant test: ballotCount always equals the number of distinct addresses
// that have successfully voted.
// =============================================================================

/// @title BallotInvariantHandler
/// @notice A handler that Foundry's invariant fuzzer calls with random actions.
///         It tracks which addresses have voted so the invariant can compare.
contract BallotInvariantHandler is Test {
    Election internal election;
    address internal admin;

    /// @dev Tracks addresses that have successfully cast a ballot.
    address[] public voters;
    mapping(address => bool) public hasVoted;

    /// @dev Pool of pre-registered addresses for the fuzzer to pick from.
    address[] internal _pool;

    uint256 internal constant REGISTERED_SLOT = 3;

    constructor(Election election_, address admin_) {
        election = election_;
        admin = admin_;

        // Create a pool of 20 registered voters.
        for (uint256 i = 1; i <= 20; i++) {
            address v = address(uint160(0x5000 + i));
            _pool.push(v);
            // Register them directly in storage.
            bytes32 slot = keccak256(abi.encode(v, REGISTERED_SLOT));
            vm.store(address(election), slot, bytes32(uint256(1)));
        }
    }

    /// @dev The fuzzer calls this to cast a ballot from a random pool member.
    function castBallot(uint256 voterIndex, uint256 payloadLen) external {
        voterIndex = bound(voterIndex, 0, _pool.length - 1);
        payloadLen = bound(payloadLen, 1, 512);

        address voter = _pool[voterIndex];

        bytes memory payload = new bytes(payloadLen);
        for (uint256 i = 0; i < payloadLen; i++) {
            payload[i] = bytes1(uint8(i % 256));
        }

        vm.prank(voter);
        try election.castBallot(payload) {
            if (!hasVoted[voter]) {
                hasVoted[voter] = true;
                voters.push(voter);
            }
        } catch {
            // Expected: AlreadyVoted, etc. The invariant still holds.
        }
    }

    /// @dev Pause or unpause randomly.
    function togglePause(bool doPause) external {
        vm.prank(admin);
        if (doPause && !election.paused()) {
            election.pause();
        } else if (!doPause && election.paused()) {
            election.unpause();
        }
    }

    function voterCount() external view returns (uint256) {
        return voters.length;
    }
}

/// @title BallotInvariantTest
/// @notice Asserts that ballotCount always equals the number of distinct
///         addresses that have successfully voted.
contract BallotInvariantTest is Test {
    Election internal election;
    BallotInvariantHandler internal handler;

    address internal constant ADMIN = address(0xA11CE);

    uint64 internal constant START = 1_800_000_000;
    uint64 internal constant END = 1_800_086_400;

    bytes internal constant PUBLIC_KEY =
        hex"8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f";

    function setUp() public {
        election = new Election("Invariant Test", START, END, PUBLIC_KEY, ADMIN);
        vm.warp(START + 1);

        handler = new BallotInvariantHandler(election, ADMIN);

        // Tell Foundry to only call functions on the handler.
        targetContract(address(handler));
    }

    /// @notice ballotCount must always equal the number of distinct voters.
    function invariant_ballotCountEqualsDistinctVoters() public view {
        uint256 actual = election.ballotCount();
        uint256 expected = handler.voterCount();
        require(actual == expected, "ballotCount != distinct voter count");
    }
}
