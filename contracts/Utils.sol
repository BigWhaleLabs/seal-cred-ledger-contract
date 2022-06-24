// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;
import "@openzeppelin/contracts/utils/Strings.sol";

library Utils {
  function cut0x(string memory str) internal pure returns (string memory) {
    uint8 startIndex = 2;
    uint8 endIndex = 4;
    bytes memory strBytes = bytes(str);
    bytes memory result = new bytes(2);
    for (uint8 i = startIndex; i < endIndex; i++) {
      result[i - startIndex] = strBytes[i];
    }
    return string(result);
  }
}
