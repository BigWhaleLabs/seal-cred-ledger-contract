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

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SCERC721Ledger.sol";

contract ExternalSCERC721Ledger is SCERC721Ledger {
  using ECDSA for bytes32;

  // State
  uint256 public immutable attestorEcdsaPublicKey;

  constructor(
    address _verifierContract,
    uint256 _attestorEddsaPublicKey,
    uint256 _attestorEcdsaPublicKey,
    uint256 _network
  ) SCERC721Ledger(_verifierContract, _attestorEddsaPublicKey) {
    attestorEcdsaPublicKey = _attestorEcdsaPublicKey;
    network = _network;
  }

  /**
   * @dev Universal mint function that proxies mint call to derivatives and creates derivatives if necessary
   */
  function mint(
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[46] memory input,
    bytes32 data,
    bytes memory signature
  ) external {
    (
      string memory originalContractString,
      address originalContract
    ) = _extractAddress(input, 0);
    // Check if derivative already exists
    if (originalContractToDerivativeContract[originalContract] != address(0)) {
      // Proxy mint call
      SCERC721Derivative(originalContractToDerivativeContract[originalContract])
        .mintWithSender(msg.sender, a, b, c, input);
      return;
    }
    // Confirm the metadata signature is valid
    require(
      data.toEthSignedMessageHash().recover(signature) == originalContract,
      "Wrong attestor public key"
    );
    // Extract metadata
    (
      string memory recoveredContractString,
      string memory name,
      string memory symbol
    ) = _extractMetadata(data);
    // Confirm this is the correct contract
    require(
      keccak256(bytes(recoveredContractString)) ==
        keccak256(bytes(originalContractString)),
      "Wrong token address"
    );
    // Create derivative
    SCERC721Derivative derivative = new SCERC721Derivative(
      address(this),
      originalContract,
      verifierContract,
      attestorPublicKey,
      network,
      name,
      symbol
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

  function _extractMetadata(bytes32 data)
    internal
    pure
    returns (
      string memory,
      string memory,
      string memory
    )
  {
    // Get contract string — first 42 characters
    uint256 contractLength = 42;
    bytes memory contractBytes = new bytes(contractLength);
    for (uint256 i = 0; i < contractLength; i++) {
      contractBytes[i] = data[i];
    }
    // Get the 0x0 index separating name from symbol
    uint256 zeroIndex;
    for (uint256 i = 42; i < data.length; i++) {
      if (data[i] == 0) {
        zeroIndex = i;
        break;
      }
    }
    // Get name string — between the end of contract at 42 and zero
    uint256 nameLength = zeroIndex - contractLength;
    bytes memory nameBytes = new bytes(nameLength);
    for (uint256 i = contractLength; i < zeroIndex; i++) {
      nameBytes[i] = data[i];
    }
    // Get symbol string — the rest of the data
    uint256 symbolLength = data.length - contractLength - nameLength - 1;
    bytes memory symbolBytes = new bytes(symbolLength);
    for (uint256 i = zeroIndex + 1; i < data.length; i++) {
      symbolBytes[i - zeroIndex - 1] = data[i];
    }
    return (string(contractBytes), string(nameBytes), string(symbolBytes));
  }
}
