// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import {Test} from "forge-std/Test.sol";
import {ElectionFactory} from "../src/ElectionFactory.sol";
import {Election} from "../src/Election.sol";
import {IElectionFactory} from "../src/interfaces/IElectionFactory.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ElectionFactoryTest is Test {
    address internal constant ADMIN = address(0xA11CE);
    address internal constant STRANGER = address(0xBEEF);
    bytes internal constant PUBKEY = hex"8b1d4ac9f0e2571b3d6a84c5e0f9b27d1a4c6e8f0b2d5a7c9e1f3b6d8a0c2e4f";

    ElectionFactory internal factory;

    function setUp() public {
        factory = new ElectionFactory(ADMIN);
    }

    function test_OwnerCanCreateElection() public {
        vm.prank(ADMIN);
        address addr = factory.createElection("Test Election", 100, 200, PUBKEY);
        
        assertTrue(addr != address(0));
        
        Election election = Election(addr);
        assertEq(election.name(), "Test Election");
        assertEq(election.startTime(), 100);
        assertEq(election.endTime(), 200);
        assertEq(election.electionPublicKey(), PUBKEY);
        assertEq(election.owner(), ADMIN);
    }

    function test_NonOwnerReverts() public {
        vm.prank(STRANGER);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, STRANGER));
        factory.createElection("Test Election", 100, 200, PUBKEY);
    }

    function test_InvalidWindowReverts() public {
        vm.prank(ADMIN);
        vm.expectRevert(IElectionFactory.InvalidWindow.selector);
        factory.createElection("Test Election", 200, 100, PUBKEY);
        
        vm.prank(ADMIN);
        vm.expectRevert(IElectionFactory.InvalidWindow.selector);
        factory.createElection("Test Election", 200, 200, PUBKEY);
    }

    function test_MultipleElectionsOrderAndCount() public {
        vm.startPrank(ADMIN);
        address addr1 = factory.createElection("Election 1", 100, 200, PUBKEY);
        address addr2 = factory.createElection("Election 2", 200, 300, PUBKEY);
        address addr3 = factory.createElection("Election 3", 300, 400, PUBKEY);
        vm.stopPrank();

        assertEq(factory.electionCount(), 3);
        
        address[] memory elections = factory.getElections();
        assertEq(elections.length, 3);
        assertEq(elections[0], addr1);
        assertEq(elections[1], addr2);
        assertEq(elections[2], addr3);
    }

    function test_ElectionCreatedEvent() public {
        // Calculate what the deployed address will be for event checking
        // Factory nonce is 1 because constructor doesn't deploy anything
        address expectedAddr = vm.computeCreateAddress(address(factory), 1);
        
        vm.expectEmit(true, false, false, true, address(factory));
        emit IElectionFactory.ElectionCreated(expectedAddr, "Event Test", 500, 600);
        
        vm.prank(ADMIN);
        address addr = factory.createElection("Event Test", 500, 600, PUBKEY);
        
        assertEq(addr, expectedAddr);
    }
}
