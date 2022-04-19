// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SCERC721Derivative.sol";
import "./Verifier.sol";

/**
 * @title Street Cred Ledger
 * @dev Holds the Merkle roots for the registered ERC-721 tokens
 */
contract StreetCredLedger is Ownable {
  // State
  mapping(address => bytes32) public ledger;
  mapping(address => address) public tokenToDerivative;
  Verifier public verifier;
  // Events
  event SetMerkleRoot(address tokenAddress, bytes32 merkleRoot);

  constructor() {
    verifier = new Verifier();
  }

  function addRoot(
    address tokenAddress,
    bytes32 merkleRoot,
    string memory tokenName,
    string memory tokenSymbol
  ) external onlyOwner {
    SCERC721Derivative derivative = new SCERC721Derivative(
      tokenAddress,
      address(this),
      tokenName,
      tokenSymbol
    );
    ledger[tokenAddress] = merkleRoot;
    tokenToDerivative[tokenAddress] = address(derivative);
    emit SetMerkleRoot(tokenAddress, merkleRoot);
  }

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
