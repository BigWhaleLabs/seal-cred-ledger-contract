//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StreetCred is Ownable {
  mapping(address => OwnedNFT[]) public ledger;

  struct OwnedNFT {
    address userAddress;
    address contractAddress;
    uint256[] ownedItemIds;
  }

  function addItems(OwnedNFT[] memory _items) public onlyOwner returns (bool success) {
    for (uint256 i = 0; i < _items.length; i++) {
      ledger[_items[i].userAddress].push(
        OwnedNFT(_items[i].userAddress, _items[i].contractAddress, _items[i].ownedItemIds)
      );
    }

    return true;
  }

  function getItem(address _user) public view returns (OwnedNFT[] memory) {
    return ledger[_user];
  }

  function deleteItems(address[] memory _users) public onlyOwner returns (bool success) {
    for (uint256 i = 0; i < _users.length; i++) {
      delete ledger[_users[i]];
    }

    return true;
  }
}
