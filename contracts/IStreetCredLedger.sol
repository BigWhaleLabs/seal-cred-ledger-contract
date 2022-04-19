// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IStreetCredLedger {
  function getRoot(address) external view returns (bytes32);
}
