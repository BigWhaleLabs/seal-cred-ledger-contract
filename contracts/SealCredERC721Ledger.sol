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
import "./SCERC721Derivative.sol";

/**
 * @title SealCred ERC721 Ledger
 * @dev Creates SCERC721Derivatives, remembers them and proxies mint calls to them
 */
contract SealCredERC721Ledger is Ownable {
  // State
  mapping(address => address) public originalContractToDerivativeContract;
  address public verifierContract;
  uint256 public immutable attestorPublicKey;

  // Events
  event CreateDerivativeContract(
    address originalContract,
    address derivativeContract
  );
  event DeleteOriginalContract(address originalContract);

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
    address originalContract,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[44] memory input
  ) external {
    // Check if derivative already exists
    if (originalContractToDerivativeContract[originalContract] != address(0)) {
      // Proxy mint call
      SCERC721Derivative(originalContractToDerivativeContract[originalContract])
        .mintWithSender(msg.sender, a, b, c, input);
      return;
    }
    // Create derivative
    IERC721Metadata metadata = IERC721Metadata(originalContract);
    SCERC721Derivative derivative = new SCERC721Derivative(
      address(this),
      originalContract,
      verifierContract,
      attestorPublicKey,
      string(bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))),
      string(bytes.concat(bytes(metadata.symbol()), bytes("-d")))
    );
    originalContractToDerivativeContract[originalContract] = address(
      derivative
    );
    // Emit creation event
    emit CreateDerivativeContract(originalContract, address(derivative));
    // Proxy mint call
    SCERC721Derivative(address(derivative)).mintWithSender(
      msg.sender,
      a,
      b,
      c,
      input
    );
  }

  /**
   * @dev Returns derivative contract of given original contract
   */
  function getDerivativeContract(address originalContract)
    external
    view
    returns (address)
  {
    return originalContractToDerivativeContract[originalContract];
  }

  /**
   * @dev Deletes originalContract record from the ledger
   */
  function deleteOriginalContract(address originalContract) external onlyOwner {
    delete originalContractToDerivativeContract[originalContract];
    emit DeleteOriginalContract(originalContract);
  }
}
