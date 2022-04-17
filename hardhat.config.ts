import * as dotenv from 'dotenv'
import { cleanEnv, str } from 'envalid'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

dotenv.config()

const { CONTRACT_OWNER_PRIVATE_KEY, ROPSTEN_RPC_URL, ETHERSCAN_API_KEY } =
  cleanEnv(process.env, {
    CONTRACT_OWNER_PRIVATE_KEY: str(),
    ROPSTEN_RPC_URL: str(),
    ETHERSCAN_API_KEY: str(),
  })

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  networks: {
    ropsten: {
      url: ROPSTEN_RPC_URL,
      accounts: [CONTRACT_OWNER_PRIVATE_KEY],
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'ETH',
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: 'typechain',
  },
}

export default config
