// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISCERC721Derivative {
  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) external returns (bool r);
}
