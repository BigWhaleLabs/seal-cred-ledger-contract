import {
  Network,
  attestorPublicKey,
  ecdsaAddress,
  getEcdsaArguments,
  getFakeBalanceProof,
  getFakeBalanceVerifier,
  getFakeBalanceVerifierInput,
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
      await this.contract.deployed()
      this.contract.connect(this.user)
    })
    it('should mint with ledger if all the correct info is there', async function () {
      const name = 'MyERC721'
      const symbol = 'ME7'
      // Check the mint transaction
      const tx = await this.contract[mintFunctionSignature](
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
        await this.contract.originalContractToDerivativeContract(
          this.fakeERC721.address
        )
      const derivativeContract = await this.derivativeFactory.attach(
        derivativeAddress
      )
      // Check the derivative variables
      expect(await derivativeContract.name()).to.equal(name)
      expect(await derivativeContract.symbol()).to.equal(symbol)
    })
    it('should not mint with ledger if the proof is incorrect', async function () {
      const name = 'MyERC721'
      const symbol = 'ME7'
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
          name,
          symbol
        ))
      )
      await expect(tx).to.be.revertedWith('Invalid ZK proof')
    })
    it.skip('should not mint with ledger if the signature is incorrect', async function () {
      const name = 'MyERC721'
      const symbol = 'ME7'
      // Check the mint transaction
      const tx = this.contract[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 1234, 1),
        ...(await getEcdsaArguments(Network.mainnet, '0x0', name, symbol))
      )
      await expect(tx).to.be.revertedWith(
        'Error while verifying the ECDSA signature'
      )
    })
    it('should not mint with ledger if the attestor public key is incorrect', async function () {
      const name = 'MyERC721'
      const symbol = 'ME7'
      // Check the mint transaction
      const tx = this.contract[mintFunctionSignature](
        getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 12345, 1),
        ...(await getEcdsaArguments(Network.mainnet, '0x0', name, symbol))
      )
      await expect(tx).to.be.revertedWith('Wrong attestor public key')
    })
  })
})
