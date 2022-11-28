import { BigNumber, constants } from "ethers";
import { request, gql } from "graphql-request";
import { Snapshot } from "../snapshot";

type User = {
  id: string;
  gno: string;
  mgno: string;
  lgno: string;
  sgno: string;
  stakedGnoSgno: string;
};

export async function queryBalancesMainnet(block: number): Promise<Snapshot> {
  const users = await pagedRequest(async (lastId: string) =>
    request(mainnetEndpoint, mainnetQuery, {
      block,
      lastId,
    }).then((result) => result.users),
  );

  return toSnapshot(users, ["lgno", "sgno"]);
}

export async function queryBalancesGC(block: number): Promise<Snapshot> {
  const users = await pagedRequest((lastId: string) =>
    request(gcEndpoint, gcQuery, {
      block,
      lastId,
    }).then((result) => result.users),
  );

  return toSnapshot(users, ["lgno", "mgno", "sgno", "stakedGnoSgno"]);
}

async function pagedRequest(
  request: (lastId: string) => Promise<User[]>,
  lastId?: string,
): Promise<User[]> {
  lastId = lastId || constants.AddressZero;

  const users = await request(lastId);
  const nextLastId = users.length > 0 ? users[users.length - 1].id : null;

  return nextLastId
    ? [...users, ...(await pagedRequest(request, nextLastId))]
    : users;
}

function toSnapshot(users: User[], keys: (keyof User)[]): Snapshot {
  const idsAndBalances = users
    .map((user: User) => ({
      id: user.id,
      balance: keys
        .map((key) => BigNumber.from(user[key] || 0))
        .reduce((prev, next) => prev.add(next), BigNumber.from(0)),
    }))
    .filter(({ balance }: { balance: BigNumber }) => balance.gt(0));

  // .reduce((prev: Result, next: any) => {
  //   return {
  //     ...prev,
  //     [next.id]: next.balance,
  //   };
  // }, {});

  const result: Snapshot = {};
  for (const { id, balance } of idsAndBalances) {
    result[id] = balance;
  }
  return result;
}

const mainnetEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-eth";
const mainnetQuery = gql`
  query ($block: Int, $lastId: String) {
    users(block: { number: $block }, first: 1000, where: { id_gt: $lastId }) {
      id
      lgno
      sgno
    }
  }
`;

const gcEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-gno";

const gcQuery = gql`
  query ($block: Int, $lastId: String) {
    users(block: { number: $block }, first: 1000, where: { id_gt: $lastId }) {
      id
      lgno
      mgno
      sgno
      stakedGnoSgno
    }
  }
`;
