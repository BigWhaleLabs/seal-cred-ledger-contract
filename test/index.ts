import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { smock } from '@defi-wonderland/smock'

const zeroAddress = '0x0000000000000000000000000000000000000000'
const nonZeroAddress = '0x0000000000000000000000000000000000000001'
const attestorPublicKey = BigNumber.from(
  '13578469780849928704623562188688413596472689853032556827882124682666588837591'
)
const invalidAttestorPublicKey = BigNumber.from(
  '135784697808499287046235621886884135'
)

describe('SealCredLedger contract tests', () => {
  before(async function () {
    this.accounts = await ethers.getSigners()
    this.owner = this.accounts[0]
    this.user = this.accounts[1]
    this.factory = await ethers.getContractFactory('SealCredLedger')
  })

  describe('Constructor', function () {
    it('should deploy the contract with the correct fields', async function () {
      const sealCredContractWithIncorrectOwner = await this.factory.deploy(
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
      this.sealCredContractWithIncorrectOwner = await this.factory
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
    const sealCredContract = await this.factory.deploy(
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
      this.fakeVerifierContract = await getFakeVerifier(true)
      this.fakeERC721 = await getFakeERC721()
      this.sealCredContract = await this.factory.deploy(
        this.fakeVerifierContract.address,
        attestorPublicKey
      )
      const derivativeFactory = await ethers.getContractFactory(
        'SCERC721Derivative'
      )
      await this.sealCredContract.deployed()
      this.derivativeContract = await derivativeFactory.deploy(
        this.sealCredContract.address,
        this.fakeERC721.address,
        this.fakeVerifierContract.address,
        attestorPublicKey,
        'fakeERC721 (derivative)',
        'fakeERC721-d'
      )
      this.derivativeContract.connect(this.user)
    })
    it('should mint if all the correct info is there', async function () {
      const sealCredContractAsUser = await this.sealCredContract.connect(
        this.user
      )
      const tx = await sealCredContractAsUser.mint(
        this.fakeERC721.address,
        [1, 2],
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2],
        getFakeVerifierInput(0, this.fakeERC721.address)
      )
      console.log(await this.derivativeContract.owner())

      const transfer = await this.derivativeContract.transferFrom(
        zeroAddress,
        nonZeroAddress,
        0
      )
      console.log(await transfer.wait())
      expect(await tx.wait())
    })
    it('should not transfer', async function () {
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
      await expect(
        this.derivativeContract.transferFrom(zeroAddress, nonZeroAddress, 1)
      )
    })
    it('should not mint if the attestor is incorrect', async function () {
      await expect(
        this.sealCredContract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          [
            0,
            ...ethers.utils.toUtf8Bytes(this.fakeERC721.address.toLowerCase()),
            invalidAttestorPublicKey,
          ]
        )
      ).to.be.revertedWith('This ZK proof is not from the correct attestor')
    })
    it('should not mint if proof has already been used', async function () {
      await expect(
        this.sealCredContract.mint(
          this.fakeERC721.address,
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
      await expect(
        this.sealCredContract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeVerifierInput(0, this.fakeERC721.address)
        )
      ).to.be.revertedWith('This ZK proof has already been used')
    })
    it('should not mint if the zk proof is invalid', async function () {
      const fakeVerifierContract = await getFakeVerifier(false)
      const sealCredContract = await this.factory.deploy(
        fakeVerifierContract.address,
        attestorPublicKey
      )
      await expect(
        sealCredContract.mint(
          this.fakeERC721.address,
          [1, 2],
          [
            [1, 2],
            [3, 4],
          ],
          [1, 2],
          getFakeVerifierInput(0, this.fakeERC721.address)
        )
      ).to.be.revertedWith('Invalid ZK proof')
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
