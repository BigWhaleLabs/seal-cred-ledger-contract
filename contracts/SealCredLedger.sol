// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./SCERC721Derivative.sol";

/**
 * @title SealCred Ledger
 * @dev Creates SCERC721Derivatives, remembers them and proxies mint calls to them
 */
contract SealCredLedger is Ownable {
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
