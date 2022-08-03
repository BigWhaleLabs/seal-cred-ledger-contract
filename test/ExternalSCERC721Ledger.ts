// import {
//   Network,
//   attestorPublicKey,
//   ecdsaAddress,
//   getEcdsaArguments,
//   getFakeBalanceProof,
//   getFakeBalanceVerifier,
//   getFakeERC721,
//   zeroAddress,
// } from './utils'
// import { ethers } from 'hardhat'
// import { expect } from 'chai'

// const mintFunctionSignature =
//   'mint((uint256[2],uint256[2][2],uint256[2],uint256[46]),bytes,bytes)'
// const mintFunctionSignatureWithOnlyProof =
//   'mint((uint256[2],uint256[2][2],uint256[2],uint256[46]))'

// const invalidEcdsaWallet = new ethers.Wallet(
//   '0x3931dc49c2615b436ed233b5f1bcba76cdc352f0318f8886d23f3e524e96a1be'
// )
describe('ExternalSCERC721Ledger contract tests', () => {
  // before(async function () {
  //   this.accounts = await ethers.getSigners()
  //   this.owner = this.accounts[0]
  //   this.user = this.accounts[1]
  //   this.externalSCERC721LedgerFactory = await ethers.getContractFactory(
  //     'ExternalSCERC721Ledger'
  //   )
  //   this.scERC721DerivativeFactory = await ethers.getContractFactory(
  //     'SCERC721Derivative'
  //   )
  // })
  // describe('Constructor', function () {
  //   it('should deploy the contract with the correct fields', async function () {
  //     const contract = await this.externalSCERC721LedgerFactory.deploy(
  //       zeroAddress,
  //       attestorPublicKey,
  //       ecdsaAddress,
  //       Network.goerli
  //     )
  //     expect(await contract.verifierContract()).to.equal(zeroAddress)
  //     expect(await contract.attestorPublicKey()).to.equal(attestorPublicKey)
  //     expect(await contract.attestorEcdsaAddress()).to.equal(ecdsaAddress)
  //     expect(await contract.network()).to.equal(Network.goerli)
  //   })
  // })
  // describe('Minting and derivatives', function () {
  //   beforeEach(async function () {
  //     // Verifier
  //     this.fakeVerifierContract = await getFakeBalanceVerifier(this.owner)
  //     await this.fakeVerifierContract.mock.verifyProof.returns(true)
  //     // ERC721
  //     this.fakeERC721 = await getFakeERC721(this.owner)
  //     // Ledger
  //     this.externalSCERC721Ledger =
  //       await this.externalSCERC721LedgerFactory.deploy(
  //         this.fakeVerifierContract.address,
  //         attestorPublicKey,
  //         ecdsaAddress,
  //         Network.mainnet
  //       )
  //     this.name = 'MyERC721'
  //     this.symbol = 'ME7'
  //     await this.externalSCERC721Ledger.deployed()
  //     this.externalSCERC721Ledger.connect(this.user)
  //   })
  //   it('should mint with ledger if all the correct info is there', async function () {
  //     // Check the mint transaction
  //     const tx = await this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     expect(await tx.wait())
  //     // Get the derivative
  //     const derivativeAddress =
  //       await this.externalSCERC721Ledger.originalContractToDerivativeContract(
  //         this.fakeERC721.address
  //       )
  //     const derivativeContract = await this.scERC721DerivativeFactory.attach(
  //       derivativeAddress
  //     )
  //     // Check the derivative variables
  //     expect(await derivativeContract.name()).to.equal(
  //       `${this.name} (derivative)`
  //     )
  //     expect(await derivativeContract.symbol()).to.equal(`${this.symbol}-d`)
  //   })
  //   it('should mint with ledger if the name and symbol is non-ASCII have characters', async function () {
  //     const name = '‡♦‰ℑℜ¤'
  //     const symbol = '‡♦‰ℑℜ¤'
  //     // Check the mint transaction
  //     const tx = await this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         name,
  //         symbol
  //       ))
  //     )
  //     expect(await tx.wait())
  //     // Get the derivative
  //     const derivativeAddress =
  //       await this.externalSCERC721Ledger.originalContractToDerivativeContract(
  //         this.fakeERC721.address
  //       )
  //     const derivativeContract = await this.scERC721DerivativeFactory.attach(
  //       derivativeAddress
  //     )
  //     // Check the derivative variables
  //     expect(await derivativeContract.name()).to.equal(`${name} (derivative)`)
  //     expect(await derivativeContract.symbol()).to.equal(`${symbol}-d`)
  //   })
  //   it('should not mint without ecdsa signature', async function () {
  //     const contract = await this.externalSCERC721LedgerFactory.deploy(
  //       this.fakeVerifierContract.address,
  //       attestorPublicKey,
  //       ecdsaAddress,
  //       Network.mainnet
  //     )
  //     // Check the mint transaction
  //     const tx = contract[mintFunctionSignatureWithOnlyProof](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1)
  //     )
  //     await expect(tx).to.be.revertedWith(
  //       'Mint with ECDSA signature should be used'
  //     )
  //   })
  //   it('should not mint with ledger if the proof is incorrect', async function () {
  //     await this.fakeVerifierContract.mock.verifyProof.returns(false)
  //     const contract = await this.externalSCERC721LedgerFactory.deploy(
  //       this.fakeVerifierContract.address,
  //       attestorPublicKey,
  //       ecdsaAddress,
  //       Network.mainnet
  //     )
  //     // Check the mint transaction
  //     const tx = contract[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('Invalid ZK proof')
  //   })
  //   it('should not mint with ledger if the nullifier is incorrect', async function () {
  //     // Check the mint transaction
  //     await this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('This ZK proof has already been used')
  //   })
  //   it('should not mint with ledger if the name is empty', async function () {
  //     // Check the mint transaction
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         '',
  //         this.symbol
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('Zero name length')
  //   })
  //   it('should not mint with ledger if the symbol is empty', async function () {
  //     // Check the mint transaction
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         this.fakeERC721.address,
  //         this.name,
  //         ''
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('Zero symbol length')
  //   })
  //   it('should not mint with ledger if the attestor public key is incorrect', async function () {
  //     // Check the mint transaction
  //     const ecdsaInput = await getEcdsaArguments(
  //       Network.mainnet,
  //       this.fakeERC721.address,
  //       this.name,
  //       this.symbol
  //     )
  //     ecdsaInput[1] = await invalidEcdsaWallet.signMessage(ecdsaInput[0])
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...ecdsaInput
  //     )
  //     await expect(tx).to.be.revertedWith('Wrong attestor public key')
  //   })
  //   it('should not mint with ledger if the signature key is incorrect', async function () {
  //     // Check the mint transaction
  //     const ecdsaInput = await getEcdsaArguments(
  //       Network.mainnet,
  //       this.fakeERC721.address,
  //       this.name,
  //       this.symbol
  //     )
  //     // Corrupt the signature
  //     ecdsaInput[1] =
  //       '0x' + ecdsaInput[1].split('').reverse().join('').slice(0, 2)
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...ecdsaInput
  //     )
  //     await expect(tx).to.be.revertedWith(
  //       'Error while verifying the ECDSA signature'
  //     )
  //   })
  //   it('should not mint with ledger if the network is incorrect', async function () {
  //     // Check the mint transaction
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.goerli, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.goerli,
  //         this.fakeERC721.address,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('Wrong network')
  //   })
  //   it('should not mint with ledger if the token address is incorrect', async function () {
  //     // Check the mint transaction
  //     const tx = this.externalSCERC721Ledger[mintFunctionSignature](
  //       getFakeBalanceProof(this.fakeERC721.address, Network.mainnet, 123, 1),
  //       ...(await getEcdsaArguments(
  //         Network.mainnet,
  //         zeroAddress,
  //         this.name,
  //         this.symbol
  //       ))
  //     )
  //     await expect(tx).to.be.revertedWith('Wrong token address')
  //   })
  // })
})
