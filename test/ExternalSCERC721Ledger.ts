import {
  Network,
  attestorPublicKey,
  ecdsaAddress,
  getEcdsaArguments,
  getFakeBalanceProof,
  getFakeBalanceVerifier,
  getFakeERC721,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const mintFunctionSignature =
  'mint((uint256[2],uint256[2][2],uint256[2],uint256[46]),bytes,bytes)'

describe('ExternalSCERC721Ledger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('ExternalSCERC721Ledger')
    this.derivativeFactory = await ethers.getContractFactory(
      'SCERC721Derivative'
    )
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const contract = await this.factory.deploy(
        zeroAddress,
        attestorPublicKey,
        ecdsaAddress,
        Network.goerli
      )
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
      expect(await contract.attestorEcdsaAddress()).to.equal(ecdsaAddress)
      expect(await contract.network()).to.equal(Network.goerli)
    })
  })

  describe('Minting and derivatives', function () {
    before(async function () {
      // Verifier
      this.fakeVerifierContract = await getFakeBalanceVerifier(true)
      // ERC721
      this.fakeERC721 = await getFakeERC721()
      // Ledger
      this.contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        ecdsaAddress,
        Network.mainnet
      )
      this.name = 'MyERC721'
      this.symbol = 'ME7'

      await this.contract.deployed()
      this.contract.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      // Check the mint transaction
      const tx = await this.contract[mintFunctionSignature](
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
      const derivativeAddress =
        await this.contract.originalContractToDerivativeContract(
          this.fakeERC721.address
        )
      const derivativeContract = await this.derivativeFactory.attach(
        derivativeAddress
      )
      // Check the derivative variables
      expect(await derivativeContract.name()).to.equal(this.name)
      expect(await derivativeContract.symbol()).to.equal(this.symbol)
    })
    it('should not mint with ledger if the proof is incorrect', async function () {
      const fakeVerifierContract = await getFakeBalanceVerifier(false)
      const contract = await this.factory.deploy(
        fakeVerifierContract.address,
        attestorPublicKey,
        ecdsaAddress,
        Network.mainnet
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
      const tx = this.contract[mintFunctionSignature](
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
    it('should not mint with ledger if the attestor public key is incorrect', async function () {
      // Check the mint transaction
      const contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        ecdsaAddress,
        Network.mainnet
      )
      const escdsArguments = await getEcdsaArguments(
        Network.mainnet,
        this.fakeERC721.address,
        this.name,
        this.symbol
      )
      escdsArguments[1] =
        '0xa8c82c90702fa8da5c3c102fe55f79f25543d3c11f3fde4de0f06953d8efa8410a19d9f3408d8cb9a54c3471fbba51390391df0fb430e77afd4979fe5458b2781b'
      // Check the mint transaction
      const tx = contract[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 1234, 1),
        ...escdsArguments
      )
      await expect(tx).to.be.revertedWith('Wrong attestor public key')
    })
    it('should not mint with ledger if the network is incorrect', async function () {
      // Check the mint transaction
      const contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        ecdsaAddress,
        Network.mainnet
      )
      const tx = contract[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 12345, 1),
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
      const contract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey,
        ecdsaAddress,
        Network.mainnet
      )
      const tx = contract[mintFunctionSignature](
        getFakeBalanceProof(
          this.fakeERC721.address,
          Network.mainnet,
          123456,
          1
        ),
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
