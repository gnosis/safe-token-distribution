const abi = [
  "constructor(address _token, bytes32 _merkleRoot, address owner)",
  "event Claimed(address indexed claimer, uint256 amount)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "function claim(bytes32[] merkleProof, uint256 amountAllocated)",
  "function claimed(address) view returns (uint256)",
  "function merkleRoot() view returns (bytes32)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function setMerkleRoot(bytes32 nextMerkleRoot)",
  "function token() view returns (address)",
  "function transferOwnership(address newOwner)",
];

const contract = {
  //address: process.env.REACT_APP_MERKLE_DISTRO_ADDRESS as string,
  address: "0x9438e9724c61A92b460a1Bf52854CeF4Ef6c0690",
  abi,
};

export default contract;
