import {
  Network,
  attestorPublicKey,
  constructTokenURI,
  getFakeBalanceProof,
  getFakeBalanceVerifier,
  getFakeERC721,
  invalidAttestorPublicKey,
  metadataURL,
  newMetadataURL,
  nonZeroAddress,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('SCERC721Ledger and SCERC721Derivative contracts tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.scERC721LedgerFactory = await ethers.getContractFactory(
      'SCERC721Ledger'
    )
    this.scERC721DerivativeFactory = await ethers.getContractFactory(
      'SCERC721Derivative'
    )
    this.version = '0.0.1'
  })
  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.scERC721LedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        zeroAddress,
        Network.mainnet,
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
      this.scERC721Ledger = await this.scERC721LedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        nonZeroAddress,
        Network.mainnet,
        metadataURL,
        this.version
      )
      await this.scERC721Ledger.deployed()
      this.contractWithIncorrectOwner = this.scERC721Ledger.connect(this.user)
    })
    it('should have the correct owner', async function () {
      expect(await this.scERC721Ledger.owner()).to.equal(this.owner.address)
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
    const contract = await this.scERC721LedgerFactory.deploy(
      zeroAddress,
      attestorPublicKey,
      nonZeroAddress,
      Network.mainnet,
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
      this.fakeVerifierContract = await getFakeBalanceVerifier(this.owner)
      await this.fakeVerifierContract.mock.verifyProof.returns(true)
      // ERC721
      this.fakeERC721 = await getFakeERC721(this.owner)
      await this.fakeERC721.mock.name.returns('Fake ERC721')
      await this.fakeERC721.mock.symbol.returns('FAKE')
      // Ledger
      this.scERC721Ledger = await this.scERC721LedgerFactory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        nonZeroAddress,
        Network.mainnet,
        metadataURL,
        this.version
      )
      await this.scERC721Ledger.deployed()
      this.scERC721Ledger.connect(this.user)
      // Derivative
      this.scERC721Derivative = await this.scERC721DerivativeFactory.deploy(
        this.scERC721Ledger.address,
        this.fakeERC721.address,
        this.fakeVerifierContract.address,
        attestorPublicKey,
        Network.mainnet,
        'FakeERC721 (derivative)',
        'FAKE-d',
        metadataURL,
        this.version
      )
      await this.scERC721Derivative.deployed()
      this.scERC721Derivative.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      const tx = await this.scERC721Ledger.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      expect(await tx.wait())
    })
    it('should return correct metadata', async function () {
      // Token mint
      const tx = await this.scERC721Derivative.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      await tx.wait()
      // Get the derivative
      const derivativeAddress = this.scERC721Derivative.address
      const tokenURIfromContract = (
        await this.scERC721Derivative.tokenURI(0)
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
      const tx = await this.scERC721Derivative.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      await tx.wait()
      // Get the derivative
      const derivativeAddress = this.scERC721Derivative.address
      // Set specific baseURI for derivaitve
      await this.scERC721Derivative.setBaseURI(newMetadataURL)

      const tokenURIfromContract = (
        await this.scERC721Derivative.tokenURI(0)
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
      const derivativeTx = await this.scERC721Derivative.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      expect(await derivativeTx.wait())
    })
    it('should fail if network is incorrect', async function () {
      await expect(
        this.scERC721Ledger.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1)
        )
      ).to.be.revertedWith('Unexpected network')
    })
    it('should save nullifier correctly', async function () {
      const nullifier = 123
      const derivativeTx = await this.scERC721Derivative.mint(
        getFakeBalanceProof(
          this.fakeERC721.address,
          Network.mainnet,
          nullifier,
          1
        )
      )
      expect(await derivativeTx.wait())
      expect(await this.scERC721Derivative.nullifiers(nullifier)).to.equal(true)
    })
    it('should not transfer if the from address is non-zero', async function () {
      await this.scERC721Derivative.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      await expect(
        this.scERC721Derivative.transferFrom(
          this.scERC721Derivative.owner(),
          nonZeroAddress,
          0
        )
      ).to.be.revertedWith('This token is soulbound')
    })
    it('should not mint if the attestor is incorrect', async function () {
      const balanceInput = getFakeBalanceProof(
        this.fakeERC721.address,
        Network.mainnet,
        123,
        1
      )
      await expect(
        this.scERC721Ledger.mint({
          ...balanceInput,
          input: [...balanceInput.input.slice(0, 5), invalidAttestorPublicKey],
        })
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if the token contract is incorrect', async function () {
      await expect(
        this.scERC721Derivative.mint(
          getFakeBalanceProof(
            '0x399f4a0a9d6E8f6f4BD019340e4d1bE0C9a742F0',
            Network.mainnet,
            123,
            1
          )
        )
      ).to.be.revertedWith(
        'This ZK proof is not from the correct token contract'
      )
    })
    it('should not mint if nullifier has already been used', async function () {
      await this.scERC721Derivative.mint(
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      await expect(
        this.scERC721Derivative.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
        )
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      await this.fakeVerifierContract.mock.verifyProof.returns(false)
      await expect(
        this.scERC721Ledger.mint(
          getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
        )
      ).to.be.revertedWith('Invalid ZK proof')
    })
  })
})
