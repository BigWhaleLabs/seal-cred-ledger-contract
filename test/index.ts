import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { smock } from '@defi-wonderland/smock'

const zeroAddress = '0x0000000000000000000000000000000000000000'
const attestorPublicKey = BigNumber.from(
  '13578469780849928704623562188688413596472689853032556827882124682666588837591'
)

describe('SealCredLedger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const factory = await ethers.getContractFactory('SealCredLedger')
      const sealCredContractWithIncorrectOwner = await factory.deploy(
        zeroAddress,
        attestorPublicKey
      )
      expect(
        await sealCredContractWithIncorrectOwner.verifierContract()
      ).to.equal(zeroAddress)
      expect(
        await sealCredContractWithIncorrectOwner.attestorPublicKey()
      ).to.equal(attestorPublicKey)
    })
  })

  describe('Owner-only calls from non-owner', function () {
    beforeEach(async function () {
      const factory = await ethers.getContractFactory('SealCredLedger')
      this.sealCredContractWithIncorrectOwner = await factory
        .connect(this.accounts[1])
        .deploy(zeroAddress, attestorPublicKey)
      await this.sealCredContractWithIncorrectOwner.deployed()
    })
    it('should have the correct owner', async function () {
      expect(await this.sealCredContractWithIncorrectOwner.owner()).to.equal(
        this.accounts[1].address
      )
    })
    it('should not be able to call setVerifierContract', async function () {
      await expect(
        this.sealCredContractWithIncorrectOwner
          .connect(this.owner)
          .setVerifierContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should not be able to call deleteOriginalContract', async function () {
      await expect(
        this.sealCredContractWithIncorrectOwner
          .connect(this.owner)
          .deleteOriginalContract(zeroAddress)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  it('should set verifier contract', async function () {
    const factory = await ethers.getContractFactory('SealCredLedger')
    const sealCredContract = await factory.deploy(
      zeroAddress,
      attestorPublicKey
    )
    await sealCredContract.deployed()
    expect(await sealCredContract.verifierContract()).to.equal(zeroAddress)
    const newVerifierAddress = this.accounts[1].address
    await sealCredContract.setVerifierContract(newVerifierAddress)
    expect(await sealCredContract.verifierContract()).to.equal(
      newVerifierAddress
    )
  })

  describe('Minting and derivatives', function () {
    beforeEach(async function () {
      const factory = await ethers.getContractFactory('SealCredLedger')
      this.fakeVerifierContract = await getFakeVerifier(true)
      this.sealCredContract = await factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey
      )
      await this.sealCredContract.deployed()
      this.fakeERC721 = await getFakeERC721()
    })
    it('should mint if all the correct info is there', async function () {
      expect(
        await this.sealCredContract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeVerifierInput(0, this.fakeERC721.address)
        )
      ).to.emit(this.sealCredContract, 'Mint')
    })
  })
})

async function getFakeVerifier(result: boolean) {
  const fake = await smock.fake([
    {
      inputs: [
        {
          internalType: 'uint256[2]',
          name: 'a',
          type: 'uint256[2]',
        },
        {
          internalType: 'uint256[2][2]',
          name: 'b',
          type: 'uint256[2][2]',
        },
        {
          internalType: 'uint256[2]',
          name: 'c',
          type: 'uint256[2]',
        },
        {
          internalType: 'uint256[44]',
          name: 'input',
          type: 'uint256[44]',
        },
      ],
      name: 'verifyProof',
      outputs: [
        {
          internalType: 'bool',
          name: 'r',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ])
  fake.verifyProof.returns(result)
  return fake
}

function getFakeERC721() {
  return smock.fake('ERC721')
}

function getFakeVerifierInput(nullifier: number, originalContract: string) {
  return [
    nullifier,
    ...ethers.utils.toUtf8Bytes(originalContract.toLowerCase()),
    attestorPublicKey,
  ]
}
