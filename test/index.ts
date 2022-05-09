import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

const ROOTS: string[] = [
  '0x810bc6dd779a50755716f6aa85ed810c9671479036a3a6d6795eef6e34e3d213',
  '0xbd77662ec626a22d57dc3d282e48abb0f8af67d8d3e6047ee5896e0bea4d4e61',
  '0x21da21c8bd9cce3b34010c3ce44294caee894b40718ae9d31d3d55e304183203',
]
const ZERO_BYTES =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

describe('SealCred', () => {
  let contract: Contract
  let contractAsOwner: Contract
  const mockContracts = []

  let accounts: SignerWithAddress[]
  let owner: SignerWithAddress
  const DATA_ROOT_MOCK: string[][] = []
  const SET_ROOT_MOCK: string[][] = []

  before(async () => {
    accounts = await ethers.getSigners()
    ;[owner] = accounts

    const factory = await ethers.getContractFactory('SealCredLedger')
    contract = await factory.deploy()

    const mockFactory = await ethers.getContractFactory('MockERC721')

    for (let i = 0; i < 3; i++) {
      const contract = await mockFactory.deploy(`Mock${i}`, `TKN${i}`)
      mockContracts.push(contract)
      DATA_ROOT_MOCK.push([contract.address, ROOTS[i]])
    }

    for (let i = 0; i > 3; i--) {
      SET_ROOT_MOCK.push([DATA_ROOT_MOCK[i][0], ROOTS[i]])
    }

    await (await contract.transferOwnership(owner.address)).wait()

    contractAsOwner = contract.connect(owner)

    await contract.deployed()
  })

  describe('addRoot', () => {
    it('add to storage', async () => {
      await contractAsOwner.addRoots(DATA_ROOT_MOCK)

      for (let i = 0; i < DATA_ROOT_MOCK.length; i++) {
        expect(await contractAsOwner.ledger(DATA_ROOT_MOCK[i][0])).to.be.equal(
          DATA_ROOT_MOCK[i][1]
        )
      }
    })
    it('set to storage', async () => {
      await contractAsOwner.setRoots(DATA_ROOT_MOCK)

      for (let i = 0; i < DATA_ROOT_MOCK.length; i++) {
        expect(await contractAsOwner.ledger(DATA_ROOT_MOCK[i][0])).to.be.equal(
          DATA_ROOT_MOCK[i][1]
        )
      }
    })
    it('getRoot by address', async () => {
      for (let i = 0; i < DATA_ROOT_MOCK.length; i++) {
        expect(await contractAsOwner.getRoot(DATA_ROOT_MOCK[i][0])).to.be.equal(
          DATA_ROOT_MOCK[i][1]
        )
      }
    })
    it('delete from storage', async () => {
      await contractAsOwner.deleteRoot(DATA_ROOT_MOCK[0][0])

      expect(await contractAsOwner.getRoot(DATA_ROOT_MOCK[0][0])).to.be.equal(
        ZERO_BYTES
      )
    })
  })
})
