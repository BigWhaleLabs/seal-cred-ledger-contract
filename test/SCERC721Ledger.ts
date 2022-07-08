import {
  Network,
  attestorPublicKey,
  getFakeBalanceProof,
  getFakeBalanceVerifier,
  getFakeERC721,
  invalidAttestorPublicKey,
  nonZeroAddress,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe.only('SCERC721Ledger and SCERC721Derivative contracts tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('SCERC721Ledger')
    this.derivativeFactory = await ethers.getContractFactory(
      'SCERC721Derivative'
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
      // Verifier
      this.fakeVerifierContract = await getFakeBalanceVerifier(true)
      // ERC721
      this.fakeERC721 = await getFakeERC721()
      // Ledger
      this.contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey
      )
      await this.contract.deployed()
      this.contract.connect(this.user)
      // Derivative
      this.derivativeContract = await this.derivativeFactory.deploy(
        this.contract.address,
        this.fakeERC721.address,
        this.fakeVerifierContract.address,
        attestorPublicKey,
        Network.goerli,
        'FakeERC721 (derivative)',
        'FAKE-d'
      )
      await this.derivativeContract.deployed()
      this.derivativeContract.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      const tx = await this.contract.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
      )
      expect(await tx.wait())
    })
    it('should mint from the derivative if all the correct info is there', async function () {
      const derivativeTx = await this.derivativeContract.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
      )
      expect(await derivativeTx.wait())
    })
    it('should fail if network is incorrect', async function () {
      await expect(
        this.contract.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
        )
      ).to.be.revertedWith('Unexpected network')
    })
    it('should save nullifier correctly', async function () {
      const nullifier = 123
      const derivativeTx = await this.derivativeContract.mint(
        getFakeBalanceProof(
          this.fakeERC721.address,
          Network.goerli,
          nullifier,
          1
        )
      )
      expect(await derivativeTx.wait())
      expect(await this.derivativeContract.nullifiers(nullifier)).to.equal(true)
    })
    it('should not transfer if the from address is non-zero', async function () {
      this.derivativeContract.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
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
      const balanceInput = getFakeBalanceProof(
        this.fakeERC721.address,
        Network.goerli,
        123,
        1
      )
      await expect(
        this.contract.mint({
          ...balanceInput,
          input: [...balanceInput.input.slice(0, -1), invalidAttestorPublicKey],
        })
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the token contract is incorrect', async function () {
      await expect(
        this.derivativeContract.mint(
          getFakeBalanceProof(
            '0x399f4a0a9d6E8f6f4BD019340e4d1bE0C9a742F0',
            Network.goerli,
            123,
            1
          )
        )
      ).to.be.revertedWith(
        'This ZK proof is not from the correct token contract'
      )
    })
    it('should not mint if nullifier has already been used', async function () {
      await this.derivativeContract.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
      )
      await expect(
        this.derivativeContract.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
        )
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      const fakeVerifierContract = await getFakeBalanceVerifier(false)
      const contract = await this.factory.deploy(
        fakeVerifierContract.address,
        attestorPublicKey
      )
      await expect(
        contract.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
        )
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
