# GnosisDAO — Safe Token Distribution

GnosisDAO received 15% of the total Safe Token supply, vesting over 4 years. These tokens continuously vest to GnosisDAO, and this tool is responsible for distributing these tokens to GNO holders. The distributions for each address are calculated daily, and vested tokens are made available to claim monthly. [GIP and discussion can be read here](https://forum.gnosis.io/t/gip-64-should-gnosisdao-distribute-safe-tokens-to-incentivize-decentralizing-gnosis-chain/5896).

This repo contains the codebases for the distribution contracts, the scripts for claiming and calculating distributions, and the web app used by GNO holders to claim tokens.

**_Note:_** Token distributions will not be available until the Safe Token is made transferable, and the Distribution contracts are deployed.

# Architecture

## `claim-gui`

This is a React app that allows you to connect a wallet, view claimed and unclaimed tokens, and submit transactions to claim any available tokens. This app is live here -> [https://safe-distro.gnosis.io](https://safe-distro.gnosis.io)

## `tooling`

This directory contains the distribution contract code as well as the scripts that run periodically to calculate distributions and disburse tokens to the contracts

### Distribution Contracts

The distribution contracts contain the tokens available for claiming, and the authorization logic (via MerkleTree/MerkleRoot) that grants whitelisted addresses a certain amount of tokens.

When a distribution executes, it funds these contracts (one on Mainnet, one on Gnosis Chain), and updates their internal MerkleRoot storage variable.

[Contract audit available here](/tooling/contracts/audits/SafeTokenDistributionNov2022.pdf).

### Scripts

#### `Schedule`

A json file containing a list of pairs (`blockNumberMainnet`, `blockNumberGnosis`). This file determines how allocation snapshots are taken. It has an entry for each day passed since VestingInception. [The current schedule file can be found here](tooling/_harvest/schedule.json).

For each past **VestingSlice** (~1 day) we select a block at random, and insert it into schedule.json, the task is called `schedule:expand`:

- Get all past daily intervals since **VestingInception**
  - `VestingInception` is the block where `VestingId` was created
- For every interval not yet present in the schedule:
  - Generate a random block falling within that interval on mainnet
  - Get closest matching block on gnosis-chain
  - Insert pair into schedule

#### `Allocations`

For each entry in the schedule, two allocation snapshots will be written - mainnet and gnosis. [Allocations can be viewed here](tooling/_harvest/allocations).

Each allocation file contains a map of balances that represent quantities of SAFE tokens allocated in a VestingSlice. A slice is comprised by the blocks between two schedule entries, and it considers:

- `Balances`: retrieved by querying subgraphs at blockHeight
- `totalVested`: `eth_call` at block height for `vestingPool.calculateVestedAmount(...)`

#### `Checkpoints`

A checkpoint file is an accumulation of allocations (simple sum). It represents the absolute quantity of SAFE tokens allocated to a certain address at a certain block.

Generating a checkpoint at blockNumber/latest:

- Filter the schedule for entries older than blockNumber:
  - For all filtered entries, load corresponding allocation file
  - Sum/Accumulate loaded allocations
  - Result is a list of pairs [address, balance]
  - Build a MerkleTree where the above pairs are the leaves

### **_What's Running_**

We use scheduled Github Actions to run all the above scripts. [They are defined here](.github/workflows).

#### Every Day: Harvet

The Harvest task runs everyday and it combines the tasks:

- `schedule:expand`
- `allocation:all`

It progressively selects random blocks, and calculates respective allocations, commiting the results back to the repo.

#### Every Month: Distribute

**_Note_**: The monthly task will skip execution if the distribution contracts are not deployed.

This task:

- Creates a new distribution
- Updates authorization setup

##### Creating New Distribution

- Creates two new checkpoints (mainnet and gnosis chain)
- Creates MerkleTrees out of the new checkpoints and commits to disk

##### Updating Authorization Setup

This posts two transactions - one in mainnet and one in gc - to the respective Gnosis Treasury Safes:

- **TreasurySafe Mainnet**:
  - `multisendEncode` of:
    - Tx that claims the tokens from the `VestingPool`
    - Tx that funds `MerkleDistroMainnet` with SAFE
    - Tx that funds `MerkleDistroGnosis` with SAFE, via **OmniBridge**
    - Tx that updates the merkleRoot in `MerkleDistroMainnet`
- **TreasurySafe Gnosis**:
  - Tx that updates the merkleRoot in `MerkleDistroGnosis`

# Running Locally

## Deploying Distribution Contracts

To deploy the MerkleDistro.sol contract:

- copy `.env.template` to `.env` and fill with valid keys and a mnemonic that resolves to a funded account
- run
  ```
  yarn run deploy-distros
  yarn run verify-distros
  ```

**_Note_**: The deploy will fail if SafeToken not yet deloyed and bridged to Gnosis Chain

## Calculating Allocations

### For a single vesting slice

- run `yarn hardhat allocate:one [blockNumber]`

### All Allocations (up to now)

- run `yarn hardhat allocate:all --lazy false`
