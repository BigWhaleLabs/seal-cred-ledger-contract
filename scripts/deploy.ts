import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import prompt from 'prompt'

const regexes = {
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
}

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
    'ExternalSCERC721Ledger',
    'SCERC721Ledger',
    'SCEmailLedger',
  ]
  for (const contractName of contracts) {
    console.log(`Deploying ${contractName}...`)
    const factory = await ethers.getContractFactory(contractName)
    const isExternal = contractName === 'ExternalSCERC721Ledger'
    const isEmail = contractName === 'SCEmailLedger'
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
          default: isEmail
            ? '0xe8c7754340b9f0efe49dfe0f9a47f8f137f70477'
            : '0x842b06545f9dc6a3cce1efd8e4b44095643e3395',
        },
        attestorPublicKey: {
          required: true,
          default:
            '3022588728262621016474471722865235652573366639695808085248430151628770415819',
        },
        network: {
          ask: () => !isEmail,
          required: true,
          enum: ['g', 'm'],
          default: isExternal ? 'm' : 'g',
          description: 'Network: (m)ain, (g)oerli',
        },
        attestorEcdsaAddress: {
          ask: () => isExternal,
          required: true,
          pattern: regexes.ethereumAddress,
          default: '0xb0d7480ac6af8ba423d49554c5b3473201b96fd4',
        },
        forwarder: {
          required: true,
          pattern: regexes.ethereumAddress,
          default: '0x7A95fA73250dc53556d264522150A940d4C50238',
        },
      },
    })
    const constructorArguments = [
      verifierAddress,
      attestorPublicKey,
      forwarder,
    ] as (string | number | prompt.RevalidatorSchema)[]
    if (!isEmail) {
      const networkCode = network === 'g' ? 103 : 109
      constructorArguments.push(networkCode)
      if (isExternal) {
        constructorArguments.push(attestorEcdsaAddress)
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
    console.log(`${contract} deployed and verified on Etherscan!`)
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
