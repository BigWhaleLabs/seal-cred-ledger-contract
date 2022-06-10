// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./SCERC721Derivative.sol";
import "./ISCERC721Derivative.sol";

/**
 * @title SealCred Ledger
 * @dev Holds the Merkle roots for the registered ERC-721 tokens
 */
contract SealCredLedger is Ownable {
  // State
  mapping(address => address) public tokenToDerivative;

  address public verifier;
  string public pubkey;

  // Events
  event SetMerkleRoot(address tokenAddress, bytes32 merkleRoot);
  event DeleteDerivative(address tokenAddress);
  event CreateDerivative(
    address derivativeAddress,
    address sealCredMapAddress,
    address sealCredContractAddress,
    string tokenName,
    string tokenSymbol,
    address verifier
  );

  constructor(address _verifier, string memory _pubkey) {
    verifier = _verifier;
    pubkey = _pubkey;
  }

  function addToken(
    address tokenAddress,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) external {
    // derivative exists
    if (tokenToDerivative[tokenAddress] != address(0)) {
      ISCERC721Derivative(tokenToDerivative[tokenAddress]).mint(
        a,
        b,
        c,
        input,
        tokenAddress,
        pubkey
      );
      return;
    }

    // derivative doesn't exist
    IERC721Metadata metadata = IERC721Metadata(tokenAddress);
    SCERC721Derivative derivative = new SCERC721Derivative(
      tokenAddress,
      address(this),
      string(bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))),
      string(bytes.concat(bytes(metadata.symbol()), bytes("-d"))),
      verifier
    );
    tokenToDerivative[tokenAddress] = address(derivative);

    emit CreateDerivative(
      address(derivative),
      tokenAddress,
      address(this),
      string(bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))),
      string(bytes.concat(bytes(metadata.symbol()), bytes("-d"))),
      verifier
    );

    ISCERC721Derivative(address(derivative)).mint(
      a,
      b,
      c,
      input,
      tokenAddress,
      pubkey
    );
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
  function deleteDerivativeAddress(address tokenAddress) external onlyOwner {
    delete tokenToDerivative[tokenAddress];
    emit DeleteDerivative(tokenAddress);
  }

  function setVerifierAddress(address _verifier) external onlyOwner {
    verifier = _verifier;
  }
}
