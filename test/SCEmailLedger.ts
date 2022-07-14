import {
  attestorPublicKey,
  domains,
  getFakeEmailProof,
  getFakeEmailVerifier,
  invalidAttestorPublicKey,
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
    this.factory = await ethers.getContractFactory('SCEmailLedger')
    this.derivativeFactory = await ethers.getContractFactory(
      'SCEmailDerivative'
    )
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.factory.deploy(zeroAddress, attestorPublicKey)
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
    })
  })

  describe('Owner-only calls from non-owner', function () {
    before(async function () {
      this.contract = await this.factory.deploy(zeroAddress, attestorPublicKey)
      await this.contract.deployed()
      this.contractWithIncorrectOwner = this.contract.connect(this.user)
    })

    it('should have the correct owner', async function () {
      expect(await this.contract.owner()).to.equal(this.owner.address)
    })
    it('should not be able to call setVerifierContract', async function () {
      await expect(
        this.contractWithIncorrectOwner.setVerifierContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not be able to call deleteEmail', async function () {
      await expect(
        this.contractWithIncorrectOwner.deleteEmail(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  it('should set verifier contract', async function () {
    const contract = await this.factory.deploy(zeroAddress, attestorPublicKey)
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
      this.contract = await this.factory.deploy(
        this.fakeEmailVerifierContract.address,
        attestorPublicKey
      )
      await this.contract.deployed()
      this.contract.connect(this.user)
      const domain = domains[0]
      this.derivativeContract = await this.derivativeFactory.deploy(
        this.contract.address,
        domain,
        this.fakeEmailVerifierContract.address,
        attestorPublicKey,
        `@${domain} email`,
        `${domain}-d`
      )
      await this.derivativeContract.deployed()
      this.derivativeContract.connect(this.user)
    })

    it('should mint from the ledger if all the correct info is there', async function () {
      const domain = domains[0]
      const tx = await this.contract.mint(getFakeEmailProof(123, domain))
      expect(await tx.wait())
      // Get the derivative
      const derivativeAddress = await this.contract.emailToDerivativeContract(
        domain
      )
      const derivativeContract = await this.derivativeFactory.attach(
        derivativeAddress
      )
      // Check the derivative variables
      const name: string = await derivativeContract.name()
      const symbol = await derivativeContract.symbol()
      expect(name).to.equal(`@${domain} email`)
      expect(symbol).to.equal(`${domain}-d`)
      // Should be no extra zero bytes
      expect(/\0/g.test(name)).to.be.false
      expect(/\0/g.test(symbol)).to.be.false
    })
    it('should mint from the derivative if all the correct info is there', async function () {
      const derivativeTx = await this.derivativeContract.mint(
        getFakeEmailProof(123, domains[0])
      )
      expect(await derivativeTx.wait())
    })
    it('should save nullifier correctly when minting from derivative', async function () {
      const nullifier = 123
      const derivativeTx = await this.derivativeContract.mint(
        getFakeEmailProof(nullifier, domains[0])
      )
      await derivativeTx.wait()
      expect(await this.derivativeContract.nullifiers(nullifier)).to.equal(true)
    })
    it('should not transfer if the from address is non-zero', async function () {
      this.derivativeContract.mint(getFakeEmailProof(123, domains[0]))
      await expect(
        this.derivativeContract.transferFrom(
          this.derivativeContract.owner(),
          nonZeroAddress,
          0
        )
      ).to.be.revertedWith('This token is soulbound')
    })
    it('should not mint if the attestor is incorrect', async function () {
      const emailProof = getFakeEmailProof(123, domains[0])
      await expect(
        this.contract.mint({
          ...emailProof,
          input: [...emailProof.input.slice(0, -1), invalidAttestorPublicKey],
        })
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the email is incorrect', async function () {
      await expect(
        this.derivativeContract.mint(getFakeEmailProof(123, domains[1]))
      ).to.be.revertedWith('This ZK proof is not from the correct email')
    })
    it('should not mint if nullifier has already been used', async function () {
      const nullifier = 123

      await this.contract.mint(getFakeEmailProof(nullifier, domains[0]))
      await expect(
        this.contract.mint(getFakeEmailProof(nullifier, domains[0]))
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      await this.fakeEmailVerifierContract.mock.verifyProof.returns(false)
      const contract = await this.factory.deploy(
        this.fakeEmailVerifierContract.address,
        attestorPublicKey
      )
      await expect(
        contract.mint(getFakeEmailProof(123, domains[0]))
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
