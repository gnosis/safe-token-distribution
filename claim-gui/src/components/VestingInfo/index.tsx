import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { useContractReads, useContractRead } from "wagmi";
import safeTokenContract from "../../utils/SafeTokenContract";

import vestingContract from "../../utils/vestingContract";
import SafeTag from "../SafeTag";
import ConnectionStatus from "./ConnectionStatus";
import classes from "./style.module.css";
import VestingChart from "./VestingChart";

const VestingInfo: React.FC = () => {
  const staticRes = useContractReads({
    contracts: [
      {
        ...vestingContract,
        functionName: "vestings",
        args: [
          "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382",
        ],
      },
      {
        ...safeTokenContract,
        functionName: "totalSupply",
      },
    ],
  });

  const vestingRes = useContractRead({
    ...vestingContract,
    functionName: "calculateVestedAmount",
    args: [
      "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382",
    ],
    watch: true,
  });

  // if data from contracts cannot be fetched, chart will show static
  // unvested allocation diagram,
  const totalSAFESupply = staticRes.data
    ? staticRes.data[1]
    : BigNumber.from("1000000000000000000000000000");
  const gnosisInitial = BigNumber.from("10011026319019003889472853");
  const gnosisDAOTotal = staticRes.data
    ? staticRes.data[0].amount.add(gnosisInitial)
    : BigNumber.from("150000000000000000000000000");
  const vestedAmount = vestingRes.data
    ? vestingRes.data.vestedAmount
    : BigNumber.from(0);

  const BNtoFloat = (BN: BigNumber, decimals: number): number => {
    return parseFloat(formatUnits(BN, decimals));
  };

  return (
    <div className={classes.vestingInfo}>
      <p>
        GnosisDAO received 15% of the total <SafeTag /> Token supply, vesting
        over 4 years. The vested tokens are moved to the claim pool monthly.{" "}
        <a href="https://forum.gnosis.io/t/gip-64-should-gnosisdao-distribute-safe-tokens-to-incentivize-decentralizing-gnosis-chain/5896">
          Read more here.
        </a>
      </p>
      {!staticRes.isLoading && !vestingRes.isLoading && (
        <VestingChart
          safeTokenSupply={BNtoFloat(totalSAFESupply, 18)}
          gnosisDaoAllocation={BNtoFloat(gnosisDAOTotal, 18)}
          gnosisDaoVested={BNtoFloat(vestedAmount, 18)}
        />
      )}
      <ConnectionStatus
        isError={vestingRes.isError}
        className={classes.statusContainer}
      />
    </div>
  );
};

export default VestingInfo;
