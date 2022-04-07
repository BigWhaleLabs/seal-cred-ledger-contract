import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const StreetCred = await ethers.getContractFactory('StreetCred')
  const streetCred = await StreetCred.deploy()

  await streetCred.deployed()

  console.log('StreetCred deployed to:', streetCred.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
