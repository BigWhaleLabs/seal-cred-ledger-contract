import {
  Network,
  attestorPublicKey,
  ecdsaPublicKey,
  getEcdsaArguments,
  getFakeBalanceVerifier,
  getFakeBalanceVerifierInput,
  getFakeERC721,
  zeroAddress,
} from './utils'
import { ethers } from 'hardhat'
import { expect } from 'chai'

const mintFunctionSignature =
  'mint(uint256[2],uint256[2][2],uint256[2],uint256[46],bytes,bytes)'

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
        ecdsaPublicKey,
        Network.goerli
      )
      expect(await contract.verifierContract()).to.equal(zeroAddress)
      expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
      expect(await contract.attestorEcdsaPublicKey()).to.equal(ecdsaPublicKey)
      expect(await contract.network()).to.equal(Network.goerli)
    })
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
        attestorPublicKey,
        ecdsaPublicKey,
        Network.mainnet
      )
      await this.contract.deployed()
      this.contract.connect(this.user)
    })
    it.only('should mint with ledger if all the correct info is there', async function () {
      const name = 'MyERC721'
      const symbol = 'ME7'
      // Check the mint transaction
      const tx = await this.contract[mintFunctionSignature](
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeBalanceVerifierInput(
          this.fakeERC721.address,
          Network.mainnet,
          123,
          1
        ),
        ...(await getEcdsaArguments(this.fakeERC721.address, name, symbol))
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
  })
})
