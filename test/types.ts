import type { FakeContract } from '@defi-wonderland/smock'
import type { MockContract } from 'ethereum-waffle'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

import type {
  ExternalSCERC721Ledger,
  ExternalSCERC721Ledger__factory,
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
    externalSCERC721LedgerFactory: ExternalSCERC721Ledger__factory
    scEmailLedgerFactory: SCEmailLedger__factory
    scERC721LedgerFactory: SCERC721Ledger__factory
    scERC721DerivativeFactory: SCERC721Derivative__factory
    scEmailDerivativeFactory: SCEmailDerivative__factory
    // Contract instances
    externalSCERC721Ledger: ExternalSCERC721Ledger
    scEmailLedger: SCEmailLedger
    scERC721Ledger: SCERC721Ledger
    scERC721Derivative: SCERC721Derivative
    scEmailDerivative: SCEmailDerivative
    // Mock contracts
    fakeVerifierContract: MockContract
    fakeEmailVerifierContract: MockContract
    fakeERC721: FakeContract
    // Signers
    accounts: SignerWithAddress[]
    owner: SignerWithAddress
    user: SignerWithAddress
  }
}
