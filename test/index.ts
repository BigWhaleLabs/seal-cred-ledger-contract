import { expect } from 'chai'
import { ethers } from 'hardhat'
import { StreetCred } from '../typechain'

const ADDRESS_MOCK = '0x6079dcdfb2aff3ec70ed233baa2a5ce665e59b3b'
const ROOT_MOCK =
  '0x810bc6dd779a50755716f6aa85ed810c9671479036a3a6d6795eef6e34e3d213'

describe('StreetCred', () => {
  let contract: StreetCred

  beforeEach(async () => {
    const factory = await ethers.getContractFactory('StreetCred')
    contract = await factory.deploy()
    await contract.deployed()

    await contract.addRoot(ADDRESS_MOCK, ROOT_MOCK)
  })

  describe('Storage', () => {
    it('Write to storage', async () => {
      expect(await contract.addRoot(ADDRESS_MOCK, ROOT_MOCK))
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
