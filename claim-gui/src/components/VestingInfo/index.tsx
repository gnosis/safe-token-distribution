import { useContractReads } from "wagmi";

import vestingContract from "../../utils/vestingContract";
import classes from "./style.module.css";

const VestingInfo: React.FC = () => {
  const { data, isError, isLoading } = useContractReads({
    contracts: [
      {
        ...vestingContract,
        functionName: "vestings",
        args: [
          "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382",
        ],
      },
      {
        ...vestingContract,
        functionName: "calculateVestedAmount",
        args: [
          "0x12c1ee9f9b122fa7a0e7a6a733f6e07d30affb7fac1ca061325b11d9ba677382",
        ],
      },
    ],
    onSuccess(data) {
      console.log("success", data);
    },
    onError(error) {
      console.log("Error", error);
    },
  });

  const totalSAFESupply = 1000000000000000000000000000;
  console.log(data);
  return (
    <div>
      <h1>Vesting</h1>
      {isLoading && <h2>Loading...</h2>}
    </div>
  );
};

export default VestingInfo;
