import { expect } from 'chai'
import { utils } from 'ethers'
import { ethers } from 'hardhat'
import {
  zeroAddress,
  attestorPublicKey,
  invalidAttestorPublicKey,
  nonZeroAddress,
  getFakeERC721,
  getFakeERC721Verifier,
  getFakeERC721VerifierInput,
  getNullifier,
  // eslint-disable-next-line node/no-missing-import
} from './utils'

describe('SealCredERC721Ledger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('SealCredERC721Ledger')
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

    it('should not be able to call deleteOriginalContract', async function () {
      await expect(
        this.contractWithIncorrectOwner.deleteOriginalContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  it('should set verifier contract', async function () {
    const contract = await this.factory.deploy(zeroAddress, attestorPublicKey)
    await contract.deployed()
    expect(await contract.verifierContract()).to.equal(zeroAddress)
    const newVerifierAddress = this.accounts[1].address
    await contract.setVerifierContract(newVerifierAddress)
    expect(await contract.verifierContract()).to.equal(newVerifierAddress)
  })

  describe('Minting and derivatives', function () {
    beforeEach(async function () {
      this.fakeVerifierContract = await getFakeERC721Verifier(true)
      this.fakeERC721 = await getFakeERC721()
      this.contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey
      )
      const derivativeFactory = await ethers.getContractFactory(
        'SCERC721Derivative'
      )
      await this.contract.deployed()
      this.derivativeContract = await derivativeFactory.deploy(
        this.contract.address,
        this.fakeERC721.address,
        this.fakeVerifierContract.address,
        attestorPublicKey,
        'fakeERC721 (derivative)',
        'fakeERC721-d'
      )
      this.derivativeContract.connect(this.user)
    })
    it('should mint if all the correct info is there', async function () {
      const sealCredContractAsUser = await this.contract.connect(this.user)
      const tx = await sealCredContractAsUser.mint(
        this.fakeERC721.address,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(
          utils.toUtf8Bytes(getNullifier()),
          this.fakeERC721.address
        )
      )

      const derivativeTx = await this.derivativeContract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(
          utils.toUtf8Bytes(getNullifier()),
          this.fakeERC721.address
        )
      )

      expect(await tx.wait())
      expect(await derivativeTx.wait())
    })
    it('should save nullifier correctly', async function () {
      const contractAsUser = await this.contract.connect(this.user)
      const nullifier = getNullifier()
      const bytesNullifier = utils.toUtf8Bytes(nullifier)
      const hexNullifier = utils.hexlify(bytesNullifier)

      const tx = await contractAsUser.mint(
        this.fakeERC721.address,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(bytesNullifier, this.fakeERC721.address)
      )
      const derivativeTx = await this.derivativeContract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(bytesNullifier, this.fakeERC721.address)
      )
      await tx.wait()
      await derivativeTx.wait()

      expect(await this.derivativeContract.nullifiers(hexNullifier)).to.equal(
        true
      )
    })
    it('should not transfer if the from address is non-zero', async function () {
      this.derivativeContract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(
          utils.toUtf8Bytes(getNullifier()),
          this.fakeERC721.address
        )
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
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          [
            ...utils.toUtf8Bytes(getNullifier()),
            ...ethers.utils.toUtf8Bytes(this.fakeERC721.address.toLowerCase()),
            invalidAttestorPublicKey,
          ]
        )
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the token contract is incorrect', async function () {
      await expect(
        this.contract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          [
            ...utils.toUtf8Bytes(getNullifier()),
            ...ethers.utils.toUtf8Bytes(zeroAddress.toLowerCase()),
            attestorPublicKey,
          ]
        )
      ).to.be.revertedWith(
        'This ZK proof is not from the correct token contract'
      )
    })
    it('should not mint if nullifier has already been used', async function () {
      const nullifierBytes = utils.toUtf8Bytes(getNullifier())
      await this.contract.mint(
        this.fakeERC721.address,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeERC721VerifierInput(nullifierBytes, this.fakeERC721.address)
      )
      await expect(
        this.contract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeERC721VerifierInput(nullifierBytes, this.fakeERC721.address)
        )
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      const fakeVerifierContract = await getFakeERC721Verifier(false)
      const contract = await this.factory.deploy(
        fakeVerifierContract.address,
        attestorPublicKey
      )
      await expect(
        contract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeERC721VerifierInput(
            utils.toUtf8Bytes(getNullifier()),
            this.fakeERC721.address
          )
        )
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})