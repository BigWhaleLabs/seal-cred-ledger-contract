// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./StreetCredLedger.sol";
import "./Verifier.sol";

contract SCERC721Derivative is ERC721, Ownable {
  using Counters for Counters.Counter;

  Counters.Counter public tokenId;
  StreetCredLedger public streetCred;
  address public immutable streetCredMapAddress;
  address private verifier;

  constructor(
    address _streetCredMapAddress,
    address _streetCredContractAddress,
    string memory tokenName,
    string memory tokenSymbol,
    Verifier _verifier
  ) ERC721(tokenName, tokenSymbol) {
    streetCred = StreetCredLedger(_streetCredContractAddress);
    streetCredMapAddress = _streetCredMapAddress;
    verifier = address(_verifier);
  }

  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[2] memory input
  ) external {
    require(
      bytes32(input[1]) == streetCred.getRoot(streetCredMapAddress),
      "Merkle Root does not match the contract"
    );
    require(Verifier(verifier).verifyProof(a, b, c, input), "Invalid Proof");
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
}
