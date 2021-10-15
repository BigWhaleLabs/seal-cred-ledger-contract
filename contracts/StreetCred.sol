//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StreetCred is Ownable {
  mapping(address => mapping(address => uint256[])) private ledger;

  function addItem(
    address _userAddress,
    address _contractAddress,
    uint256 _tokenId
  ) public onlyOwner {
    ERC721 token = ERC721(_contractAddress);
    require(token.ownerOf(_tokenId) == msg.sender, "Caller must own given token");
    require(token.isApprovedForAll(_userAddress, address(this)), "This contract must be approved");

    ledger[_userAddress][_contractAddress].push(_tokenId);
  }
}
