import { expect } from "chai";
import scheduleFind from "./scheduleFind";

describe.only("scheduleFind", function () {
  it("miss", () => {
    const { prevEntry, entry, nextEntry } = scheduleFind(schedule, 17000000);
    expect(prevEntry).to.equal(null);
    expect(entry).to.equal(null);
    expect(nextEntry).to.equal(null);
  });

  it("finds entry first", () => {
    const [first, second] = schedule;
    const { prevEntry, entry, nextEntry } = scheduleFind(schedule, 0);

    expect(prevEntry).to.equal(null);
    expect(entry?.mainnet?.timestamp).to.equal(first.mainnet.timestamp);
    expect(nextEntry?.mainnet?.timestamp).to.equal(second.mainnet.timestamp);
  });

  it("finds entry middle", () => {
    const [first, second, third] = schedule;
    const { prevEntry, entry, nextEntry } = scheduleFind(schedule, 16065000);

    expect(prevEntry?.mainnet.timestamp).to.equal(first.mainnet.timestamp);
    expect(entry?.mainnet.timestamp).to.equal(second.mainnet.timestamp);
    expect(nextEntry?.mainnet.timestamp).to.equal(third.mainnet.timestamp);
  });

  it("finds entry last", () => {
    const [, second, third] = schedule;
    const { prevEntry, entry, nextEntry } = scheduleFind(schedule, 16080000);

    expect(prevEntry?.mainnet.timestamp).to.equal(second.mainnet.timestamp);
    expect(entry?.mainnet.timestamp).to.equal(third.mainnet.timestamp);
    expect(nextEntry).to.equal(null);
  });
});

const schedule = [
  {
    mainnet: {
      timestamp: 1669585787,
      blockNumber: 16064111,
    },
    gc: {
      timestamp: 1669585785,
      blockNumber: 25189669,
    },
  },
  {
    mainnet: {
      blockNumber: 16073062,
      timestamp: 1669693703,
    },
    gc: {
      timestamp: 1669693700,
      blockNumber: 25209530,
    },
  },
  {
    mainnet: {
      blockNumber: 16081212,
      timestamp: 1669792067,
    },
    gc: {
      timestamp: 1669792065,
      blockNumber: 25227679,
    },
  },
];
