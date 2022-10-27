import {
  attestorPublicKey,
  constructTokenURI,
  getFakeFarcasterProof,
  getFakeFarcasterVerifier,
  invalidAttestorPublicKey,
  metadataURL,
  newMetadataURL,
  nonZeroAddress,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('SCFarcasterLedger and SCFarcasterDerivative contracts tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.scFarcasterLedgerFactory = await ethers.getContractFactory(
      'SCFarcasterLedger'
    )
    this.scFarcasterDerivativeFactory = await ethers.getContractFactory(
      'SCFarcasterDerivative'
    )
    this.version = '0.0.1'
  })
  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.scFarcasterLedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        zeroAddress,
        metadataURL,
        this.version
      )
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
      expect(await contract.baseURI()).to.equal(metadataURL)
      expect(await contract.version()).to.equal(this.version)
      expect(await contract.getTrustedForwarder()).to.equal(zeroAddress)
    })
  })
  describe('Owner-only calls from non-owner', function () {
    before(async function () {
      this.scFarcasterLedger = await this.scFarcasterLedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        nonZeroAddress,
        metadataURL,
        this.version
      )
      await this.scFarcasterLedger.deployed()
      this.contractWithIncorrectOwner = this.scFarcasterLedger.connect(
        this.user
      )
    })
    it('should have the correct owner', async function () {
      expect(await this.scFarcasterLedger.owner()).to.equal(this.owner.address)
    })
    it('should not be able to call setVerifierContract', async function () {
      await expect(
        this.contractWithIncorrectOwner.setVerifierContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
    it('should not be able to call deleteOriginal', async function () {
      await expect(
        this.contractWithIncorrectOwner.deleteOriginal(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
    it('should not be able to call setBaseURI', async function () {
      await expect(
        this.contractWithIncorrectOwner.setBaseURI(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
  it('should set verifier contract', async function () {
    const contract = await this.scFarcasterLedgerFactory.deploy(
      zeroAddress,
      attestorPublicKey,
      nonZeroAddress,
      metadataURL,
      this.version
    )
    await contract.deployed()
    expect(await contract.verifierContract()).to.equal(zeroAddress)
    const newVerifierAddress = this.accounts[1].address
    await contract.setVerifierContract(newVerifierAddress)
    expect(await contract.verifierContract()).to.equal(newVerifierAddress)
  })
  describe('Minting and derivatives', function () {
    beforeEach(async function () {
      // Verifier
      this.fakeVerifierContract = await getFakeFarcasterVerifier(this.owner)
      await this.fakeVerifierContract.mock.verifyProof.returns(true)
      // Ledger
      this.scFarcasterLedger = await this.scFarcasterLedgerFactory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        nonZeroAddress,
        metadataURL,
        this.version
      )
      await this.scFarcasterLedger.deployed()
      this.scFarcasterLedger.connect(this.user)
      // Derivative
      this.scFarcasterDerivative =
        await this.scFarcasterDerivativeFactory.deploy(
          this.scFarcasterLedger.address,
          this.fakeVerifierContract.address,
          attestorPublicKey,
          metadataURL,
          this.version
        )
      await this.scFarcasterDerivative.deployed()
      this.scFarcasterDerivative.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      const tx = await this.scFarcasterLedger.mint(getFakeFarcasterProof(123))
      expect(await tx.wait())
    })
    it('should return correct metadata', async function () {
      // Token mint
      const tx = await this.scFarcasterDerivative.mint(
        getFakeFarcasterProof(123)
      )
      await tx.wait()
      // Get the derivative
      const derivativeAddress = this.scFarcasterDerivative.address
      const tokenURIfromContract = (
        await this.scFarcasterDerivative.tokenURI(0)
      ).toLowerCase()
      const expectedTokenURI = constructTokenURI(
        metadataURL,
        derivativeAddress,
        0
      )
      // Check the tokenURI
      expect(tokenURIfromContract).to.equal(expectedTokenURI)
    })
    it('should use baseURI configured for derivative', async function () {
      // Token mint
      const tx = await this.scFarcasterDerivative.mint(
        getFakeFarcasterProof(123)
      )
      await tx.wait()
      // Get the derivative
      const derivativeAddress = this.scFarcasterDerivative.address
      // Set specific baseURI for derivaitve
      await this.scFarcasterDerivative.setBaseURI(newMetadataURL)

      const tokenURIfromContract = (
        await this.scFarcasterDerivative.tokenURI(0)
      ).toLowerCase()
      const expectedTokenURI = constructTokenURI(
        newMetadataURL,
        derivativeAddress,
        0
      )
      // Check the tokenURI
      expect(tokenURIfromContract).to.equal(expectedTokenURI)
    })
    it('should mint from the derivative if all the correct info is there', async function () {
      const derivativeTx = await this.scFarcasterDerivative.mint(
        getFakeFarcasterProof(123)
      )
      expect(await derivativeTx.wait())
    })
    it('should save nullifier correctly', async function () {
      const nullifier = 123
      const derivativeTx = await this.scFarcasterDerivative.mint(
        getFakeFarcasterProof(123)
      )
      expect(await derivativeTx.wait())
      expect(await this.scFarcasterDerivative.nullifiers(nullifier)).to.equal(
        true
      )
    })
    it('should check balance of derivative', async function () {
      await this.scFarcasterLedger.mint(getFakeFarcasterProof(123))
      const balance = await this.scFarcasterLedger.balanceOf(
        'farcaster',
        this.owner.address
      )
      expect(balance).to.equal(1)
    })
    it('should return 0 if derivative is not exist', async function () {
      await this.scFarcasterLedger.mint(getFakeFarcasterProof(123))
      const balance = await this.scFarcasterLedger.balanceOf(
        'FaRcAsTeR',
        this.owner.address
      )
      expect(balance).to.equal(0)
    })
    it('should return 0 if owner does not own a derivative', async function () {
      await this.scFarcasterLedger.mint(getFakeFarcasterProof(123))
      const balance = await this.scFarcasterLedger.balanceOf(
        'farcaster',
        this.user.address
      )
      expect(balance).to.equal(0)
    })
    it('should not transfer if the from address is non-zero', async function () {
      await this.scFarcasterDerivative.mint(getFakeFarcasterProof(123))
      await expect(
        this.scFarcasterDerivative.transferFrom(
          this.scFarcasterDerivative.owner(),
          nonZeroAddress,
          0
        )
      ).to.be.revertedWith('This token is soulbound')
    })
    it('should not mint if the attestor is incorrect', async function () {
      const farcasterInput = getFakeFarcasterProof(123)
      farcasterInput.input[11] = invalidAttestorPublicKey
      await expect(
        this.scFarcasterLedger.mint(farcasterInput)
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the "farcaster" word is incorrect', async function () {
      const farcasterInput = getFakeFarcasterProof(123)
      // Corrupt the message
      farcasterInput.input[1] = 0
      await expect(
        this.scFarcasterDerivative.mint(farcasterInput)
      ).to.be.revertedWith('This ZK proof is not from the farcaster')
    })
    it('should not mint if attestation type is invalid', async function () {
      const farcasterInput = getFakeFarcasterProof(123)
      // Corrupt the message
      farcasterInput.input[0] = 1
      await expect(
        this.scFarcasterDerivative.mint(farcasterInput)
      ).to.be.revertedWith('Invalid attestation type')
    })
    it('should not mint if nullifier has already been used', async function () {
      await this.scFarcasterDerivative.mint(getFakeFarcasterProof(123))
      await expect(
        this.scFarcasterDerivative.mint(getFakeFarcasterProof(123))
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      await this.fakeVerifierContract.mock.verifyProof.returns(false)
      await expect(
        this.scFarcasterLedger.mint(getFakeFarcasterProof(123))
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
