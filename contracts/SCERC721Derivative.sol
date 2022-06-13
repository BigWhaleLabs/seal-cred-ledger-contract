// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SealCredLedger.sol";
import "./IVerifier.sol";

contract SCERC721Derivative is ERC721, Ownable {
  using Counters for Counters.Counter;

  // State
  address public immutable sealCredContract;
  address public immutable originalContract;
  uint256 public immutable attestorPublicKey;
  address public verifierContract;
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
    _mint(msg.sender, a, b, c, input);
  }

  function mintWithSender(
    address sender,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) external onlyOwner {
    _mint(sender, a, b, c, input);
  }

  function _mint(
    address sender,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) internal {
    // Check if zkp is fresh
    uint256 nullifier = input[0];
    require(
      nullifiers[nullifier] != true,
      "This ZK proof has already been used"
    );
    // Check if attestor is correct
    uint256 passedAttestorPublicKey = input[43];
    require(
      passedAttestorPublicKey == attestorPublicKey,
      "This ZK proof is not from the correct attestor"
    );
    // Check if tokenAddress is correct
    bytes memory originalContractBytes = bytes(
      Strings.toHexString(uint256(uint160(originalContract)), 20)
    );
    for (uint8 i = 0; i < 42; i++) {
      require(
        uint8(input[i + 1]) == uint8(originalContractBytes[i]),
        "This ZK proof is not from the correct token contract"
      );
    }
    // Check if zkp is valid
    require(
      IVerifier(verifierContract).verifyProof(a, b, c, input),
      "Invalid ZK proof"
    );
    // Mint
    uint256 _tokenId = currentTokenId.current();
    _safeMint(sender, _tokenId);
    currentTokenId.increment();
    // Save nullifier
    nullifiers[nullifier] = true;
  }

  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal override(ERC721) {
    require(_from == address(0), "This token is soulbound");
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
