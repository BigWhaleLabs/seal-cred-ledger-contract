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

import "hardhat/console.sol";

contract ExternalSCERC721Ledger is SCERC721Ledger {
  // State
  address public immutable attestorEcdsaAddress;

  constructor(
    address _verifierContract,
    uint256 _attestorEddsaPublicKey,
    address _attestorEcdsaAddress,
    uint256 _network
  ) SCERC721Ledger(_verifierContract, _attestorEddsaPublicKey) {
    attestorEcdsaAddress = _attestorEcdsaAddress;
    network = _network;
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
    (
      string memory originalContractString,
      address originalContract
    ) = _extractAddress(proof.input, 0);
    // Check if derivative already exists
    if (_checkIfDerivativeExists(originalContract)) {
      // Proxy mint call
      _mint(
        SCERC721Derivative(
          originalContractToDerivativeContract[originalContract]
        ),
        proof
      );
      return;
    }
    // Confirm the metadata signature is valid
    bytes32 dataHash = ECDSA.toEthSignedMessageHash(data);
    (address recoveredAttestorAddress, ECDSA.RecoverError ecdsaError) = ECDSA
      .tryRecover(dataHash, signature);
    require(
      ecdsaError == ECDSA.RecoverError.NoError,
      "Error while verifying the ECDSA signature"
    );
    require(
      recoveredAttestorAddress == attestorEcdsaAddress,
      "Wrong attestor public key"
    );
    // Extract metadata
    (
      string memory recoveredContractString,
      uint256 recoveredNetwork,
      string memory name,
      string memory symbol
    ) = _extractMetadata(data);
    // Check the network
    require(recoveredNetwork == network, "Wrong network");
    // Confirm this is the correct contract
    require(
      keccak256(bytes(recoveredContractString)) ==
        keccak256(bytes(originalContractString)),
      "Wrong token address"
    );
    // Create derivative
    _mintSpawningNewDerivative(originalContract, proof, name, symbol);
  }

  function _extractMetadata(bytes memory data)
    internal
    pure
    returns (
      string memory recoveredContractString,
      uint256 network,
      string memory name,
      string memory symbol
    )
  {
    // Get contract string — first 42 characters
    uint256 contractLength = 42;
    uint256 networkLength = 1;
    uint256 zeroLength = 1;
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
    uint256 nameLength = zeroIndex - (contractLength + networkLength);
    bytes memory nameBytes = new bytes(nameLength);
    for (uint256 i = 0; i < nameLength; i++) {
      nameBytes[i] = data[contractLength + networkLength + i];
    }
    // Get symbol string — the rest of the data
    uint256 symbolLength = data.length - (zeroIndex + 1);
    bytes memory symbolBytes = new bytes(symbolLength);
    for (uint256 i = zeroIndex + zeroLength; i < data.length; i++) {
      symbolBytes[i - zeroIndex - zeroLength] = data[i];
    }
    return (
      string(contractBytes),
      uint256(uint8(data[contractLength])),
      string(nameBytes),
      string(symbolBytes)
    );
  }
}
