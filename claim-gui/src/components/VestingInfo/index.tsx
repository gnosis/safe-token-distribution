import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { useContractReads, useContractRead } from "wagmi";
import safeTokenContract from "../../utils/SafeTokenContract";

import vestingContract from "../../utils/vestingContract";
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
  // allocation diagram, with GnosisDAO having 15% of total supply
  const totalSAFESupply = staticRes.data
    ? staticRes.data[1]
    : BigNumber.from("1000000000");
  const gnosisInitial = BigNumber.from("10011026319019003889472853");
  const gnosisDAOTotal = staticRes.data
    ? staticRes.data[0].amount.add(gnosisInitial)
    : BigNumber.from("150000000");
  const vestedAmount = vestingRes.data
    ? vestingRes.data.vestedAmount
    : BigNumber.from(0);

  const BNtoFloat = (BN: BigNumber, decimals: number): number => {
    return parseFloat(formatUnits(BN, decimals));
  };

  return (
    <div className={classes.vestingInfo}>
      <h1>GnosisDAO — SAFE Token</h1>
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
