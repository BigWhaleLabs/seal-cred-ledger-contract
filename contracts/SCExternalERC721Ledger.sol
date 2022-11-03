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
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SCERC721Ledger.sol";

uint256 constant contractLength = 42;
uint256 constant networkLength = 1;
uint256 constant zeroLength = 1;

contract SCExternalERC721Ledger is SCERC721Ledger {
  // State
  address public immutable attestorEcdsaAddress;

  constructor(
    address _verifierContract,
    uint256 _attestorPublicKey,
    address _forwarder,
    uint256 _network,
    address _attestorEcdsaAddress,
    string memory _baseURI,
    string memory _version
  )
    SCERC721Ledger(
      _verifierContract,
      _attestorPublicKey,
      _forwarder,
      _network,
      _baseURI,
      _version
    )
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
    bytes calldata data,
    bytes32 r,
    bytes32 vs
  ) external {
    (string memory originalString, address original) = _extractAddress(
      proof.input[1]
    );
    // Check if derivative already exists
    if (!_checkDerivativeExistence(originalString)) {
      // Extract metadata
      (string memory name, string memory symbol) = _extractMetadata(
        data,
        r,
        vs,
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
    bytes calldata data,
    bytes32 r,
    bytes32 vs,
    string memory originalString
  ) internal view returns (string memory name, string memory symbol) {
    // Check the network
    require(uint256(uint8(data[contractLength])) == network, "Wrong network");
    // Confirm the metadata signature is valid
    (address recoveredAttestorAddress, ECDSA.RecoverError ecdsaError) = ECDSA
      .tryRecover(ECDSA.toEthSignedMessageHash(data), r, vs);
    require(
      ecdsaError == ECDSA.RecoverError.NoError,
      "Error while verifying the ECDSA signature"
    );
    require(
      recoveredAttestorAddress == attestorEcdsaAddress,
      "Wrong attestor public key"
    );
    // Confirm this is the correct contract
    require(
      keccak256(data[:42]) == keccak256(bytes(originalString)),
      "Wrong token address"
    );
    // Get the 0x0 index separating name from symbol
    uint256 zeroIndex;
    uint256 length = data.length;
    for (uint256 i = contractLength; i < length; ) {
      if (data[i] == 0) {
        zeroIndex = i;
        break;
      }

      unchecked {
        ++i;
      }
    }
    // Get name string — between the end of contract at 42 and zero
    uint256 nameLength = zeroIndex - (contractLength + networkLength);
    require(nameLength > 0, "Zero name length");
    bytes memory nameBytes = data[contractLength +
      networkLength:contractLength + networkLength + nameLength];
    // Get symbol string — the rest of the data
    require(data.length > zeroIndex + zeroLength, "Zero symbol length");
    bytes memory symbolBytes = data[zeroIndex + zeroLength:];
    // Return name and symbol
    return (string(nameBytes), string(symbolBytes));
  }
}
