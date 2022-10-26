import {
  Network,
  attestorPublicKey,
  constructTokenURI,
  ecdsaAddress,
  getEcdsaArguments,
  getFakeBalanceProof,
  getFakeBalanceVerifier,
  getFakeERC721,
  metadataURL,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { splitSignature } from 'ethers/lib/utils'

const mintFunctionSignature =
  'mint((uint256[2],uint256[2][2],uint256[2],uint256[6]),bytes,bytes32,bytes32)'
const mintFunctionSignatureWithOnlyProof =
  'mint((uint256[2],uint256[2][2],uint256[2],uint256[6]))'

const invalidEcdsaWallet = new ethers.Wallet(
  '0x3931dc49c2615b436ed233b5f1bcba76cdc352f0318f8886d23f3e524e96a1be'
)
describe('SCExternalERC721Ledger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.SCExternalERC721LedgerFactory = await ethers.getContractFactory(
      'SCExternalERC721Ledger'
    )
    this.scERC721DerivativeFactory = await ethers.getContractFactory(
      'SCERC721Derivative'
    )
    this.version = '0.0.1'
  })
  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.SCExternalERC721LedgerFactory.deploy(
        zeroAddress,
        attestorPublicKey,
        zeroAddress,
        Network.mainnet,
        ecdsaAddress,
        metadataURL,
        this.version
      )
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
      expect(await contract.getTrustedForwarder()).to.equal(zeroAddress)
      expect(await contract.attestorEcdsaAddress()).to.equal(ecdsaAddress)
      expect(await contract.baseURI()).to.equal(metadataURL)
      expect(await contract.version()).to.equal(this.version)
      expect(await contract.network()).to.equal(Network.mainnet)
    })
  })
  describe('Minting and derivatives', function () {
    beforeEach(async function () {
      // Verifier
      this.fakeVerifierContract = await getFakeBalanceVerifier(this.owner)
      await this.fakeVerifierContract.mock.verifyProof.returns(true)
      // ERC721
      this.fakeERC721 = await getFakeERC721(this.owner)
      // Ledger
      this.SCExternalERC721Ledger =
        await this.SCExternalERC721LedgerFactory.deploy(
          this.fakeVerifierContract.address,
          attestorPublicKey,
          zeroAddress,
          Network.mainnet,
          ecdsaAddress,
          metadataURL,
          this.version
        )
      this.name = 'MyERC721'
      this.symbol = 'ME7'
      await this.SCExternalERC721Ledger.deployed()
      this.SCExternalERC721Ledger.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      // Check the mint transaction
      const tx = await this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      expect(await tx.wait())
      // Get the derivative
      const derivativeAddress = await this.SCExternalERC721Ledger.getDerivative(
        this.fakeERC721.address.toLowerCase()
      )
      const derivativeContract =
        this.scERC721DerivativeFactory.attach(derivativeAddress)
      // Check the derivative variables
      expect(await derivativeContract.name()).to.equal(
        `${this.name} (derivative)`
      )
      expect(await derivativeContract.symbol()).to.equal(`${this.symbol}-d`)
    })
    it('should return correct metadata', async function () {
      // Token mint
      const tx = await this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      await tx.wait()
      // Get the derivative
      const derivativeAddress = await this.SCExternalERC721Ledger.getDerivative(
        this.fakeERC721.address.toLowerCase()
      )
      const derivativeContract =
        this.scERC721DerivativeFactory.attach(derivativeAddress)
      const tokenURIfromContract = (
        await derivativeContract.tokenURI(0)
      ).toLowerCase()
      const expectedTokenURI = constructTokenURI(
        metadataURL,
        derivativeAddress,
        0
      )
      // Check the tokenURI
      expect(tokenURIfromContract).to.equal(expectedTokenURI)
    })
    it('should mint with ledger if the name and symbol is non-ASCII have characters', async function () {
      const name = '‡♦‰ℑℜ¤'
      const symbol = '‡♦‰ℑℜ¤'
      // Check the mint transaction
      const tx = await this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          name,
          symbol
        ))
      )
      expect(await tx.wait())
      // Get the derivative
      const derivativeAddress =
        await this.SCExternalERC721Ledger.originalToDerivative(
          this.fakeERC721.address.toLowerCase()
        )
      const derivativeContract =
        this.scERC721DerivativeFactory.attach(derivativeAddress)
      // Check the derivative variables
      expect(await derivativeContract.name()).to.equal(`${name} (derivative)`)
      expect(await derivativeContract.symbol()).to.equal(`${symbol}-d`)
    })
    it('should check balance of derivative', async function () {
      await this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      const balance = await this.SCExternalERC721Ledger.balanceOf(
        this.fakeERC721.address.toLocaleLowerCase(),
        this.owner.address
      )
      expect(balance).to.equal(1)
    })
    it('should not mint without ecdsa signature', async function () {
      const contract = await this.SCExternalERC721LedgerFactory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        zeroAddress,
        Network.mainnet,
        ecdsaAddress,
        metadataURL,
        this.version
      )
      // Check the mint transaction
      const tx = contract[mintFunctionSignatureWithOnlyProof](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
      )
      await expect(tx).to.be.revertedWith(
        'Mint with ECDSA signature should be used'
      )
    })
    it('should not mint with ledger if the proof is incorrect', async function () {
      await this.fakeVerifierContract.mock.verifyProof.returns(false)
      const contract = await this.SCExternalERC721LedgerFactory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        zeroAddress,
        Network.mainnet,
        ecdsaAddress,
        metadataURL,
        this.version
      )
      // Check the mint transaction
      const tx = contract[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      await expect(tx).to.be.revertedWith('Invalid ZK proof')
    })
    it('should not mint with ledger if the nullifier is incorrect', async function () {
      // Check the mint transaction
      await this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      await expect(tx).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint with ledger if the name is empty', async function () {
      // Check the mint transaction
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          '',
          this.symbol
        ))
      )
      await expect(tx).to.be.revertedWith('Zero name length')
    })
    it('should not mint with ledger if the symbol is empty', async function () {
      // Check the mint transaction
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          this.fakeERC721.address,
          this.name,
          ''
        ))
      )
      await expect(tx).to.be.revertedWith('Zero symbol length')
    })
    it('should not mint with ledger if the attestor public key is incorrect', async function () {
      // Check the mint transaction
      const ecdsaInput = await getEcdsaArguments(
        Network.mainnet,
        this.fakeERC721.address,
        this.name,
        this.symbol
      )
      const sig = splitSignature(
        await invalidEcdsaWallet.signMessage(ecdsaInput[0])
      )
      ecdsaInput[1] = sig.r
      ecdsaInput[2] = sig.yParityAndS
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...ecdsaInput
      )
      await expect(tx).to.be.revertedWith('Wrong attestor public key')
    })
    it('should not mint with ledger if the signature key is incorrect', async function () {
      // Check the mint transaction
      const ecdsaInput = await getEcdsaArguments(
        Network.mainnet,
        this.fakeERC721.address,
        this.name,
        this.symbol
      )
      // Corrupt the signature
      ecdsaInput[1] =
        '0x' +
        ecdsaInput[1]
          .split('')
          .reverse()
          .join('')
          .substring(0, ecdsaInput[1].length - 2)
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...ecdsaInput
      )
      await expect(tx).to.be.revertedWith(
        'Error while verifying the ECDSA signature'
      )
    })
    it('should not mint with ledger if the network is incorrect', async function () {
      // Check the mint transaction
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1),
        ...(await getEcdsaArguments(
          Network.goerli,
          this.fakeERC721.address,
          this.name,
          this.symbol
        ))
      )
      await expect(tx).to.be.revertedWith('Wrong network')
    })
    it('should not mint with ledger if the token address is incorrect', async function () {
      // Check the mint transaction
      const tx = this.SCExternalERC721Ledger[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
        ...(await getEcdsaArguments(
          Network.mainnet,
          zeroAddress,
          this.name,
          this.symbol
        ))
      )
      await expect(tx).to.be.revertedWith('Wrong token address')
    })
  })
})
