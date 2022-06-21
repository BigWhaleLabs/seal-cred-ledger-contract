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
 * @dev Creates EmailDerivatives, remembers them and proxies mint calls to them
 */
contract SealCredEmailLedger is Ownable {
  // State
  mapping(string => address) public emailToDerivativeContract;
  address public verifierContract;
  uint256 public immutable attestorPublicKey;

  // Events
  event CreateDerivativeContract(string email, address derivativeContract);
  event DeleteEmail(string email);

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
  function mint(
    string memory email,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[92] memory input
  ) external {
    // Check if derivative already exists
    if (emailToDerivativeContract[email] != address(0)) {
      // Proxy mint call
      SCEmailDerivative(emailToDerivativeContract[email]).mintWithSender(
        msg.sender,
        a,
        b,
        c,
        input
      );
      return;
    }
    // Create derivative
    SCEmailDerivative derivative = new SCEmailDerivative(
      address(this),
      email,
      verifierContract,
      attestorPublicKey,
      string(bytes.concat(bytes(email), bytes(" (derivative)"))),
      string(bytes.concat(bytes(email), bytes("-d")))
    );
    emailToDerivativeContract[email] = address(derivative);
    // Emit creation event
    emit CreateDerivativeContract(email, address(derivative));
    // Proxy mint call
    SCEmailDerivative(address(derivative)).mintWithSender(
      msg.sender,
      a,
      b,
      c,
      input
    );
  }

  /**
   * @dev Returns derivative contract of given email
   */
  function getDerivativeContract(string memory email)
    external
    view
    returns (address)
  {
    return emailToDerivativeContract[email];
  }

  /**
   * @dev Deletes email record from the ledger
   */
  function deleteEmail(string memory email) external onlyOwner {
    delete emailToDerivativeContract[email];
    emit DeleteEmail(email);
  }
}
