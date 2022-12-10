import { BalanceProofStruct } from 'typechain/contracts/SCExternalERC721Ledger'
import { BigNumber, Wallet, ethers } from 'ethers'
import { EmailProofStruct } from 'typechain/contracts/SCEmailLedger'
import { FarcasterProofStruct } from 'typechain/contracts/SCFarcasterDerivative'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { splitSignature } from 'ethers/lib/utils'
import { waffle } from 'hardhat'

export const zeroAddress = '0x0000000000000000000000000000000000000000'
const emails = ['one@example.com', 'two@example2.com']
export const domains = emails.map((e) => e.split('@')[1])
export const nonZeroAddress = '0x0000000000000000000000000000000000000001'
export const metadataURL = 'https://metadata.sealcred.xyz/metadata'
export const newMetadataURL = 'https://metadata-v2.sealcred.xyz/metadata'
export const attestorPublicKey = BigNumber.from(
  '13578469780849928704623562188688413596472689853032556827882124682666588837591'
)
export const invalidAttestorPublicKey = BigNumber.from(
  '35964726898530325568278821246826665888375911357846978084992870462356218868841'
)
const ecdsaWallet = new Wallet(
  '0xc22d0fdda8dd97029978419bc67b2daf7a8827c507506d1a997ac52bd56e97b8'
)

export const ecdsaAddress = ecdsaWallet.address

export enum Network {
  goerli = 103,
  mainnet = 109,
}

export async function getFakeBalanceVerifier(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
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
          internalType: 'uint256[8]',
          name: 'input',
          type: 'uint256[8]',
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
}

export async function getFakeEmailVerifier(signer: SignerWithAddress) {
  const fake = await waffle.deployMockContract(signer, [
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
          internalType: 'uint256[92]',
          name: 'input',
          type: 'uint256[92]',
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
  return fake
}

export async function getFakeFarcasterVerifier(signer: SignerWithAddress) {
  const fake = await waffle.deployMockContract(signer, [
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
          internalType: 'uint256[11]',
          name: 'input',
          type: 'uint256[12]',
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
  return fake
}

export function getFakeEmailProof(
  nullifier: number,
  domain: string
): EmailProofStruct {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: getFakeEmailVerifierInput(nullifier, domain),
  }
}

export function getFakeBalanceProof(
  contract: string,
  network: Network,
  nullifier: number,
  threshold: number,
  sealHubCommitment: number | string
): BalanceProofStruct {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: getFakeBalanceVerifierInput(
      contract,
      network,
      nullifier,
      threshold,
      sealHubCommitment
    ),
  }
}

export function getFakeFarcasterProof(nullifier: number): FarcasterProofStruct {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: getFakeFarcasterVerifierInput(nullifier),
  }
}

export async function getFakeERC721(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}

export async function getFakeSealHub(signer: SignerWithAddress) {
  return await waffle.deployMockContract(signer, [
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'merkleRoot',
          type: 'bytes32',
        },
      ],
      name: 'isCommitmentMerkleRootValid',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ])
}
//   '0x00',
//   '0x1ebac3b4f3b3a815349c507043cb77bb92d5b4128afb913752043d990a1646bd',
//   '0x00',
//   '0x722B0676F457aFe13e479eB2a8A4De88BA15B2c6',
//   '0x67',
//   '0x01'
function getFakeBalanceVerifierInput(
  contract: string,
  network: Network,
  nullifier: number,
  threshold: number,
  sealHubCommitment: number | string,
  type = 0,
  tokenId = 0
) {
  return [
    type,
    BigNumber.from(contract.toLowerCase()),
    tokenId,
    network,
    threshold,
    BigNumber.from(sealHubCommitment),
    nullifier,
    attestorPublicKey,
  ]
}

function getFakeFarcasterVerifierInput(nullifier: number, type = 0) {
  return [
    type,
    ...ethers.utils.toUtf8Bytes('farcaster'),
    nullifier,
    attestorPublicKey,
  ]
}

function getFakeEmailVerifierInput(nullifier: number, domain: string) {
  const domainBytes = padZeroesOnRightUint8(
    ethers.utils.toUtf8Bytes(domain),
    90
  )
  return [...domainBytes, nullifier, attestorPublicKey]
}
// 0x50fb338d16773120c91f7c8435411c5618e6c98341b6fb5130c802b879874a9c
export async function getEcdsaArguments(
  network: Network,
  contract: string,
  name: string,
  symbol: string
): Promise<[number[], string, string]> {
  const data = [
    ...ethers.utils.toUtf8Bytes(contract.toLowerCase()),
    network,
    ...ethers.utils.toUtf8Bytes(name),
    0,
    ...ethers.utils.toUtf8Bytes(symbol),
  ]
  const signature = await signEcdsa(data)
  const { r, yParityAndS } = splitSignature(signature)
  return [data, r, yParityAndS]
}

function padZeroesOnRightUint8(array: Uint8Array, length: number) {
  const padding = new Uint8Array(length - array.length)
  return ethers.utils.concat([array, padding])
}

function signEcdsa(message: number[]) {
  return ecdsaWallet.signMessage(message)
}

export function constructTokenURI(
  baseURI: string,
  contractAddress: string,
  tokenId: string | number
) {
  return `${baseURI}/${contractAddress}/${tokenId}`.toLowerCase()
}
