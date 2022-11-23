// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
  constructor(uint256 initialSupply) ERC20("ERC20Mock", "MCK") {}

  function mint(address account, uint256 initialSupply) external {
    _mint(account, initialSupply);
  }
}
