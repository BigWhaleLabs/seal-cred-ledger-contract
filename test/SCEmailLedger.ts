import {
  attestorPublicKey,
  constructTokenURI,
  domains,
  getFakeEmailProof,
  getFakeEmailVerifier,
  invalidAttestorPublicKey,
  metadataURL,
  nonZeroAddress,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('SCEmailLedger and SCEmailDerivative contracts tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.scEmailLedgerFactory = await ethers.getContractFactory('SCEmailLedger')
    this.scEmailDerivativeFactory = await ethers.getContractFactory(
      'SCEmailDerivative'
    )
    this.version = '0.0.1'
  })
  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.scEmailLedgerFactory.deploy(
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
      this.scEmailLedger = await this.scEmailLedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        nonZeroAddress,
        metadataURL,
        this.version
      )
      await this.scEmailLedger.deployed()
      this.contractWithIncorrectOwner = this.scEmailLedger.connect(this.user)
    })
    it('should have the correct owner', async function () {
      expect(await this.scEmailLedger.owner()).to.equal(this.owner.address)
    })
    it('should not be able to call setVerifierContract', async function () {
      await expect(
        this.contractWithIncorrectOwner.setVerifierContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
    it('should not be able to call deleteOriginal', async function () {
      await expect(
        this.contractWithIncorrectOwner.deleteOriginal(domains[0])
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
    it('should not be able to call setBaseURI', async function () {
      await expect(
        this.contractWithIncorrectOwner.setBaseURI(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
  it('should set verifier contract', async function () {
    const contract = await this.scEmailLedgerFactory.deploy(
      zeroAddress,
      attestorPublicKey,
      nonZeroAddress,
      metadataURL,
      this.version
    )
    await contract.deployed()
    expect(await contract.verifierContract()).to.equal(zeroAddress)
    const newVerifierAddress = this.accounts[2].address
    await contract.setVerifierContract(newVerifierAddress)
    expect(await contract.verifierContract()).to.equal(newVerifierAddress)
  })
  describe('Minting and derivatives', function () {
    beforeEach(async function () {
      this.fakeEmailVerifierContract = await getFakeEmailVerifier(this.owner)
      await this.fakeEmailVerifierContract.mock.verifyProof.returns(true)
      this.scEmailLedger = await this.scEmailLedgerFactory.deploy(
        this.fakeEmailVerifierContract.address,
        attestorPublicKey,
        nonZeroAddress,
        metadataURL,
        this.version
      )
      await this.scEmailLedger.deployed()
      this.scEmailLedger.connect(this.user)
      const domain = domains[0]
      this.scEmailDerivative = await this.scEmailDerivativeFactory.deploy(
        this.scEmailLedger.address,
        domain,
        this.fakeEmailVerifierContract.address,
        attestorPublicKey,
        `@${domain} email`,
        `${domain}-d`,
        metadataURL,
        this.version
      )
      await this.scEmailDerivative.deployed()
      this.scEmailDerivative.connect(this.user)
    })
    it('should mint from the ledger if all the correct info is there', async function () {
      const domain = domains[0]
      const tx = await this.scEmailLedger.mint(getFakeEmailProof(123, domain))
      expect(await tx.wait())
      // Get the derivative
      const derivativeAddress = await this.scEmailLedger.getDerivative(domain)
      const scEmailDerivative = await this.scEmailDerivativeFactory.attach(
        derivativeAddress
      )
      // Check the derivative variables
      const name: string = await scEmailDerivative.name()
      const symbol = await scEmailDerivative.symbol()
      expect(name).to.equal(`@${domain} email`)
      expect(symbol).to.equal(`${domain}-d`)
      // Should be no extra zero bytes
      expect(/\0/g.test(name)).to.be.false
      expect(/\0/g.test(symbol)).to.be.false
    })
    it('should return correct metadata', async function () {
      // Check the mint transaction
      const domain = domains[0]
      const tx = await this.scEmailLedger.mint(getFakeEmailProof(123, domain))
      await tx.wait()
      // Get the derivative
      const derivativeAddress = await this.scEmailLedger.getDerivative(domain)
      const scEmailDerivative =
        this.scEmailDerivativeFactory.attach(derivativeAddress)
      const tokenURIfromContract = (
        await scEmailDerivative.tokenURI(0)
      ).toLowerCase()
      const expectedTokenURI = constructTokenURI(
        metadataURL,
        derivativeAddress,
        0
      )
      // Check the tokenURI
      expect(tokenURIfromContract).to.equal(expectedTokenURI)
    })
    it('should mint from the derivative if all the correct info is there', async function () {
      const derivativeTx = await this.scEmailDerivative.mint(
        getFakeEmailProof(123, domains[0])
      )
      expect(await derivativeTx.wait())
    })
    it('should save nullifier correctly when minting from derivative', async function () {
      const nullifier = 123
      const derivativeTx = await this.scEmailDerivative.mint(
        getFakeEmailProof(nullifier, domains[0])
      )
      await derivativeTx.wait()
      expect(await this.scEmailDerivative.nullifiers(nullifier)).to.equal(true)
    })
    it('should check balance of derivative', async function () {
      const domain = domains[0]
      await this.scEmailLedger.mint(getFakeEmailProof(123, domain))
      const balance = await this.scEmailLedger.balanceOf(
        domain,
        this.owner.address
      )
      expect(balance).to.equal(1)
    })
    it('should return 0 if owner does not own a derivative', async function () {
      const domain = domains[0]
      await this.scEmailLedger.mint(getFakeEmailProof(123, domain))
      const balance = await this.scEmailLedger.balanceOf(
        domain,
        this.user.address
      )
      console.log('balance', balance)
      expect(balance).to.equal(0)
    })
    it('should not transfer if the from address is non-zero', async function () {
      await this.scEmailDerivative.mint(getFakeEmailProof(123, domains[0]))
      await expect(
        this.scEmailDerivative.transferFrom(
          this.scEmailDerivative.owner(),
          nonZeroAddress,
          0
        )
      ).to.be.revertedWith('This token is soulbound')
    })
    it('should not mint if the attestor is incorrect', async function () {
      const emailProof = getFakeEmailProof(123, domains[0])
      await expect(
        this.scEmailLedger.mint({
          ...emailProof,
          input: [...emailProof.input.slice(0, -1), invalidAttestorPublicKey],
        })
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the email is incorrect', async function () {
      await expect(
        this.scEmailDerivative.mint(getFakeEmailProof(123, domains[1]))
      ).to.be.revertedWith('This ZK proof is not from the correct email')
    })
    it('should not mint if nullifier has already been used', async function () {
      const nullifier = 123
      await this.scEmailLedger.mint(getFakeEmailProof(nullifier, domains[0]))
      await expect(
        this.scEmailLedger.mint(getFakeEmailProof(nullifier, domains[0]))
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      await this.fakeEmailVerifierContract.mock.verifyProof.returns(false)
      const contract = await this.scEmailLedgerFactory.deploy(
        this.fakeEmailVerifierContract.address,
        attestorPublicKey,
        nonZeroAddress,
        metadataURL,
        this.version
      )
      await expect(
        contract.mint(getFakeEmailProof(123, domains[0]))
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
