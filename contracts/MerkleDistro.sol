// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleProof.sol";

contract MerkleDistro is Ownable {
  using SafeERC20 for ERC20;

  ERC20 public immutable token;
  bytes32 public merkleRoot;
  mapping(address => uint256) private claimed;

  constructor(
    ERC20 _token,
    bytes32 _merkleRoot,
    address owner
  ) {
    token = _token;
    merkleRoot = _merkleRoot;
    transferOwnership(owner);
  }

  function claim(uint256 amount, Permit calldata permit) external {
    enforceAccess(permit);
    enforceCredit(permit, amount);

    claimed[msg.sender] += amount;
    token.safeTransfer(msg.sender, amount);

    emit Claimed(msg.sender, amount);
  }

  function enforceAccess(Permit calldata permit) internal view {
    bytes32[] calldata proof = permit.merkleProof;
    bytes32 root = merkleRoot;
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender, permit.granted));

    require(MerkleProof.verify(proof, root, leaf), "Invalid MerkleProof");
  }

  function enforceCredit(Permit calldata permit, uint256 amount) internal view {
    require(claimed[msg.sender] + amount <= permit.granted, "No Credit For Claim");
  }

  function setMerkleRoot(bytes32 nextMerkleRoot) external onlyOwner {
    merkleRoot = nextMerkleRoot;
  }

  struct Permit {
    bytes32[] merkleProof;
    uint256 granted;
  }
  event Claimed(address indexed claimer, uint256 amount);
}
