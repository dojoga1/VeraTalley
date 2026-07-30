// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {IElectionBallot} from "./interfaces/IElectionBallot.sol";
import {IElectionMetadata} from "./interfaces/IElectionMetadata.sol";
import {IVoterRegistry} from "./interfaces/IVoterRegistry.sol";

/// @title Election
/// @notice One election: its voter roll, its voting window, and its ballot log.
///
/// @dev SKELETON. The constructor, the metadata getters and the pause controls
///      are finished. The registry and the ballot functions are deliberately
///      left reverting, and they are the Week 1 work:
///
///        VT-101, Tirthesh, the voter registry section
///        VT-102, Rahul, the ballot casting section
///
///      Replace `revert NotImplemented()` with the real implementation. Do not
///      change any function signature: they come from the frozen interfaces in
///      `src/interfaces/`, and three other teams are already building against
///      them.
contract Election is IElectionBallot, IVoterRegistry, IElectionMetadata, Ownable, Pausable {
    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /// @inheritdoc IVoterRegistry
    uint32 public constant override MAX_BATCH = 250;

    /// @notice Largest accepted ciphertext, in bytes.
    /// @dev A sealed three contest ballot is around 200 bytes. 4096 leaves room
    ///      for much longer ballots while keeping a single vote affordable.
    uint256 public constant MAX_PAYLOAD_BYTES = 4096;

    // -----------------------------------------------------------------------
    // Metadata, set once at construction
    // -----------------------------------------------------------------------

    /// @inheritdoc IElectionMetadata
    string public override name;

    /// @inheritdoc IElectionMetadata
    uint64 public immutable override startTime;

    /// @inheritdoc IElectionMetadata
    uint64 public immutable override endTime;

    /// @inheritdoc IElectionMetadata
    bytes public override electionPublicKey;

    // -----------------------------------------------------------------------
    // State
    //
    // Left here as the agreed shape so VT-101 and VT-102 do not have to invent
    // it independently and then disagree.
    // -----------------------------------------------------------------------

    /// @dev Wallet => on the voter roll. Private: use `isRegistered`.
    mapping(address voter => bool registered) private _registered;

    /// @dev Wallet => has cast a ballot. Private: use `ballotOf`.
    mapping(address voter => bool voted) private _hasVoted;

    /// @dev Wallet => keccak256 of their ciphertext.
    mapping(address voter => bytes32 ballotHash) private _ballotHash;

    /// @dev Wallet => when they voted, unix seconds.
    mapping(address voter => uint64 castAt) private _castAt;

    /// @dev Size of the voter roll.
    uint32 private _registeredCount;

    /// @dev Ballots accepted so far, and the source of the sequence number.
    uint32 private _ballotCount;

    // -----------------------------------------------------------------------
    // Errors
    // -----------------------------------------------------------------------

    /// @notice Placeholder while this function is unimplemented.
    /// @dev Delete this error once VT-101 and VT-102 are both merged.
    error NotImplemented();

    /// @notice The voting window was created back to front.
    error InvalidWindow();

    /// @notice An election was created with an empty public key.
    error MissingPublicKey();

    // -----------------------------------------------------------------------
    // Construction
    // -----------------------------------------------------------------------

    /// @notice Create an election. Called by the factory, not directly.
    /// @param name_              Human readable name.
    /// @param startTime_         Voting opens, inclusive, unix seconds.
    /// @param endTime_           Voting closes, exclusive, unix seconds.
    /// @param electionPublicKey_ X25519 public key ballots are sealed to.
    /// @param administrator      Wallet that owns this election. The factory
    ///                           passes its own owner through, so every election
    ///                           it creates has the same administrator.
    constructor(
        string memory name_,
        uint64 startTime_,
        uint64 endTime_,
        bytes memory electionPublicKey_,
        address administrator
    ) Ownable(administrator) {
        if (endTime_ <= startTime_) revert InvalidWindow();
        if (electionPublicKey_.length == 0) revert MissingPublicKey();

        name = name_;
        startTime = startTime_;
        endTime = endTime_;
        electionPublicKey = electionPublicKey_;
    }

    // -----------------------------------------------------------------------
    // Administration. Finished, no issue owns these.
    // -----------------------------------------------------------------------

    /// @notice Stop accepting ballots. Administrator only, emergency use.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resume accepting ballots. Administrator only.
    function unpause() external onlyOwner {
        _unpause();
    }

    // -----------------------------------------------------------------------
    // VT-101, Tirthesh: the voter registry
    // -----------------------------------------------------------------------

    /// @inheritdoc IVoterRegistry
    function registerVoters(address[] calldata voters) external override onlyOwner {
        // VT-101. Revert BatchTooLarge above MAX_BATCH. Revert RegistrationClosed
        // once voting has opened. Skip addresses already on the roll rather than
        // reverting. Emit VotersRegistered with the whole batch.
        voters; // silence the unused parameter warning; delete this line
        revert NotImplemented();
    }

    /// @inheritdoc IVoterRegistry
    function revokeVoter(address voter) external override onlyOwner {
        // VT-101. Must not touch _hasVoted, _ballotHash or _castAt: a cast
        // ballot stays cast. Emit VoterRevoked.
        voter;
        revert NotImplemented();
    }

    /// @inheritdoc IVoterRegistry
    function isRegistered(address voter) external view override returns (bool) {
        // VT-101.
        voter;
        revert NotImplemented();
    }

    /// @inheritdoc IVoterRegistry
    function registeredCount() external view override returns (uint32) {
        // VT-101.
        revert NotImplemented();
    }

    // -----------------------------------------------------------------------
    // VT-102, Rahul: casting a ballot
    // -----------------------------------------------------------------------

    /// @inheritdoc IElectionBallot
    function castBallot(bytes calldata ciphertext) external override whenNotPaused {
        // Checks, in this order so the frontend gets predictable errors.

        // 1. Must be on the voter roll.
        if (!_registered[msg.sender]) revert NotRegistered();

        // 2. One wallet, one ballot.
        if (_hasVoted[msg.sender]) revert AlreadyVoted();

        // 3. Voting window: includes startTime, excludes endTime.
        //    i.e. the window is [startTime, endTime).
        if (block.timestamp < startTime || block.timestamp >= endTime) revert VotingClosed();

        // 4. Must not be empty.
        if (ciphertext.length == 0) revert EmptyPayload();

        // 5. Must not exceed the maximum payload size.
        if (ciphertext.length > MAX_PAYLOAD_BYTES) revert PayloadTooLarge();

        // Effects: mark voted, store the hash and timestamp, bump the counter.
        _hasVoted[msg.sender] = true;
        bytes32 hash = keccak256(ciphertext);
        _ballotHash[msg.sender] = hash;
        _castAt[msg.sender] = uint64(block.timestamp);
        ++_ballotCount;
        uint32 sequence = _ballotCount; // first ballot is 1, not 0

        // Event: the ballot log entry.
        emit BallotCast(msg.sender, hash, sequence, uint64(block.timestamp), ciphertext);
    }

    /// @inheritdoc IElectionBallot
    function ballotOf(address voter) external view override returns (bytes32, uint64) {
        return (_ballotHash[voter], _castAt[voter]);
    }

    /// @inheritdoc IElectionBallot
    function ballotCount() external view override returns (uint32) {
        return _ballotCount;
    }

    /// @inheritdoc IElectionBallot
    function isVotingOpen() external view override returns (bool) {
        // True when now is within [startTime, endTime) and not paused.
        return block.timestamp >= startTime && block.timestamp < endTime && !paused();
    }
}
