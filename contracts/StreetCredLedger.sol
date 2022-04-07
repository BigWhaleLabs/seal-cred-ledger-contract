//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StreetCredLedger is Ownable {
  mapping(address => bytes32) public ledger;
  address[] public availableContracts;

  function addRoot(address _addr, bytes32 _root) external onlyOwner {
    ledger[_addr] = _root;
    availableContracts.push(_addr);
  }

  function getRoot(address _addr) external view returns (bytes32) {
    return ledger[_addr];
  }

  function deleteRoot(address _addr) external onlyOwner {
    delete ledger[_addr];
  }
}
