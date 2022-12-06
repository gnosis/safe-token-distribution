import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";

task("verify-distro", "Verifies a MerkleDistro contract").setAction(
  async (_, hre) => {
    await hre.run("sourcify");
    await hre.run("etherscan-verify");
  },
);

export {};
