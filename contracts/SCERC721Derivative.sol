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

import "@big-whale-labs/seal-hub-kit/contracts/SealHubChecker.sol";
import "./base/Derivative.sol";
import "./interfaces/IBalanceCheckerVerifier.sol";
import "./models/BalanceProof.sol";

contract SCERC721Derivative is Derivative, SealHubChecker {
  // State
  address public immutable originalContract;
  uint256 public immutable originalNetwork;

  constructor(
    address _ledgerContract,
    address _originalContract,
    address _verifierContract,
    uint256 _attestorPublicKey,
    uint256 _originalNetwork,
    string memory tokenName,
    string memory tokenSymbol,
    string memory _baseURI,
    string memory _version,
    address _sealHub
  )
    Derivative(
      _ledgerContract,
      _verifierContract,
      _attestorPublicKey,
      tokenName,
      tokenSymbol,
      _baseURI,
      _version
    )
    SealHubChecker(_sealHub)
  {
    originalContract = _originalContract;
    originalNetwork = _originalNetwork;
  }

  function mint(BalanceProof memory proof) external {
    _mint(msg.sender, proof);
  }

  function mintWithSender(
    address sender,
    BalanceProof memory proof
  ) external onlyOwner {
    _mint(sender, proof);
  }

  function _mint(address sender, BalanceProof memory proof) internal {
    _checkAttestationType(proof.input[0]);
    _checkNetwork(proof.input[3]);
    _checkThreshold(proof.input[4]);
    _checkSealHub(proof.input[5]);
    _checkAttestor(proof.input[7]);
    _checkTokenAddress(proof);
    _checkProof(proof);
    _mintWithNullifier(sender, proof.input[6]);
  }

  function _checkAttestationType(uint256 attestationType) internal pure {
    require(attestationType == 0, "Invalid attestation type");
  }

  function _checkNetwork(uint256 _network) internal view {
    require(originalNetwork == _network, "Unexpected network");
  }

  function _checkThreshold(uint256 _threshold) internal pure {
    require(_threshold > 0, "The threshold should be greater than 0");
  }

  function _checkTokenAddress(BalanceProof memory proof) internal view {
    bytes memory tokenBytes = bytes(
      Strings.toHexString(uint256(uint160(originalContract)), 20)
    );
    bytes memory contractBytes = bytes(
      Strings.toHexString(uint256(uint160(proof.input[1])), 20)
    );
    require(
      keccak256(tokenBytes) == keccak256(contractBytes),
      "This ZK proof is not from the correct token contract"
    );
  }

  function _checkProof(BalanceProof memory proof) internal view {
    require(
      IBalanceCheckerVerifier(verifierContract).verifyProof(
        proof.a,
        proof.b,
        proof.c,
        proof.input
      ),
      "Invalid ZK proof"
    );
  }
}
