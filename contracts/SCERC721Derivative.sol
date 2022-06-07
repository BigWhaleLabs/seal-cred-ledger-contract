// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SealCredLedger.sol";
import "./IVerifier.sol";

contract SCERC721Derivative is ERC721, Ownable {
  using Counters for Counters.Counter;

  Counters.Counter public tokenId;
  SealCredLedger public sealCred;
  address public immutable sealCredMapAddress;
  address public verifier;

  constructor(
    address _sealCredMapAddress,
    address _sealCredContractAddress,
    string memory tokenName,
    string memory tokenSymbol,
    address _verifier
  ) ERC721(tokenName, tokenSymbol) {
    sealCred = SealCredLedger(_sealCredContractAddress);
    sealCredMapAddress = _sealCredMapAddress;
    verifier = _verifier;
  }

  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[2] memory input
  ) external {
    require(
      bytes32(input[1]) == sealCred.getRoot(sealCredMapAddress),
      "Merkle Root does not match the contract"
    );
    require(IVerifier(verifier).verifyProof(a, b, c, input), "Invalid Proof");
    uint256 _tokenId = tokenId.current();
    _safeMint(msg.sender, _tokenId);
    tokenId.increment();
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

  function setVerifierAddress(address _verifier) external onlyOwner {
    verifier = _verifier;
  }
}
