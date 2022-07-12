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

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./SCEmailDerivative.sol";

/**
 * @title SealCred Email Ledger
 * @dev Creates SCEmailDerivatives, remembers them and proxies mint calls to them
 */
contract SCEmailLedger is Ownable {
  // State
  mapping(string => address) public emailToDerivativeContract;
  address public verifierContract;
  uint256 public immutable attestorPublicKey;

  // Events
  event CreateDerivativeContract(string domain, address derivativeContract);
  event DeleteEmail(string domain);

  constructor(address _verifierContract, uint256 _attestorPublicKey) {
    verifierContract = _verifierContract;
    attestorPublicKey = _attestorPublicKey;
  }

  /**
   * @dev Returns verifier contract
   */
  function setVerifierContract(address _verifierContract) external onlyOwner {
    verifierContract = _verifierContract;
  }

  /**
   * @dev Universal mint function that proxies mint call to derivatives and creates derivatives if necessary
   */
  function mint(EmailProof memory proof) external {
    string memory domain = _extractDomain(proof.input, 0, 90);
    // Check if derivative already exists
    if (emailToDerivativeContract[domain] != address(0)) {
      // Proxy mint call
      SCEmailDerivative(emailToDerivativeContract[domain]).mintWithSender(
        msg.sender,
        proof
      );
      return;
    }
    // Create derivative
    SCEmailDerivative derivative = new SCEmailDerivative(
      address(this),
      domain,
      verifierContract,
      attestorPublicKey,
      string(bytes.concat(bytes("@"), bytes(domain), bytes(" email"))),
      string(bytes.concat(bytes(domain), bytes("-d")))
    );
    emailToDerivativeContract[domain] = address(derivative);
    // Emit creation event
    emit CreateDerivativeContract(domain, address(derivative));
    // Proxy mint call
    SCEmailDerivative(address(derivative)).mintWithSender(msg.sender, proof);
  }

  /**
   * @dev Returns derivative contract of given domain
   */
  function getDerivativeContract(string memory domain)
    external
    view
    returns (address)
  {
    return emailToDerivativeContract[domain];
  }

  /**
   * @dev Deletes domain record from the ledger
   */
  function deleteEmail(string memory domain) external onlyOwner {
    delete emailToDerivativeContract[domain];
    emit DeleteEmail(domain);
  }

  /**
   * @dev Returns domain from input
   */
  function _extractDomain(
    uint256[92] memory input,
    uint256 startIndex,
    uint256 length
  ) internal pure returns (string memory) {
    uint256 zeroIndex = 0;
    for (uint256 i = startIndex; i < startIndex + length; i++) {
      if (input[i] == 0) {
        zeroIndex = i;
        break;
      }
    }
    bytes memory result = new bytes(zeroIndex);
    for (uint256 i = startIndex; i < zeroIndex; i++) {
      result[i] = bytes1(uint8(input[i]));
    }
    return string(result);
  }
}
