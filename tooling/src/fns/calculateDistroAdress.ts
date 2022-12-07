import {
  keccak256,
  getCreate2Address,
  concat,
  defaultAbiCoder,
} from "ethers/lib/utils";
import { getSingletonFactoryInfo } from "@gnosis.pm/safe-singleton-factory";

import { MerkleDistro__factory } from "../../typechain";

export default function calculateDistroAddress(
  chainId: string,
  tokenAddress: string,
  merkleRoot: string,
  ownerAddress: string,
  salt: string,
) {
  const encodedDeployData = concat([
    MerkleDistro__factory.bytecode,
    defaultAbiCoder.encode(
      ["address", "bytes32", "address"],
      [tokenAddress, merkleRoot, ownerAddress],
    ),
  ]);

  return getCreate2Address(
    singletonFactoryAddress(chainId),
    salt,
    keccak256(encodedDeployData),
  );
}

function singletonFactoryAddress(network: string) {
  const info = getSingletonFactoryInfo(parseInt(network));

  return info?.address || "0x4e59b44847b379578588920ca78fbf26c0b4956c";
}
