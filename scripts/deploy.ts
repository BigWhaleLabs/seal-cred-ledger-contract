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
    // 'ExternalSCERC721Ledger',
    // 'SCERC721Ledger',
    'SCEmailLedger',
  ]
  for (const contract of contracts) {
    console.log(`Deploying ${contract}...`)
    const SealCred = await ethers.getContractFactory(contract)
    const isExternal = contract === 'ExternalSCERC721Ledger'
    const parameters = {
      properties: {
        verifierAddress: { required: true },
        attestorPublicKey: { required: true },
        attestorEcdsaAddress: {
          required: true,
          ask: () => isExternal,
        },
        network: {
          required: true,
          ask: () => isExternal,
          enum: ['g', 'm'],
          default: 'g',
          description: 'Network: (m)ain, (g)oerli',
        },
      },
    } as prompt.Schema
    const {
      verifierAddress,
      attestorPublicKey,
      attestorEcdsaAddress,
      network,
    } = await prompt.get(parameters)
    const networkCode = network === 'g' ? 103 : 109
    const sealCred = isExternal
      ? await SealCred.deploy(
          verifierAddress,
          attestorPublicKey,
          attestorEcdsaAddress,
          networkCode
        )
      : await SealCred.deploy(verifierAddress, attestorPublicKey)

    console.log(
      'Deploy tx gas price:',
      utils.formatEther(sealCred.deployTransaction.gasPrice || 0)
    )
    console.log(
      'Deploy tx gas limit:',
      utils.formatEther(sealCred.deployTransaction.gasLimit)
    )
    await sealCred.deployed()
    const address = sealCred.address

    console.log('Contract deployed to:', address)
    console.log('Wait for 1 minute to make sure blockchain is updated')
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

    // Try to verify the contract on Etherscan
    console.log('Verifying contract on Etherscan')
    try {
      await run('verify:verify', {
        address,
        constructorArguments: isExternal
          ? [
              verifierAddress,
              attestorPublicKey,
              attestorEcdsaAddress,
              networkCode,
            ]
          : [verifierAddress, attestorPublicKey],
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
