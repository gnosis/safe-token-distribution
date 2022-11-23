// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

abstract contract OmniMediator {
  function relayTokens(
    address token,
    address _receiver,
    uint256 _value
  ) external virtual;

  // function relayTokens(address token, uint256 _value) external virtual;
}
