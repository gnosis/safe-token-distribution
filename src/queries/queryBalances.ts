import { BigNumber } from "ethers";
import { request, gql } from "graphql-request";

type User = {
  id: string;
  mgno: string;
  lgno: string;
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

  return (
    result.users
      .map((user: User) => ({
        id: user.id,
        balance: BigNumber.from(user.lgno).add(user.mgno),
      }))
      //.filter(({ balance }: { balance: BigNumber }) => balance.gt(0))
      .reduce((prev: Result, next: any) => {
        return {
          ...prev,
          [next.id]: next.balance,
        };
      }, {})
  );
}

export async function queryBalancesGC(block: number): Promise<Result> {
  const result = await request(gcEndpoint, gcQuery, { block, count: 1000 });

  return (
    result.users
      .map((user: User) => ({
        id: user.id,
        balance: BigNumber.from(user.lgno).add(user.mgno),
      }))
      //.filter(({ balance }: { balance: BigNumber }) => balance.gt(0))
      .reduce((prev: Result, next: any) => {
        return {
          ...prev,
          [next.id]: next.balance,
        };
      }, {})
  );
}

const mainnetEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-eth";
const mainnetQuery = gql`
  query ($block: Int, $count: Int, $lastId: ID) {
    # this one is coming from uniswap-v2
    users(block: { number: $block }, first: $count, where: { lgno_not: "0" }) {
      id
      lgno
      mgno
    }
  }
`;

const gcEndpoint =
  "https://api.thegraph.com/subgraphs/name/jfschwarz/gno-voting-power-eth";

const gcQuery = gql`
  query ($block: Int, $count: Int, $lastId: ID) {
    # this one is coming from uniswap-v2
    users(first: $count, where: { lgno_not: "0" }) {
      id
      lgno
      mgno
    }
  }
`;
