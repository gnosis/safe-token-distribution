// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract SafeToken is ERC20, Ownable {
  function unpause() public virtual;

  function paused() public view virtual returns (bool);
}
