import {
  ATTESTOR_ECDSA_ADDRESS,
  ATTESTOR_PUBLIC_KEY,
  BALANCE_VERIFIER_CONTRACT_ADDRESS,
  EMAIL_VERIFIER_CONTRACT_ADDRESS,
  FARCASTER_VERIFIER_CONTRACT_ADDRESS,
  GSN_FORWARDER_CONTRACT_ADDRESS,
} from '@big-whale-labs/constants'
import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import { version } from '../package.json'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

const baseURI = 'https://metadata.sealcred.xyz'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)
  console.log(
    'Account balance:',
    utils.formatEther(await deployer.getBalance())
  )
  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]
  const contracts = [
    {
      contractName: 'SCFarcasterLedger',
      defaultVerifierAddress: FARCASTER_VERIFIER_CONTRACT_ADDRESS,
    },
    {
      contractName: 'SCEmailLedger',
      defaultVerifierAddress: EMAIL_VERIFIER_CONTRACT_ADDRESS,
    },
    {
      contractName: 'SCERC721Ledger',
      defaultVerifierAddress: BALANCE_VERIFIER_CONTRACT_ADDRESS,
    },
    {
      contractName: 'SCExternalERC721Ledger',
      defaultVerifierAddress: BALANCE_VERIFIER_CONTRACT_ADDRESS,
    },
  ]
  for (const { contractName, defaultVerifierAddress } of contracts) {
    console.log(`Deploying ${contractName}...`)
    const factory = await ethers.getContractFactory(contractName)
    const isExternal = contractName === 'SCExternalERC721Ledger'
    const isEmail = contractName === 'SCEmailLedger'
    const isFarcaster = contractName === 'SCFarcasterLedger'
    const {
      verifierAddress,
      attestorPublicKey,
      network,
      attestorEcdsaAddress,
      forwarder,
    } = await prompt.get({
      properties: {
        verifierAddress: {
          required: true,
          pattern: regexes.ethereumAddress,
          default: defaultVerifierAddress,
        },
        attestorPublicKey: {
          required: true,
          default: ATTESTOR_PUBLIC_KEY,
        },
        network: {
          ask: () => !isEmail && !isFarcaster,
          required: true,
          enum: ['g', 'm'],
          default: isExternal ? 'm' : 'g',
          description: 'Network: (m)ain, (g)oerli',
        },
        attestorEcdsaAddress: {
          ask: () => isExternal,
          required: true,
          pattern: regexes.ethereumAddress,
          default: ATTESTOR_ECDSA_ADDRESS,
        },
        forwarder: {
          required: true,
          pattern: regexes.ethereumAddress,
          default: GSN_FORWARDER_CONTRACT_ADDRESS,
        },
        baseURI: {
          required: true,
          default: baseURI,
        },
      },
    })
    const constructorArguments = [
      verifierAddress,
      attestorPublicKey,
      forwarder,
      baseURI,
      version,
    ] as (string | number | prompt.RevalidatorSchema)[]
    if (!isEmail && !isFarcaster) {
      const networkCode = network === 'g' ? 103 : 109
      constructorArguments.splice(3, 0, networkCode)
      if (isExternal) {
        constructorArguments.splice(4, 0, attestorEcdsaAddress)
      }
    }
    const contract = await factory.deploy(...constructorArguments)
    console.log(
      'Deploy tx gas price:',
      utils.formatEther(contract.deployTransaction.gasPrice || 0)
    )
    console.log(
      'Deploy tx gas limit:',
      utils.formatEther(contract.deployTransaction.gasLimit)
    )
    await contract.deployed()
    const address = contract.address

    console.log('Contract deployed to:', address)
    console.log('Wait for 1 minute to make sure blockchain is updated')
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

    // Try to verify the contract on Etherscan
    console.log('Verifying contract on Etherscan')

    try {
      await run('verify:verify', {
        address,
        constructorArguments,
      })
    } catch (err) {
      console.log(
        'Error verifiying contract on Etherscan:',
        err instanceof Error ? err.message : err
      )
    }

    // Print out the information
    console.log(`${contractName} deployed and verified on Etherscan!`)
    console.log('Contract address:', address)
    console.log(
      'Etherscan URL:',
      `https://${
        chainName !== 'mainnet' ? `${chainName}.` : ''
      }etherscan.io/address/${address}`
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
