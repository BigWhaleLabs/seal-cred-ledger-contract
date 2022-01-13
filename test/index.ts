import { expect } from 'chai'
import { ethers } from 'hardhat'

const dataMock = {
  userAddress: '0x829bd824b016326a401d083b33d092293333a830',
  contractAddress: '0x829bd824b016326a401d083b33d092293333a830',
  ownedItemIds: [0, 1, 2, 3],
}

/*
// Tuple mock
[
  ["0x829bd824b016326a401d083b33d092293333a830", "0x829bd824b016326a401d083b33d092293333a830", [0, 1, 2, 3]],
  ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", [0, 1, 2, 3, 4, 5, 6]]
]
*/

describe('StreetCred', () => {
  let StreetCred: any
  let streetCred: any
  let owner: any
  let addr1: any

  beforeEach(async () => {
    StreetCred = await ethers.getContractFactory('StreetCred')
    ;[owner, addr1] = await ethers.getSigners()

    streetCred = await StreetCred.deploy()
  })

  describe('Storage', () => {
    it('Should write data to the storage', async () => {
      const addItemTx = await streetCred.addItem([dataMock])

      expect(addItemTx.confirmations).to.equal(1)
    })
    it('Writed data should exist in storage', async () => {
      const item = await streetCred.getItem(dataMock.userAddress)

      expect(item).to.equal(dataMock)
    })
  })
})
