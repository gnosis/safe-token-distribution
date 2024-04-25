# GnosisDAO — Safe Token Distribution

ATTENTION: this README is OUTDATED

GnosisDAO received 15% of the total SAFE Token supply, vesting over 4 years. These tokens continuously vest to GnosisDAO, and this tool is responsible for distributing these tokens to GNO holders. The distributions for each address are calculated daily, and vested tokens are made available to claim monthly. [GIP and discussion can be read here](https://forum.gnosis.io/t/gip-64-should-gnosisdao-distribute-safe-tokens-to-incentivize-decentralizing-gnosis-chain/5896).

This repo contains the codebases for the distribution contracts, the scripts for claiming and calculating distributions, and the web app used by GNO holders to claim tokens.

**_Note:_** Token distributions will not be available until the SAFE Token is made transferable, and the Distribution contracts are deployed. Once SAFE is unpaused, and MerkleDistros deployed, distribution the first distribution will be handled manually.

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

Allocations were calculated using, and published in, the [safe-token-distribution-scripts repo](https://github.com/gnosis/safe-token-distribution-scripts/tree/main).

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

The distribution is triggered by manually triggering the `Distribute` workflow, it is [defined here](.github/workflows).

#### Distribute

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

## Calculating checkpoint

- run `yarn hardhat checkpoint`

## Audit

- run `yarn hardhat audit`
