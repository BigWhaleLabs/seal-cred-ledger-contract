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
contract SCERC721Ledger is Ownable {
  // State
  mapping(address => address) public originalContractToDerivativeContract;
  address public verifierContract;
  uint256 public immutable attestorPublicKey;
  uint256 public network = 103; // 103 — 'g', 109 — 'm'

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
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[46] memory input
  ) external virtual {
    (, address originalContract) = _extractAddress(input, 0);
    // Check if derivative already exists
    if (_checkIfDerivativeExists(originalContract)) {
      // Proxy mint call
      _mint(
        SCERC721Derivative(
          originalContractToDerivativeContract[originalContract]
        ),
        a,
        b,
        c,
        input
      );
      return;
    }
    // Create derivative
    IERC721Metadata metadata = IERC721Metadata(originalContract);
    string memory name = string(
      bytes.concat(bytes(metadata.name()), bytes(" (derivative)"))
    );
    string memory symbol = string(
      bytes.concat(bytes(metadata.symbol()), bytes("-d"))
    );
    _mintSpawningNewDerivative(originalContract, a, b, c, input, name, symbol);
  }

  /**
   * @dev Checks if derivative exists
   */
  function _checkIfDerivativeExists(address originalContract)
    internal
    view
    returns (bool)
  {
    return originalContractToDerivativeContract[originalContract] != address(0);
  }

  /**
   * @dev Creates a new derivative and proxies mint call to it
   */
  function _mintSpawningNewDerivative(
    address originalContract,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[46] memory input,
    string memory name,
    string memory symbol
  ) internal {
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
    _mint(SCERC721Derivative(address(derivative)), a, b, c, input);
  }

  /**
   * @dev Proxies mint call to derivative
   */
  function _mint(
    SCERC721Derivative derivative,
    uint256[2] memory a,
    uint256[2][2] memory b,
    uint256[2] memory c,
    uint256[46] memory input
  ) internal {
    derivative.mintWithSender(msg.sender, a, b, c, input);
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

  /**
   * @dev Returns address from input
   */
  function _extractAddress(uint256[46] memory input, uint256 startIndex)
    internal
    pure
    returns (string memory, address)
  {
    uint256 length = 42;
    bytes memory result = new bytes(length);
    for (uint256 i = startIndex; i < startIndex + length; i++) {
      result[i] = bytes1(uint8(input[i]));
    }
    string memory addressString = string(result);
    return (addressString, _parseAddress(addressString));
  }

  // Credit to: https://github.com/provable-things/ethereum-api
  function _parseAddress(string memory _a) internal pure returns (address) {
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
