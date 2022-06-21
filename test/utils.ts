import { smock } from '@defi-wonderland/smock'
import { BigNumber, ethers } from 'ethers'

export const zeroAddress = '0x0000000000000000000000000000000000000000'
export const zeroEmail = 'zero@example.com'
export const nonZeroAddress = '0x0000000000000000000000000000000000000001'
export const nonZeroEmail = 'nonzero@example.com'
export const attestorPublicKey = BigNumber.from(
  '13578469780849928704623562188688413596472689853032556827882124682666588837591'
)
export const invalidAttestorPublicKey = BigNumber.from(
  '35964726898530325568278821246826665888375911357846978084992870462356218868841'
)

const MAX_DOMAIN_LENGHT = 90

export async function getFakeERC721Verifier(result: boolean) {
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

export function getFakeERC721() {
  return smock.fake('ERC721')
}

export function getFakeVerifierInput(
  nullifier: number,
  originalContract: string
) {
  return [
    nullifier,
    ...ethers.utils.toUtf8Bytes(originalContract.toLowerCase()),
    attestorPublicKey,
  ]
}
export function getFakeEmailVerifierInput(nullifier: number, domain: string) {
  const domainBytes = padZeroesOnRightUint8(
    ethers.utils.toUtf8Bytes(domain),
    MAX_DOMAIN_LENGHT
  )
  return [nullifier, ...domainBytes, attestorPublicKey]
}

function padZeroesOnRightUint8(array: Uint8Array, length: number) {
  const padding = new Uint8Array(length - array.length)
  return ethers.utils.concat([array, padding])
}
