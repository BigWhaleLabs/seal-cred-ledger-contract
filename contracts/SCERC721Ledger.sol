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
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./base/Ledger.sol";
import "./SCERC721Derivative.sol";

uint256 constant addressLength = 42;

/**
 * @title SealCred ERC721 Ledger
 * @dev Creates SCERC721Derivatives, remembers them and proxies mint calls to them
 */
contract SCERC721Ledger is Ledger {
  // State
  uint256 public immutable network;

  constructor(
    address _verifierContract,
    uint256 _attestorPublicKey,
    uint256 _network,
    address _forwarder
  ) Ledger(_verifierContract, _attestorPublicKey, _forwarder) {
    network = _network;
  }

  /**
   * @dev Universal mint function that proxies mint call to derivatives and creates derivatives if necessary
   */
  function mint(BalanceProof memory proof) external virtual {
    (string memory originalString, address original) = _extractAddress(
      proof.input,
      0
    );
    // Check if derivative already exists
    if (!_checkDerivativeExistence(originalString)) {
      IERC721Metadata metadata = IERC721Metadata(original);
      _spawnDerivative(
        original,
        originalString,
        metadata.name(),
        metadata.symbol()
      );
    }
    // Proxy mint call
    SCERC721Derivative(originalToDerivative[originalString]).mintWithSender(
      _msgSender(),
      proof
    );
  }

  /**
   * @dev Create a new derivative
   */
  function _spawnDerivative(
    address original,
    string memory originalString,
    string memory name,
    string memory symbol
  ) internal {
    SCERC721Derivative derivative = new SCERC721Derivative(
      address(this),
      original,
      verifierContract,
      attestorPublicKey,
      network,
      string(bytes.concat(bytes(name), bytes(" (derivative)"))),
      string(bytes.concat(bytes(symbol), bytes("-d")))
    );
    _registerDerivative(originalString, address(derivative));
  }

  /**
   * @dev Returns address from input
   */
  function _extractAddress(uint256[46] memory input, uint256 startIndex)
    internal
    pure
    returns (string memory, address)
  {
    bytes memory result = new bytes(addressLength);
    for (uint256 i = startIndex; i < startIndex + addressLength; i++) {
      result[i] = bytes1(uint8(input[i]));
    }
    string memory addressString = string(result);
    return (addressString, _toAddress(addressString));
  }

  // Credit to: https://github.com/provable-things/ethereum-api
  function _toAddress(string memory _a) internal pure returns (address) {
    bytes memory tmp = bytes(_a);
    uint160 iaddr = 0;
    uint160 b1;
    uint160 b2;
    for (uint256 i = 2; i < 2 + 2 * 20; i += 2) {
      iaddr *= 256;
      b1 = uint160(uint8(tmp[i]));
      b2 = uint160(uint8(tmp[i + 1]));
      if ((b1 >= 97) && (b1 <= 102)) {
        b1 -= 87;
      } else if ((b1 >= 65) && (b1 <= 70)) {
        b1 -= 55;
      } else if ((b1 >= 48) && (b1 <= 57)) {
        b1 -= 48;
      }
      if ((b2 >= 97) && (b2 <= 102)) {
        b2 -= 87;
      } else if ((b2 >= 65) && (b2 <= 70)) {
        b2 -= 55;
      } else if ((b2 >= 48) && (b2 <= 57)) {
        b2 -= 48;
      }
      iaddr += (b1 * 16 + b2);
    }
    return address(iaddr);
  }
}
