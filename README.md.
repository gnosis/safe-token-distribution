# GnosisDAO — Safe Token Distribution

GnosisDAO received 15% of the total SAFE Token supply, vesting over 4 years. These tokens continuously vest to GnosisDAO, and this tool is responsible for distributing these tokens to GNO holders. The distributions for each address are calculated daily, and vested tokens are made available to claim monthly. [GIP and discussion can be read here](https://forum.gnosis.io/t/gip-64-should-gnosisdao-distribute-safe-tokens-to-incentivize-decentralizing-gnosis-chain/5896).

This repo contains the codebases for the distribution contracts, the scripts for claiming and calculating distributions, and the web app used by GNO holders to claim tokens.

**_Note:_** Token distributions will not be available until the SAFE Token is made transferable, and the Distribution contracts are deployed. However, daily harvests are live, and can already be inspected. Once SAFE is unpaused, and MerkleDistros deployed, distributions will automatically start happening monthly.

# Architecture

## `claim-gui`

This is a React app that allows you to connect a wallet, view claimed and unclaimed tokens, and submit transactions to claim any available tokens. This app is live here -> [http://claim-safe.gnosis.io/](http://claim-safe.gnosis.io/)

## `tooling`

This directory contains the distribution contract code as well as the scripts that run periodically to calculate distributions and disburse tokens to the contracts.

### Distribution Contracts

The distribution contracts contain the tokens available for claiming, and the authorization logic (via MerkleTree/MerkleRoot) that grants whitelisted addresses a certain amount of tokens.

When a distribution runs, it funds these contracts (one on mainnet, one on gnosis), and updates their internal MerkleRoot storage variable.

[Contract audit available here](/tooling/contracts/audits/SafeTokenDistributionNov2022.pdf).

### Scripts

#### `Schedule`

A json file containing a list of pairs (`blockNumberMainnet`, `blockNumberGnosis`). This file determines how allocation snapshots are taken. It has an entry for each day passed since VestingInception. [The current schedule file can be found here](tooling/_harvest/schedule.json).

For each past **VestingSlice** (~1 day) we select a block at random, and insert it into schedule.json. This random block becomes the upper boundary of the slice.

The task that progressively expands schedule is called `schedule:expand`:

- Get all past daily intervals since **VestingInception**
  - `VestingInception` is the block where `VestingId` was created
- For every interval not yet represented in the schedule:
  - Generate a random mainnet blockNumber that falls within the interval
  - Get the closest matching blockNumber on gnosis
  - Insert pair into schedule

#### `Allocations`

For each VestingSlice, two allocation files will be written one for mainnet and one for gnosis. [Allocations can be viewed here](tooling/_harvest/allocations).

Each allocation file contains a map of addresses to amounts, and it represents the quantities of SAFE allocated to an address in a VestingSlice.

The allocation formula inputs:

- `balancesGNO`: retrieved by querying subgraphs at blockHeight
- `totalAmountVested`: the total amount of tokens vested out of the VestingPool during a VestingSlice. Retrieved by directly calling the VestingPool contract at the respective block heights.

Formula for amount allocated to an address during a slice:

```
allocation[address] = balancesGNO[address] / sum(balancesGNO) * totalAmountVested
```

#### `Checkpoints`

A checkpoint file is an accumulation of allocations (simple sum). It's a map of addresses to balances, and it represents the absolute amount of SAFE tokens allocated to an address, up to a certain point. We can generate checkpoints at any arbitrary block by summing all prior allocations:

For a given blockNumber (or latest):

- Filter the schedule for entries older than blockNumber:
- Load corresponding allocation file
- Sum/Accumulate allocations
- Result is a map of addresses to balances
- Transform the map into list of pairs [address, balance]
- Build a MerkleTree with the pairs as leaves

### **_What's Running_**

We use scheduled Github Actions to run all the above scripts. [They are defined here](.github/workflows).

#### Every Day: Harvest

The Harvest task runs everyday and it combines the tasks:

- `schedule:expand`
- `allocation:all`

It keeps expanding the schedule by randomly generating missing slices. Calculates allocations.

#### Every Month: Distribute

**_Note_**: The monthly task will skip execution if the distribution contracts are not deployed.

This task:

- Creates a new distribution
- Updates authorization setup

##### Creating New Distribution

- Creates two new checkpoints (mainnet and gnosis)
- Creates MerkleTrees out of the new checkpoints
- Commits the results back to repo

##### Updating Authorization Setup

Posts two transactions - mainnet and gnosis - that take care of the following steps:

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

## Calculating allocations

### All allocations (up to now)

- run `yarn hardhat allocate --lazy false`

### One allocation (one VestingSlice)

- run `yarn hardhat allocate [blockNumber]`

## Calculating checkpoint

### latest

- run `yarn hardhat checkpoint`

### past

- run `yarn hardhat checkpoint [blockNumber]`
