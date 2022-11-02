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

  function claim(
    uint256 amount,
    bytes32[] calldata merkleProof,
    uint256 granted
  ) external {
    enforceAccess(merkleProof, granted);
    enforceCredit(amount, granted);

    claimed[msg.sender] += amount;
    token.safeTransfer(msg.sender, amount);

    emit Claimed(msg.sender, amount);
  }

  function enforceAccess(bytes32[] calldata proof, uint256 granted) internal view {
    bytes32 root = merkleRoot;
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender, granted));

    require(MerkleProof.verify(proof, root, leaf), "Invalid MerkleProof");
  }

  function enforceCredit(uint256 amount, uint256 granted) internal view {
    require(claimed[msg.sender] + amount <= granted, "No Credit For Claim");
  }

  function setMerkleRoot(bytes32 nextMerkleRoot) external onlyOwner {
    merkleRoot = nextMerkleRoot;
  }

  event Claimed(address indexed claimer, uint256 amount);
}
