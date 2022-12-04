import { BigNumber, constants } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { request, gql } from "graphql-request";
import snapshotMerge from "../fns/snapshotMerge";
import snapshotSortKeys from "../fns/snapshotSortKeys";
import { Snapshot, UserBalance } from "../types";

export async function queryBalancesMainnet(
  block: number,
  withLGNO: boolean,
): Promise<Snapshot> {
  if (!withLGNO) {
    return {};
  }

  const userBalances = await pagedRequest(async (lastId: string) =>
    request(mainnetEndpoint, lgnoQuery, {
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
  const [balancesWithLgno, balancesWithDeposit, balancesWithStaked] =
    await Promise.all([
      withLGNO
        ? pagedRequest((lastId: string) =>
            request(gcEndpoint, lgnoQuery, {
              block,
              lastId,
            }).then((result) => result.users),
          )
        : [],
      pagedRequest((lastId: string) =>
        request(gcEndpoint, depositQuery, {
          block,
          lastId,
        }).then((result) => result.users),
      ),
      pagedRequest((lastId: string) =>
        request(gcEndpoint, stakedQuery, {
          block,
          lastId,
        }).then((result) => result.users),
      ),
    ]);

  const s1 = aggregate(balancesWithLgno);
  const s2 = aggregate(balancesWithDeposit);
  const s3 = aggregate(balancesWithStaked);

  return snapshotMerge(s1, snapshotMerge(s2, s3));
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

const gcEndpoint =
  "https://api.thegraph.com/subgraphs/id/QmbJaRFT59ANkbqXHHCkR6euNyTBD2ypnwek9Gneohx8ha";

const lgnoQuery = gql`
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

const depositQuery = gql`
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

const stakedQuery = gql`
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

export default function aggregate(users: UserBalance[]): Snapshot {
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
