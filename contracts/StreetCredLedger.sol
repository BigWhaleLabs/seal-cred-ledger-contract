// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Street Cred Ledger
 * @dev Holds the Merkle roots for the registered ERC-721 tokens
 */
contract StreetCredLedger is Ownable {
  // State
  mapping(address => bytes32) public ledger;
  // Events
  event SetMerkleRoot(address tokenAddress, bytes32 merkleRoot);

  /**
   * @dev Sets the Merkle root for a given ERC-721 token
   */
  function setRoot(address tokenAddress, bytes32 merkleRoot)
    external
    onlyOwner
  {
    ledger[tokenAddress] = merkleRoot;
    emit SetMerkleRoot(tokenAddress, merkleRoot);
  }

  /**
   * @dev Returns the Merkle root for a given ERC-721 token
   */
  function getRoot(address tokenAddress) external view returns (bytes32) {
    return ledger[tokenAddress];
  }

  /**
   * @dev Deletes the Merkle root for a given ERC-721 token
   */
  function deleteRoot(address tokenAddress) external onlyOwner {
    delete ledger[tokenAddress];
  }
}
