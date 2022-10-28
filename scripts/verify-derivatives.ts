import {
  ATTESTOR_PUBLIC_KEY,
  BALANCE_VERIFIER_CONTRACT_ADDRESS,
  EMAIL_VERIFIER_CONTRACT_ADDRESS,
  FARCASTER_VERIFIER_CONTRACT_ADDRESS,
  SC_EMAIL_LEDGER_CONTRACT_ADDRESS,
  SC_ERC721_LEDGER_CONTRACT_ADDRESS,
  SC_FARCASTER_LEDGER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { cwd } from 'process'
import { readdirSync } from 'fs'
import { resolve } from 'path'
import { run } from 'hardhat'
import { version } from '../package.json'
import prompt from 'prompt'

const regexes = {
  email:
    /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/,
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

async function main() {
  const contractNames = readdirSync(resolve(cwd(), 'contracts'))
    .map((s) => s.substring(0, s.length - 4))
    .filter((s) => s.includes('Derivative'))
  for (const verifierContractName of contractNames) {
    console.log(`Verifying ${verifierContractName}...`)
    const isEmail = verifierContractName.includes('Email')
    const isFarcaster = verifierContractName.includes('Farcaster')
    const email = 'bwl.gg'
    const {
      address,
      ledgerAddress,
      origin,
      verifierAddress,
      attestorPublicKey,
      originalNetwork,
      tokenName,
      tokenSymbol,
      baseURI,
      contractVersion,
    } = await prompt.get({
      properties: {
        address: {
          required: true,
          pattern: regexes.ethereumAddress,
          message: `Contract address for ${verifierContractName}`,
        },
        ledgerAddress: {
          required: true,
          pattern: regexes.ethereumAddress,
          message: `Ledger address for ${verifierContractName}`,
          default: isEmail
            ? SC_EMAIL_LEDGER_CONTRACT_ADDRESS
            : isFarcaster
            ? SC_FARCASTER_LEDGER_CONTRACT_ADDRESS
            : SC_ERC721_LEDGER_CONTRACT_ADDRESS,
        },
        origin: {
          required: true,
          pattern: isEmail ? regexes.email : regexes.ethereumAddress,
          ask: () => !isFarcaster,
          message: `${
            isEmail ? 'Domain' : 'Original contract'
          } for ${verifierContractName}`,
          default: isEmail
            ? email
            : '0x508C58996E46B10b093F9F4EaD6ab3416e73f3a1',
        },
        verifierAddress: {
          required: true,
          pattern: regexes.ethereumAddress,
          message: `Verifier address for ${verifierContractName}`,
          default: isEmail
            ? EMAIL_VERIFIER_CONTRACT_ADDRESS
            : isFarcaster
            ? FARCASTER_VERIFIER_CONTRACT_ADDRESS
            : BALANCE_VERIFIER_CONTRACT_ADDRESS,
        },
        attestorPublicKey: {
          required: true,
          message: `Attestor public key for ${verifierContractName}`,
          default: ATTESTOR_PUBLIC_KEY,
        },
        originalNetwork: {
          required: true,
          ask: () => !isEmail && !isFarcaster,
          enum: ['g', 'm'],
          default: 'g',
          description: `Network: (m)ain, (g)oerli — for ${verifierContractName}`,
        },
        tokenName: {
          required: true,
          ask: () => !isFarcaster,
          description: `Token name for ${verifierContractName}`,
          default: isEmail ? `@${email} email` : 'StrawberryFrens (derivative)',
        },
        tokenSymbol: {
          required: true,
          ask: () => !isFarcaster,
          description: `Token symbol for ${verifierContractName}`,
          default: isEmail ? `${email}-d` : 'STRW-d',
        },
        baseURI: {
          required: true,
          description: `Base URI for ${verifierContractName}`,
          default: 'https://metadata.sealcred.xyz/metadata',
        },
        contractVersion: {
          required: true,
          description: `Contract version`,
          default: version,
        },
      },
    })
    try {
      await run('verify:verify', {
        address,
        constructorArguments: isEmail
          ? [
              ledgerAddress,
              origin,
              verifierAddress,
              attestorPublicKey,
              tokenName,
              tokenSymbol,
              baseURI,
              contractVersion,
            ]
          : isFarcaster
          ? [
              ledgerAddress,
              verifierAddress,
              attestorPublicKey,
              baseURI,
              contractVersion,
            ]
          : [
              ledgerAddress,
              origin,
              verifierAddress,
              attestorPublicKey,
              originalNetwork === 'g' ? 103 : 109,
              tokenName,
              tokenSymbol,
              baseURI,
              contractVersion,
            ],
      })
    } catch (err) {
      console.log(
        'Error verifiying contract on Etherscan:',
        err instanceof Error ? err.message : err
      )
    }
    console.log(`${verifierContractName} verified on Etherscan!`)
    console.log('Contract address:', address)
    console.log(
      'Etherscan URL:',
      `https://goerli.etherscan.io/address/${address}`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
