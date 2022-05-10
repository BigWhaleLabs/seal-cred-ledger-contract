import { ethers, run } from 'hardhat'

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
  } as { [chainId: number]: string }
  const chainName = chains[chainId]
  const SealCred = await ethers.getContractFactory('SealCredLedger')
  const sealCred = await SealCred.deploy()
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

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
