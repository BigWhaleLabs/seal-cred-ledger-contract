# SealCred Ledger contract

## Usage

1. Clone the repository with `git clone git@github.com:BigWhaleLabs/seal-cred-ledger-contract.git`
2. Install the dependencies with `yarn`
3. Add environment vareables to your `.env` file
4. Run the scripts below

## Environment variables

| Name                         | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `ETHERSCAN_API_KEY`          | Etherscan API key                             |
| `ETH_RPC`                    | Ethereum RPC URL (defaults to @bwl/constants) |
| `CONTRACT_OWNER_PRIVATE_KEY` | Private key of the contract owner             |
| `COINMARKETCAP_API_KEY`      | Coinmarketcap API key                         |

Also check out the `.env.sample` file for more information.

## Available scripts

- `yarn build` — compiles the contract ts interface to the `typechain` directory
- `yarn test` — runs the test suite
- `yarn deploy` — deploys the contract to the network
- `yarn verify-derivatives` — verifies the derivative contracts
- `yarn eth-lint` — runs the linter for the solidity contract
- `yarn lint` — runs all the linters
- `yarn prettify` — prettifies the code in th project
- `yarn release` — relases the `typechain` directory to NPM
