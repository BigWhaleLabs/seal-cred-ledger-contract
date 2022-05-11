// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./SCERC721Derivative.sol";
import "./Verifier.sol";

/**
 * @title SealCred Ledger
 * @dev Holds the Merkle roots for the registered ERC-721 tokens
 */
contract SealCredLedger is Ownable {
  // State
  mapping(address => bytes32) private ledger;
  mapping(address => address) private tokenToDerivative;

  Verifier private verifier;

  // Events
  event SetMerkleRoot(address tokenAddress, bytes32 merkleRoot);
  event DeleteMerkleRoot(address tokenAddress);
  event CreateDerivative(
    address derivativeAddress,
    address sealCredMapAddress,
    address sealCredContractAddress,
    string tokenName,
    string tokenSymbol,
    address verifier
  );

  // Structs
  struct Root {
    address tokenAddress;
    bytes32 merkleRoot;
  }

  constructor() {
    verifier = new Verifier();
  }

  function addRoots(Root[] memory roots) external onlyOwner {
    for (uint256 i = 0; i < roots.length; i++) {
      Root memory _currentRoot = roots[i];

      if (ledger[_currentRoot.tokenAddress] != 0) {
        continue;
      }
      IERC721Metadata metadata = IERC721Metadata(_currentRoot.tokenAddress);
      SCERC721Derivative derivative = new SCERC721Derivative(
        _currentRoot.tokenAddress,
        address(this),
        string(bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))),
        string(bytes.concat(bytes(metadata.symbol()), bytes("-d"))),
        address(verifier)
      );

      ledger[_currentRoot.tokenAddress] = _currentRoot.merkleRoot;
      tokenToDerivative[_currentRoot.tokenAddress] = address(derivative);
      emit SetMerkleRoot(_currentRoot.tokenAddress, _currentRoot.merkleRoot);
      emit CreateDerivative(
        address(derivative),
        _currentRoot.tokenAddress,
        address(this),
        string(bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))),
        string(bytes.concat(bytes(metadata.symbol()), bytes("-d"))),
        address(verifier)
      );
    }
  }

  /**
   * @dev Sets the Merkle roots for given ERC-721 tokens
   */
  function setRoots(Root[] memory roots) external onlyOwner {
    for (uint256 i = 0; i < roots.length; i++) {
      Root memory _currentRoot = roots[i];

      if (ledger[_currentRoot.tokenAddress] != 0) {
        ledger[_currentRoot.tokenAddress] = _currentRoot.merkleRoot;
        emit SetMerkleRoot(_currentRoot.tokenAddress, _currentRoot.merkleRoot);
      }
    }
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
    emit DeleteMerkleRoot(tokenAddress);
  }
}
