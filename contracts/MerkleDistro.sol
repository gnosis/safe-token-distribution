// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MerkleProof.sol";

contract MerkleDistro is Ownable {
  using SafeERC20 for ERC20;

  event Claimed(address indexed claimer, uint256 amount);

  ERC20 public immutable token;
  bytes32 public merkleRoot;
  mapping(address => uint256) public claimed;

  constructor(
    ERC20 _token,
    bytes32 _merkleRoot,
    address owner
  ) {
    token = _token;
    merkleRoot = _merkleRoot;
    transferOwnership(owner);
  }

  function claim(bytes32[] calldata merkleProof, uint256 allocated) external {
    verify(merkleProof, allocated);

    uint256 amount = calculate(allocated);

    token.safeTransfer(msg.sender, amount);
    claimed[msg.sender] += amount;

    emit Claimed(msg.sender, amount);
  }

  function verify(bytes32[] calldata proof, uint256 allocated) internal view {
    bytes32 root = merkleRoot;
    // use leaf double hashing https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack/
    bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, allocated))));

    require(MerkleProof.verify(proof, root, leaf), "Invalid Allocation Proof");
  }

  function calculate(uint256 amountAllocated) internal view returns (uint256 amountToClaim) {
    uint256 amountClaimed = claimed[msg.sender];
    assert(amountClaimed <= amountAllocated);
    amountToClaim = amountAllocated - amountClaimed;
  }

  function setMerkleRoot(bytes32 nextMerkleRoot) external onlyOwner {
    merkleRoot = nextMerkleRoot;
  }
}
