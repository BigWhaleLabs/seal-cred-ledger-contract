// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SealCredLedger.sol";
import "./IVerifier.sol";

contract SCERC721Derivative is ERC721, Ownable {
  using Counters for Counters.Counter;

  // State
  address public sealCredContract;
  address public immutable originalContract;
  address public verifierContract;
  uint256 public attestorPublicKey;
  mapping(uint256 => bool) public nullifiers;
  Counters.Counter public currentTokenId;

  constructor(
    address _sealCredContract,
    address _originalContract,
    address _verifierContract,
    uint256 _attestorPublicKey,
    string memory tokenName,
    string memory tokenSymbol
  ) ERC721(tokenName, tokenSymbol) {
    sealCredContract = _sealCredContract;
    originalContract = _originalContract;
    verifierContract = _verifierContract;
    attestorPublicKey = _attestorPublicKey;
  }

  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) external {
    // Check if zkp is fresh
    uint256 nullifier = input[0];
    if (nullifiers[nullifier] == true) {
      revert("This ZK proof has already been used");
    }
    // Check if attestor is the correct one
    uint256 passedAttestorPublicKey = input[43];
    if (passedAttestorPublicKey != attestorPublicKey) {
      revert("This ZK proof is not from the correct attestor");
    }
    // TODO: Check if input.tokenAddress === originalContract
    // Check if zkp is valid
    require(
      IVerifier(verifierContract).verifyProof(a, b, c, input),
      "Invalid ZK proof"
    );
    // Mint
    uint256 _tokenId = currentTokenId.current();
    _safeMint(msg.sender, _tokenId); // TODO: check if msg.sender is the address who called SealCredLedger.mint, and not SealCredLedger contract
    currentTokenId.increment();
    // Save nullifier
    nullifiers[nullifier] = true;
  }

  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal override(ERC721) {
    super._beforeTokenTransfer(_from, _to, _tokenId);
  }

  function supportsInterface(bytes4 _interfaceId)
    public
    view
    override(ERC721)
    returns (bool)
  {
    return super.supportsInterface(_interfaceId);
  }

  function setVerifierContract(address _verifierContract) external onlyOwner {
    verifierContract = _verifierContract;
  }
}
