import { expect } from 'chai'
import { ethers } from 'hardhat'
import {
  zeroAddress,
  zeroEmail,
  attestorPublicKey,
  invalidAttestorPublicKey,
  nonZeroAddress,
  getFakeEmailVerifier,
  getFakeVerifierInput,
  getFakeEmailVerifierInput,
  // eslint-disable-next-line node/no-missing-import
} from './utils'

describe('SealCredEmailLedger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('SealCredEmailLedger')
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contractWithIncorrectOwner = await this.factory.deploy(
        zeroAddress,
        attestorPublicKey
      )
      expect(await contractWithIncorrectOwner.verifierContract()).to.equal(
        zeroAddress
      )
      expect(await contractWithIncorrectOwner.attestorPublicKey()).to.equal(
        attestorPublicKey
      )
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
    before(async function () {
      this.fakeEmailVerifierContract = await getFakeEmailVerifier(true)
      this.contract = await this.factory.deploy(
        this.fakeEmailVerifierContract.address,
        attestorPublicKey
      )
      const derivativeFactory = await ethers.getContractFactory(
        'SCEmailDerivative'
      )
      this.derivativeContract = await derivativeFactory.deploy(
        this.contract.address,
        zeroEmail,
        this.fakeEmailVerifierContract.address,
        attestorPublicKey,
        'fakeEmail (derivative)',
        'fakeEmail-d'
      )
      this.derivativeContract.connect(this.user)
      await this.contract.deployed()
    })
    it('should mint if all the correct info is there', async function () {
      const contractAsUser = await this.contract.connect(this.user)
      // console.log(getFakeEmailVerifierInput(0, zeroEmail)[91])
      const tx = await contractAsUser.mint(
        zeroEmail,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeEmailVerifierInput(0, zeroEmail)
      )

      const derivativeTx = await this.derivativeContract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeEmailVerifierInput(0, zeroEmail)
      )

      expect(await tx.wait())
      expect(await derivativeTx.wait())
    })
    it('should not transfer if the from address is non-zero', async function () {
      this.derivativeContract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeVerifierInput(0, zeroEmail)
      )
      await expect(
        this.derivativeContract.transferFrom(
          this.derivativeContract.owner(),
          nonZeroAddress,
          0
        )
      ).to.be.revertedWith('This token is soulbound')
    })
    it('should not mint if the attestor is incorrect', async function () {
      await expect(
        this.contract.mint(
          zeroEmail,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          [
            0,
            ...ethers.utils.toUtf8Bytes(zeroEmail.toLowerCase()),
            invalidAttestorPublicKey,
          ]
        )
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the token contract is incorrect', async function () {
      await expect(
        this.contract.mint(
          zeroEmail,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          [
            0,
            ...ethers.utils.toUtf8Bytes(zeroAddress.toLowerCase()),
            attestorPublicKey,
          ]
        )
      ).to.be.revertedWith(
        'This ZK proof is not from the correct token contract'
      )
    })
    it('should not mint if nullifier has already been used', async function () {
      await this.contract.mint(
        zeroEmail,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeVerifierInput(0, zeroEmail)
      )
      await expect(
        this.contract.mint(
          zeroEmail,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeVerifierInput(0, zeroEmail)
        )
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      const fakeEmailVerifierContract = await getFakeEmailVerifier(false)
      const contract = await this.factory.deploy(
        fakeEmailVerifierContract.address,
        attestorPublicKey
      )
      await expect(
        contract.mint(
          zeroEmail,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeVerifierInput(0, zeroEmail)
        )
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
