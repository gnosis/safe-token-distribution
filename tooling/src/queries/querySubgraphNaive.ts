import { BigNumber, BigNumberish, constants } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { request, gql } from "graphql-request";
import { Snapshot, UserBalance } from "../types";

export async function queryBalancesMainnet(
  block: number,
  withLGNO: boolean,
): Promise<Snapshot> {
  if (!withLGNO) {
    return {};
  }

  const userBalances = await pagedRequest(async (lastId: string) =>
    request(mainnetEndpoint, mainnetQuery, {
      block,
      lastId,
    }).then((result) => result.users),
  );

  return aggregate(userBalances);
}

export async function queryBalancesGC(
  block: number,
  withLGNO: boolean,
): Promise<Snapshot> {
  const userBalances = await pagedRequest((lastId: string) =>
    request(gcEndpoint, gcQuery, {
      block,
      lastId,
    }).then((result) => result.users),
  );

  return aggregate(userBalances);
}

async function pagedRequest(
  request: (lastId: string) => Promise<UserBalance[]>,
  lastId?: string,
): Promise<UserBalance[]> {
  lastId = lastId || constants.AddressZero;

  const users = await request(lastId);
  const nextLastId = users.length > 0 ? users[users.length - 1].id : null;

  return nextLastId
    ? [...users, ...(await pagedRequest(request, nextLastId))]
    : users;
}

const mainnetEndpoint =
  "https://api.thegraph.com/subgraphs/id/QmYNFPz2j1S8wdm2nhou6wRhGXfVVFzVi37LKuvcHBayip";
const mainnetQuery = gql`
  query ($block: Int, $lastId: String) {
    users(block: { number: $block }, first: 1000, where: { id_gt: $lastId }) {
      id
      lgno
    }
  }
`;

const gcEndpoint =
  "https://api.thegraph.com/subgraphs/id/QmbJaRFT59ANkbqXHHCkR6euNyTBD2ypnwek9Gneohx8ha";

const gcQuery = gql`
  query ($block: Int, $lastId: String) {
    users(block: { number: $block }, first: 1000, where: { id_gt: $lastId }) {
      id
      lgno
      deposit
      stakedGnoSgno
    }
  }
`;

export default function aggregate(users: UserBalance[]): Snapshot {
  if (users.length === 0) {
    return {};
  }

  const zeroOrGreater = (ish?: BigNumberish) => {
    const bn = BigNumber.from(ish || 0);
    return bn.gt(0) ? bn : 0;
  };

  const idsAndBalances = users
    .map((user: UserBalance) => ({
      id: getAddress(user.id),
      balance: BigNumber.from(0)
        .add(zeroOrGreater(user.deposit))
        .add(zeroOrGreater(user.lgno))
        .add(zeroOrGreater(user.stakedGnoSgno)),
    }))
    .filter(({ balance }) => balance.gt(0));

  const result: Snapshot = {};
  for (const { id, balance } of idsAndBalances) {
    result[id] = balance;
  }
  return result;
}
