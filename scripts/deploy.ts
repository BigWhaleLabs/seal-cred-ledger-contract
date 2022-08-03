import { ethers, run } from 'hardhat'
import { utils } from 'ethers'
import prompt from 'prompt'

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
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
  const Lib = await ethers.getContractFactory('ParseAddress')
  const lib = await Lib.deploy()
  await lib.deployed()
  for (const contract of contracts) {
    console.log(`Deploying ${contract}...`)
    const factory = await ethers.getContractFactory(contract, {
      libraries: {
        ParseAddress: lib.address,
      },
    })
    const isExternal = contract === 'ExternalSCERC721Ledger'
    const parameters = {
      properties: {
        verifierAddress: { required: true },
        forwarder: { required: true },
        attestorPublicKey: {
          required: true,
          default:
            '3022588728262621016474471722865235652573366639695808085248430151628770415819',
        },
        attestorEcdsaAddress: {
          required: true,
          default: '0xb0d7480ac6af8ba423d49554c5b3473201b96fd4',
        },
        network: {
          required: true,
          enum: ['g', 'm'],
          description: 'Network: (m)ain, (g)oerli',
        },
      },
    } as prompt.Schema
    const {
      verifierAddress,
      forwarder,
      attestorPublicKey,
      attestorEcdsaAddress,
      network,
    } = await prompt.get(parameters)
    const networkCode = network === 'g' ? 103 : 109
    let currentContract
    let constructorArguments
    switch (contract) {
      case 'ExternalSCERC721Ledger':
        constructorArguments = [
          verifierAddress,
          attestorPublicKey,
          networkCode,
          attestorEcdsaAddress,
          forwarder,
        ]
        currentContract = await factory.deploy(...constructorArguments)
        break
      case 'SCERC721Ledger':
        constructorArguments = [
          verifierAddress,
          attestorPublicKey,
          network,
          forwarder,
        ]
        currentContract = await factory.deploy(...constructorArguments)
        break
      case 'SCEmailLedger':
        constructorArguments = [verifierAddress, attestorPublicKey, forwarder]
        currentContract = await factory.deploy(...constructorArguments)
        break
      default:
        break
    }

    console.log(
      'Deploy tx gas price:',
      utils.formatEther(currentContract.deployTransaction.gasPrice || 0)
    )
    console.log(
      'Deploy tx gas limit:',
      utils.formatEther(currentContract.deployTransaction.gasLimit)
    )
    await currentContract.deployed()
    const address = currentContract.address

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
