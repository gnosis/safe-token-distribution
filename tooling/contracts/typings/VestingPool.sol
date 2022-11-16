// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

abstract contract VestingPool {
  address public token;

  function claimVestedTokens(
    bytes32 vestingId,
    address beneficiary,
    uint128 tokensToClaim
  ) public virtual;

  function calculateVestedAmount(
    bytes32 vestingId
  ) external view virtual returns (uint128 vestedAmount, uint128 claimedAmount);
}
