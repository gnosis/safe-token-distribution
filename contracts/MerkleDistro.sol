// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./MerkleProof.sol";

contract MerkleDistro is Ownable {
  event Claimed(address indexed claimer, uint256 amount);

  address public immutable token;
  bytes32 public merkleRoot;
  mapping(address => uint256) public claimed;

  constructor(address _token, bytes32 _merkleRoot, address owner) {
    token = _token;
    merkleRoot = _merkleRoot;
    transferOwnership(owner);
  }

  function claim(bytes32[] calldata merkleProof, uint256 allocated) external {
    verify(merkleProof, allocated);

    address beneficiary = msg.sender;
    uint256 amount = calculate(beneficiary, allocated);

    claimed[beneficiary] += amount;
    require(
      IERC20(token).transfer(beneficiary, amount),
      "Token Transfer Failed"
    );

    emit Claimed(beneficiary, amount);
  }

  function verify(bytes32[] calldata proof, uint256 allocated) internal view {
    bytes32 root = merkleRoot;
    // use leaf double hashing https://flawed.net.nz/2018/02/21/attacking-merkle-trees-with-a-second-preimage-attack/
    bytes32 leaf = keccak256(
      bytes.concat(keccak256(abi.encode(msg.sender, allocated)))
    );

    require(MerkleProof.verify(proof, root, leaf), "Invalid Allocation Proof");
  }

  function calculate(
    address beneficiary,
    uint256 amountAllocated
  ) internal view returns (uint256 amountToClaim) {
    uint256 amountClaimed = claimed[beneficiary];
    assert(amountClaimed <= amountAllocated);
    amountToClaim = amountAllocated - amountClaimed;
  }

  function setMerkleRoot(bytes32 nextMerkleRoot) external onlyOwner {
    merkleRoot = nextMerkleRoot;
  }
}
