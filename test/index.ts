import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'

const ADDRESS_MOCK = '0x6079dcdfb2aff3ec70ed233baa2a5ce665e59b3b'
const ROOT_MOCK =
  '0x810bc6dd779a50755716f6aa85ed810c9671479036a3a6d6795eef6e34e3d213'

describe('StreetCred', () => {
  let contract: Contract

  beforeEach(async () => {
    const factory = await ethers.getContractFactory('StreetCredLedger')
    contract = await factory.deploy()
    await contract.deployed()
    await contract.setRoot(ADDRESS_MOCK, ROOT_MOCK)
  })

  describe('Storage', () => {
    it('Write to storage', async () => {
      expect(await contract.setRoot(ADDRESS_MOCK, ROOT_MOCK))
    })
    it('Get from storage', async () => {
      const item = await contract.getRoot(ADDRESS_MOCK)

      expect(item).to.equal(ROOT_MOCK)
    })
    it('Delete from storage', async () => {
      expect(await contract.deleteRoot(ADDRESS_MOCK))
    })
  })
})
