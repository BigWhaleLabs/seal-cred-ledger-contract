import type { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

import type {
  SCExternalERC721Ledger,
  SCExternalERC721Ledger__factory,
  Ledger,
  SCERC721Derivative,
  SCERC721Derivative__factory,
  SCERC721Ledger,
  SCERC721Ledger__factory,
  SCEmailDerivative,
  SCEmailDerivative__factory,
  SCEmailLedger,
  SCEmailLedger__factory,
} from '../typechain'

declare module 'mocha' {
  export interface Context {
    // Facoriries for contracts
    SCExternalERC721LedgerFactory: SCExternalERC721Ledger__factory
    scEmailLedgerFactory: SCEmailLedger__factory
    scERC721LedgerFactory: SCERC721Ledger__factory
    scERC721DerivativeFactory: SCERC721Derivative__factory
    scEmailDerivativeFactory: SCEmailDerivative__factory
    // Contract instances
    SCExternalERC721Ledger: SCExternalERC721Ledger
    scEmailLedger: SCEmailLedger
    scERC721Ledger: SCERC721Ledger
    scERC721Derivative: SCERC721Derivative
    scEmailDerivative: SCEmailDerivative
    contractWithIncorrectOwner: Ledger
    // Mock contracts
    fakeVerifierContract: MockContract
    fakeEmailVerifierContract: MockContract
    fakeERC721: MockContract
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
