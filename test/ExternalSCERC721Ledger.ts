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

describe('ExternalSCERC721Ledger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('ExternalSCERC721Ledger')
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
      const tx = await this.contract.mint(
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeBalanceVerifierInput(
          this.fakeERC721.address,
          Network.goerli,
          123,
          1
        ),
        ...getEcdsaArguments(this.fakeERC721.address, 'MyERC721', 'ME7')
      )
      expect(await tx.wait())
    })
    // it('should mint from the derivative if all the correct info is there', async function () {
    //   const derivativeTx = await this.derivativeContract.mint(
    //     [1, 2],
    //     [
    //       [1, 2],
    //       [3, 4],
    //     ],
    //     [1, 2],
    //     getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', 123, 1)
    //   )
    //   expect(await derivativeTx.wait())
    // })
    // it('should fail if network is incorrect', async function () {
    //   expect(
    //     this.contract.mint(
    //       [1, 2],
    //       [
    //         [1, 2],
    //         [3, 4],
    //       ],
    //       [1, 2],
    //       getFakeBalanceVerifierInput(this.fakeERC721.address, 'm', 123, 1)
    //     )
    //   ).to.be.revertedWith('Unexpected network')
    // })
    // it('should save nullifier correctly', async function () {
    //   const nullifier = 123
    //   const derivativeTx = await this.derivativeContract.mint(
    //     [1, 2],
    //     [
    //       [1, 2],
    //       [3, 4],
    //     ],
    //     [1, 2],
    //     getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', nullifier, 1)
    //   )
    //   expect(await derivativeTx.wait())
    //   expect(await this.derivativeContract.nullifiers(nullifier)).to.equal(true)
    // })
    // it('should not transfer if the from address is non-zero', async function () {
    //   this.derivativeContract.mint(
    //     [1, 2],
    //     [
    //       [1, 2],
    //       [3, 4],
    //     ],
    //     [1, 2],
    //     getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', 123, 1)
    //   )
    //   await expect(
    //     this.derivativeContract.transferFrom(
    //       this.derivativeContract.owner(),
    //       nonZeroAddress,
    //       0
    //     )
    //   ).to.be.revertedWith('This token is soulbound')
    // })
    // it('should not mint if the attestor is incorrect', async function () {
    //   const input = getFakeBalanceVerifierInput(
    //     this.fakeERC721.address,
    //     'g',
    //     123,
    //     1
    //   )
    //   await expect(
    //     this.contract.mint(
    //       [1, 2],
    //       [
    //         [1, 2],
    //         [3, 4],
    //       ],
    //       [1, 2],
    //       [...input.slice(0, -1), invalidAttestorPublicKey]
    //     )
    //   ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    // })
    // it('should not mint if the token contract is incorrect', async function () {
    //   await expect(
    //     this.derivativeContract.mint(
    //       [1, 2],
    //       [
    //         [1, 2],
    //         [3, 4],
    //       ],
    //       [1, 2],
    //       getFakeBalanceVerifierInput(
    //         '0x399f4a0a9d6E8f6f4BD019340e4d1bE0C9a742F0',
    //         'g',
    //         123,
    //         1
    //       )
    //     )
    //   ).to.be.revertedWith(
    //     'This ZK proof is not from the correct token contract'
    //   )
    // })
    // it('should not mint if nullifier has already been used', async function () {
    //   await this.derivativeContract.mint(
    //     [1, 2],
    //     [
    //       [1, 2],
    //       [3, 4],
    //     ],
    //     [1, 2],
    //     getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', 123, 1)
    //   )
    //   await expect(
    //     this.derivativeContract.mint(
    //       [1, 2],
    //       [
    //         [1, 2],
    //         [3, 4],
    //       ],
    //       [1, 2],
    //       getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', 123, 1)
    //     )
    //   ).to.be.revertedWith('This ZK proof has already been used')
    // })
    // it('should not mint if the zk proof is invalid', async function () {
    //   const fakeVerifierContract = await getFakeBalanceVerifier(false)
    //   const contract = await this.factory.deploy(
    //     fakeVerifierContract.address,
    //     attestorPublicKey
    //   )
    //   await expect(
    //     contract.mint(
    //       [1, 2],
    //       [
    //         [1, 2],
    //         [3, 4],
    //       ],
    //       [1, 2],
    //       getFakeBalanceVerifierInput(this.fakeERC721.address, 'g', 123, 1)
    //     )
    //   ).to.be.revertedWith('Invalid ZK proof')
    // })
  })
})
