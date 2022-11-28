// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

abstract contract OmniMediator {
  function relayTokens(
    address token,
    address _receiver,
    uint256 _value
  ) external virtual;

  function isTokenRegistered(address _token) public view virtual returns (bool);

  function bridgedTokenAddress(
    address _nativeToken
  ) public view virtual returns (address);

  function nativeTokenAddress(
    address _bridgedToken
  ) public view virtual returns (address);
}
