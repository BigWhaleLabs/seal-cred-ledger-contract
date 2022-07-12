import { cwd } from 'process'
import { readdirSync } from 'fs'
import { resolve } from 'path'
import { run } from 'hardhat'
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
    if (!isEmail) {
      continue
    }
    const {
      address,
      ledgerAddress,
      domainOrOriginalContract,
      verifierAddress,
      attestorPublicKey,
      originalNetwork,
      tokenName,
      tokenSymbol,
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
            ? '0xAc32705DF9713bB4c7F2BEf65be10D4DB6c53D3B'
            : undefined,
        },
        domainOrOriginalContract: {
          required: true,
          pattern: isEmail ? regexes.email : regexes.ethereumAddress,
          message: `${
            isEmail ? 'Domain' : 'Original contract'
          } for ${verifierContractName}`,
          default: isEmail ? 'bwl.gg' : undefined,
        },
        verifierAddress: {
          required: true,
          pattern: regexes.ethereumAddress,
          message: `Verifier address for ${verifierContractName}`,
          default: isEmail
            ? '0xE8c7754340B9f0Efe49DFE0f9a47F8f137F70477'
            : '0x842B06545f9dc6a3cCe1eFD8e4B44095643e3395',
        },
        attestorPublicKey: {
          required: true,
          message: `Attestor public key for ${verifierContractName}`,
          default:
            '3022588728262621016474471722865235652573366639695808085248430151628770415819',
        },
        originalNetwork: {
          required: true,
          ask: () => !isEmail,
          enum: ['g', 'm'],
          default: 'g',
          description: `Network: (m)ain, (g)oerli — for ${verifierContractName}`,
        },
        tokenName: {
          required: true,
          description: `Token name for ${verifierContractName}`,
          default: isEmail ? '@bwl.gg email' : '',
        },
        tokenSymbol: {
          required: true,
          description: `Token symbol for ${verifierContractName}`,
          default: isEmail ? 'bwl.gg-d' : '',
        },
      },
    })
    try {
      await run('verify:verify', {
        address,
        constructorArguments: isEmail
          ? [
              ledgerAddress,
              domainOrOriginalContract,
              verifierAddress,
              attestorPublicKey,
              tokenName,
              tokenSymbol,
            ]
          : [
              ledgerAddress,
              domainOrOriginalContract,
              verifierAddress,
              attestorPublicKey,
              originalNetwork,
              tokenName,
              tokenSymbol,
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
