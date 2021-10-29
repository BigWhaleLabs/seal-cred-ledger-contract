//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StreetCred is Ownable {
  mapping(address => OwnedNFT[]) private ledger;

  struct Items {
    address userAddress;
    OwnedNFT[] ownedNFT;
  }

  struct OwnedNFT {
    address userAddress;
    address contractAddress;
    uint256[] ownedItemIds;
  }

  function addItem(OwnedNFT[] memory _items) public  onlyOwner returns(bool success) {
    for(uint256 i = 0; i < _items.length; i++) {
      ledger[_items[i].userAddress].push(OwnedNFT(_items[i].userAddress, _items[i].contractAddress, _items[i].ownedItemIds));
    }

    return true;
  }

  function deleteItem(address[] memory _users) public onlyOwner returns(bool success) {
    for(uint256 i = 0; i < _users.length; i++) {
      delete ledger[_users[i]];
    }

    return true;
  }
}
