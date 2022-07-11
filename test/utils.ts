import { BigNumber, Wallet, ethers } from 'ethers'
import { smock } from '@defi-wonderland/smock'

export const zeroAddress = '0x0000000000000000000000000000000000000000'
const emails = ['one@example.com', 'two@example2.com']
export const domains = emails.map((e) => e.split('@')[1])
export const nonZeroAddress = '0x0000000000000000000000000000000000000001'
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

export async function getFakeBalanceVerifier(result: boolean) {
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
          internalType: 'uint256[46]',
          name: 'input',
          type: 'uint256[46]',
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

export async function getFakeEmailVerifier(result: boolean) {
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
  fake.verifyProof.returns(result)
  return fake
}

export function getFakeEmailProof(nullifier: number, domain: string) {
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
  threshold: number
) {
  return {
    a: [1, 2],
    b: [
      [1, 2],
      [3, 4],
    ],
    c: [1, 2],
    input: getFakeBalanceVerifierInput(contract, network, nullifier, threshold),
  }
}

export function getFakeERC721() {
  return smock.fake('ERC721')
}

function getFakeBalanceVerifierInput(
  contract: string,
  network: Network,
  nullifier: number,
  threshold: number
) {
  return [
    ...ethers.utils.toUtf8Bytes(contract.toLowerCase()),
    network,
    nullifier,
    attestorPublicKey,
    threshold,
  ]
}

function getFakeEmailVerifierInput(nullifier: number, domain: string) {
  const domainBytes = padZeroesOnRightUint8(
    ethers.utils.toUtf8Bytes(domain),
    90
  )
  return [...domainBytes, nullifier, attestorPublicKey]
}

export async function getEcdsaArguments(
  network: Network,
  contract: string,
  name: string,
  symbol: string
): Promise<[number[], string]> {
  const data = [
    ...ethers.utils.toUtf8Bytes(contract.toLowerCase()),
    network,
    ...ethers.utils.toUtf8Bytes(name),
    0,
    ...ethers.utils.toUtf8Bytes(symbol),
  ]
  const signature = await signEcdsa(data)
  return [data, signature]
}

function padZeroesOnRightUint8(array: Uint8Array, length: number) {
  const padding = new Uint8Array(length - array.length)
  return ethers.utils.concat([array, padding])
}

function signEcdsa(message: number[]) {
  return ecdsaWallet.signMessage(message)
}
