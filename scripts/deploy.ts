import { ethers, run } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  // Deploy the contract
  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())
  const StreetCred = await ethers.getContractFactory('StreetCredLedger')
  const streetCred = await StreetCred.deploy()
  console.log('Deploy tx gas price:', streetCred.deployTransaction.gasPrice)
  console.log('Deploy tx gas limit:', streetCred.deployTransaction.gasLimit)
  await streetCred.deployed()
  const address = streetCred.address
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
  console.log('StreetCred Ledger deployed and verified on Etherscan!')
  console.log('Contract address:', address)
  console.log(
    'Etherscan URL:',
    `https://ropsten.etherscan.io/address/${address}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
