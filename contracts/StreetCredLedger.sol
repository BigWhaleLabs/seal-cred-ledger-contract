// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./SCERC721Derivative.sol";
import "./Verifier.sol";

/**
 * @title Street Cred Ledger
 * @dev Holds the Merkle roots for the registered ERC-721 tokens
 */
contract StreetCredLedger is Ownable {
  // State
  mapping(address => bytes32) private ledger;
  mapping(address => address) private tokenToDerivative;
  Verifier private verifier;
  // Events
  event SetMerkleRoot(address tokenAddress, bytes32 merkleRoot);

  constructor() {
    verifier = new Verifier();
  }

  function addRoot(address tokenAddress, bytes32 merkleRoot)
    external
    onlyOwner
  {
    IERC721Metadata metadata = IERC721Metadata(tokenAddress);
    SCERC721Derivative derivative = new SCERC721Derivative(
      tokenAddress,
      address(this),
      string(bytes.concat(bytes(metadata.name()), bytes("( derivative)"))),
      string(bytes.concat(bytes(metadata.symbol()), bytes("-d"))),
      address(verifier)
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
    require(
      ledger[tokenAddress] != 0,
      "No existing derivative. addRoot should be called first"
    );
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
   * @dev Returns the drivative of a given ERC-721 token
   */
  function getDerivativeAddress(address tokenAddress)
    external
    view
    returns (address)
  {
    return tokenToDerivative[tokenAddress];
  }

  /**
   * @dev Deletes the Merkle root and derivative for a given ERC-721 token
   */
  function deleteRoot(address tokenAddress) external onlyOwner {
    delete ledger[tokenAddress];
    delete tokenToDerivative[tokenAddress];
  }
}
