import { BigNumber } from "ethers";
import { request, gql } from "graphql-request";

type User = {
  id: string;
  gno: string;
  mgno: string;
  lgno: string;
  sgno: string;
};
type Result = { [key: string]: BigNumber };

/*
 * Note gets the mainnet block
 */
export async function queryBalancesMainnet(block: number): Promise<Result> {
  const result = await request(mainnetEndpoint, mainnetQuery, {
    block,
    count: 1000,
  });

  return result.users
    .map((user: User) => ({
      id: user.id,
      balance: BigNumber.from(user.gno)
        .add(user.mgno)
        .add(user.lgno)
        .add(user.sgno),
    }))
    .filter(({ balance }: { balance: BigNumber }) => balance.gt(0))
    .reduce((prev: Result, next: any) => {
      return {
        ...prev,
        [next.id]: next.balance,
      };
    }, {});
}

export async function queryBalancesGC(block: number): Promise<Result> {
  const result = await request(gcEndpoint, gcQuery, { block, count: 1000 });

  return result.users
    .map((user: User) => ({
      id: user.id,
      balance: BigNumber.from(user.gno)
        .add(user.mgno)
        .add(user.lgno)
        .add(user.sgno),
    }))
    .filter(({ balance }: { balance: BigNumber }) => balance.gt(0))
    .reduce((prev: Result, next: any) => {
      return {
        ...prev,
        [next.id]: next.balance,
      };
    }, {});
}

const mainnetEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-eth";
const mainnetQuery = gql`
  query ($block: Int, $count: Int, $lastId: ID) {
    users(block: { number: $block }, first: $count) {
      id
      gno
      mgno
      lgno
      sgno
    }
  }
`;

const gcEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-eth";

const gcQuery = gql`
  query ($block: Int, $count: Int, $lastId: ID) {
    users(first: $count) {
      id
      gno
      mgno
      lgno
      sgno
    }
  }
`;
