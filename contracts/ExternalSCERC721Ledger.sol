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

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SCERC721Ledger.sol";

uint256 constant contractLength = 42;
uint256 constant networkLength = 1;
uint256 constant zeroLength = 1;

contract ExternalSCERC721Ledger is SCERC721Ledger {
  // State
  address public immutable attestorEcdsaAddress;

  constructor(
    address _verifierContract,
    uint256 _attestorPublicKey,
    uint256 _network,
    address _attestorEcdsaAddress,
    address _forwarder
  )
    SCERC721Ledger(_verifierContract, _attestorPublicKey, _network, _forwarder)
  {
    attestorEcdsaAddress = _attestorEcdsaAddress;
  }

  function mint(BalanceProof memory) external pure override {
    revert("Mint with ECDSA signature should be used");
  }

  /**
   * @dev Universal mint function that proxies mint call to derivatives and creates derivatives if necessary
   */
  function mint(
    BalanceProof memory proof,
    bytes memory data,
    bytes memory signature
  ) external {
    (string memory originalString, address original) = _extractAddress(
      proof.input,
      0
    );
    // Check if derivative already exists
    if (!_checkDerivativeExistence(originalString)) {
      // Extract metadata
      (string memory name, string memory symbol) = _extractMetadata(
        data,
        signature,
        originalString
      );
      _spawnDerivative(original, originalString, name, symbol);
    }
    // Proxy mint call
    SCERC721Derivative(originalToDerivative[originalString]).mintWithSender(
      _msgSender(),
      proof
    );
  }

  function _extractMetadata(
    bytes memory data,
    bytes memory signature,
    string memory originalString
  ) internal view returns (string memory name, string memory symbol) {
    // Check the network
    require(uint256(uint8(data[contractLength])) == network, "Wrong network");
    // Confirm the metadata signature is valid
    (address recoveredAttestorAddress, ECDSA.RecoverError ecdsaError) = ECDSA
      .tryRecover(ECDSA.toEthSignedMessageHash(data), signature);
    require(
      ecdsaError == ECDSA.RecoverError.NoError,
      "Error while verifying the ECDSA signature"
    );
    require(
      recoveredAttestorAddress == attestorEcdsaAddress,
      "Wrong attestor public key"
    );
    // Get contract string — first 42 characters
    bytes memory contractBytes = new bytes(contractLength);
    for (uint256 i = 0; i < contractLength; i++) {
      contractBytes[i] = data[i];
    }
    // Confirm this is the correct contract
    require(
      keccak256(contractBytes) == keccak256(bytes(originalString)),
      "Wrong token address"
    );
    // Get the 0x0 index separating name from symbol
    uint256 zeroIndex;
    for (uint256 i = contractLength; i < data.length; i++) {
      if (data[i] == 0) {
        zeroIndex = i;
        break;
      }
    }
    // Get name string — between the end of contract at 42 and zero
    uint256 nameLength = zeroIndex - (contractLength + networkLength);
    bytes memory nameBytes = new bytes(nameLength);
    require(nameBytes.length > 0, "Zero name length");
    for (uint256 i = 0; i < nameLength; i++) {
      nameBytes[i] = data[contractLength + networkLength + i];
    }
    // Get symbol string — the rest of the data
    uint256 symbolLength = data.length - (zeroIndex + 1);
    bytes memory symbolBytes = new bytes(symbolLength);
    require(symbolBytes.length > 0, "Zero symbol length");
    for (uint256 i = zeroIndex + zeroLength; i < data.length; i++) {
      symbolBytes[i - zeroIndex - zeroLength] = data[i];
    }
    // Return name and symbol
    return (string(nameBytes), string(symbolBytes));
  }
}
