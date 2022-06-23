import { ethers, run } from 'hardhat'

const prompt = require('prompt-sync')()

async function main() {
  const [deployer] = await ethers.getSigners()

  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  const chains = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
  } as { [chainId: number]: string }
  const chainName = chains[chainId]

  const contracts = ['SealCredERC721Ledger', 'SealCredEmailLedger']
  for (const contract of contracts) {
    console.log(`Deploying ${contract}...`)
    const SealCred = await ethers.getContractFactory(contract)
    const verifierAddress = prompt('Enter Verifier contract address: ')
    if (verifierAddress == null || verifierAddress === '')
      throw Error('Verifier contract address invalid')
    const attestorPublicKey = prompt('Enter Attestor public key: ')
    if (attestorPublicKey == null || attestorPublicKey === '')
      throw Error('Attestor public key invalid')
    const sealCred = await SealCred.deploy(verifierAddress, attestorPublicKey)

    console.log('Deploy tx gas price:', sealCred.deployTransaction.gasPrice)
    console.log('Deploy tx gas limit:', sealCred.deployTransaction.gasLimit)
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
        constructorArguments: [verifierAddress, attestorPublicKey],
      })
    } catch (err) {
      console.log('Error verifiying contract on Etherscan:', err)
    }

    // Print out the information
    console.log('SealCred Ledger deployed and verified on Etherscan!')
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
