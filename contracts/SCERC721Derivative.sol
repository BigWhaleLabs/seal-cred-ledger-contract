//                                                                        ,-,
//                            *                      .                   /.(              .
//                                       \|/                             \ {
//    .                 _    .  ,   .    -*-       .                      `-`
//     ,'-.         *  / \_ *  / \_      /|\         *   /\'__        *.                 *
//    (____".         /    \  /    \,     __      .    _/  /  \  * .               .
//               .   /\/\  /\/ :' __ \_  /  \       _^/  ^/    `—./\    /\   .
//   *       _      /    \/  \  _/  \-‘\/  ` \ /\  /.' ^_   \_   .’\\  /_/\           ,'-.
//          /_\   /\  .-   `. \/     \ /.     /  \ ;.  _/ \ -. `_/   \/.   \   _     (____".    *
//     .   /   \ /  `-.__ ^   / .-'.--\      -    \/  _ `--./ .-'  `-/.     \ / \             .
//        /     /.       `.  / /       `.   /   `  .-'      '-._ `._         /.  \
// ~._,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'
// ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~~
// ~~    ~~~~    ~~~~     ~~~~   ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~
//     ~~     ~~      ~~      ~~      ~~      ~~      ~~      ~~       ~~     ~~      ~~      ~~
//                          ๐
//                                                                              _
//                                                  ₒ                         ><_>
//                                  _______     __      _______
//          .-'                    |   _  "\   |" \    /" _   "|                               ๐
//     '--./ /     _.---.          (. |_)  :)  ||  |  (: ( \___)
//     '-,  (__..-`       \        |:     \/   |:  |   \/ \
//        \          .     |       (|  _  \\   |.  |   //  \ ___
//         `,.__.   ,__.--/        |: |_)  :)  |\  |   (:   _(  _|
//           '._/_.'___.-`         (_______/   |__\|    \_______)                 ๐
//
//                  __   __  ___   __    __         __       ___         _______
//                 |"  |/  \|  "| /" |  | "\       /""\     |"  |       /"     "|
//      ๐          |'  /    \:  |(:  (__)  :)     /    \    ||  |      (: ______)
//                 |: /'        | \/      \/     /' /\  \   |:  |   ₒ   \/    |
//                  \//  /\'    | //  __  \\    //  __'  \   \  |___    // ___)_
//                  /   /  \\   |(:  (  )  :)  /   /  \\  \ ( \_|:  \  (:      "|
//                 |___/    \___| \__|  |__/  (___/    \___) \_______)  \_______)
//                                                                                     ₒ৹
//                          ___             __       _______     ________
//         _               |"  |     ₒ     /""\     |   _  "\   /"       )
//       ><_>              ||  |          /    \    (. |_)  :) (:   \___/
//                         |:  |         /' /\  \   |:     \/   \___  \
//                          \  |___     //  __'  \  (|  _  \\    __/  \\          \_____)\_____
//                         ( \_|:  \   /   /  \\  \ |: |_)  :)  /" \   :)         /--v____ __`<
//                          \_______) (___/    \___)(_______/  (_______/                  )/
//                                                                                        '
//
//            ๐                          .    '    ,                                           ₒ
//                         ₒ               _______
//                                 ____  .`_|___|_`.  ____
//                                        \ \   / /                        ₒ৹
//                                          \ ' /                         ๐
//   ₒ                                        \/
//                                   ₒ     /      \       )                                 (
//           (   ₒ৹               (                      (                                  )
//            )                   )               _      )                )                (
//           (        )          (       (      ><_>    (       (        (                  )
//     )      )      (     (      )       )              )       )        )         )      (
//    (      (        )     )    (       (              (       (        (         (        )
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC721OwnershipCheckerVerifier.sol";
import "./Utils.sol";

contract SCERC721Derivative is ERC721, Ownable {
  using Counters for Counters.Counter;

  // State
  address public immutable sealCredERC721Contract;
  address public immutable originalContract;
  uint256 public immutable attestorPublicKey;
  address public verifierContract;
  mapping(string => bool) public nullifiers;
  Counters.Counter public currentTokenId;

  constructor(
    address _sealCredERC721Contract,
    address _originalContract,
    address _verifierContract,
    uint256 _attestorPublicKey,
    string memory tokenName,
    string memory tokenSymbol
  ) ERC721(tokenName, tokenSymbol) {
    sealCredERC721Contract = _sealCredERC721Contract;
    originalContract = _originalContract;
    verifierContract = _verifierContract;
    attestorPublicKey = _attestorPublicKey;
  }

  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[57] memory input
  ) external {
    _mint(msg.sender, a, b, c, input);
  }

  function mintWithSender(
    address sender,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[57] memory input
  ) external onlyOwner {
    _mint(sender, a, b, c, input);
  }

  function _mint(
    address sender,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[57] memory input
  ) internal {
    // Check if zkp is fresh
    string memory nullifier = _extractNullifier(input);
    require(
      nullifiers[nullifier] != true,
      "This ZK proof has already been used"
    );
    // Check if attestor is correct
    require(
      input[56] == attestorPublicKey,
      "This ZK proof is not from the correct attestor"
    );
    // Check if tokenAddress is correct
    bytes memory originalContractBytes = bytes(
      Strings.toHexString(uint256(uint160(originalContract)), 20)
    );
    for (uint8 i = 0; i < 42; i++) {
      require(
        uint8(input[i + 14]) == uint8(originalContractBytes[i]),
        "This ZK proof is not from the correct token contract"
      );
    }
    // Check if zkp is valid
    require(
      IERC721OwnershipCheckerVerifier(verifierContract).verifyProof(
        a,
        b,
        c,
        input
      ),
      "Invalid ZK proof"
    );
    // Mint
    _safeMint(sender, currentTokenId.current());
    currentTokenId.increment();
    // Save nullifier
    nullifiers[nullifier] = true;
  }

  function _extractNullifier(uint256[57] memory input)
    internal
    pure
    returns (string memory)
  {
    string memory _nullifier;

    for (uint256 i = 0; i < 14; i++) {
      if (i == 0) {
        _nullifier = string(
          abi.encodePacked(_nullifier, Strings.toHexString(input[i]))
        );
      } else {
        _nullifier = string(
          abi.encodePacked(
            _nullifier,
            Utils.cut0x(Strings.toHexString(input[i]))
          )
        );
      }
    }

    return _nullifier;
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
