import asyncRetry from "async-retry";
import { request as gqlRequest, gql } from "graphql-request";

import { BigNumber, constants } from "ethers";
import { getAddress } from "ethers/lib/utils";

import snapshotMerge from "../fns/snapshotMerge";
import { Snapshot, UserBalance } from "../types";

const request = withPaging(withRetry(gqlRequest));

export async function queryBalancesMainnet(
  block: number,
  withLgno: boolean,
): Promise<Snapshot> {
  if (!withLgno) {
    return {};
  }

  const userBalances = await request(urlMainnet, queryLgno, {
    block,
  });

  return aggregate(userBalances);
}

export async function queryBalancesGC(
  block: number,
  withLgno: boolean,
): Promise<Snapshot> {
  const [balancesWithLgno, balancesWithDeposit, balancesWithStaked] =
    await Promise.all([
      withLgno ? request(urlGnosis, queryLgno, { block }) : [],
      request(urlGnosis, queryDeposit, { block }),
      request(urlGnosis, queryStaked, { block }),
    ]);

  const s1 = aggregate(balancesWithLgno);
  const s2 = aggregate(balancesWithDeposit);
  const s3 = aggregate(balancesWithStaked);

  return snapshotMerge(s1, snapshotMerge(s2, s3));
}

function withPaging(
  request: (url: string, query: string, options: any) => Promise<UserBalance[]>,
) {
  return async function pagedRequest(
    url: string,
    query: string,
    options: any,
    lastId: string = constants.AddressZero,
  ): Promise<UserBalance[]> {
    const users = await request(url, query, { ...options, lastId });
    if (users.length === 0) {
      return [];
    }

    return [
      ...users,
      ...(await pagedRequest(url, query, options, users[users.length - 1].id)),
    ];
  };
}

function withRetry(
  request: (
    url: string,
    query: string,
    options: any,
  ) => Promise<{ users: UserBalance[] }>,
) {
  return (url: string, query: string, options: any) => {
    return asyncRetry(
      () => request(url, query, options).then(({ users }) => users),
      {
        retries: 3,
        onRetry: () => {
          console.info(
            `retrying request:\nURL: ${url}\nQUERY: ${query}\nOPTIONS: ${JSON.stringify(
              options,
            )}`,
          );
        },
      },
    );
  };
}

const urlMainnet =
  "https://api.thegraph.com/subgraphs/id/QmNUxw4m4xGzz4D8Qy1fobJ4UXbXeBdSEbkpjeeWxERNyy";

const urlGnosis =
  "https://api.thegraph.com/subgraphs/id/QmXFaKZuRWQT1e8oFpuPasVGhWF561MeC7nij6yf4CpwFV";
const queryLgno = gql`
  query ($block: Int, $lastId: String) {
    users(
      block: { number: $block }
      first: 1000
      where: { id_gt: $lastId, lgno_gt: "0" }
    ) {
      id
      lgno
    }
  }
`;

const queryDeposit = gql`
  query ($block: Int, $lastId: String) {
    users(
      block: { number: $block }
      first: 1000
      where: { id_gt: $lastId, deposit_gt: "0" }
    ) {
      id
      deposit
    }
  }
`;

const queryStaked = gql`
  query ($block: Int, $lastId: String) {
    users(
      block: { number: $block }
      first: 1000
      where: { id_gt: $lastId, stakedGnoSgno_gt: "0" }
    ) {
      id
      stakedGnoSgno
    }
  }
`;

function aggregate(users: UserBalance[]): Snapshot {
  if (users.length === 0) {
    return {};
  }

  const idsAndBalances = users
    .map((user: UserBalance) => ({
      id: getAddress(user.id),
      balance: BigNumber.from(0)
        .add(user.deposit || 0)
        .add(user.lgno || 0)
        .add(user.stakedGnoSgno || 0),
    }))
    .filter(({ balance }) => balance.gt(0));

  const result: Snapshot = {};
  for (const { id, balance } of idsAndBalances) {
    result[id] = balance;
  }
  return result;
}
