import { Schedule } from "../persistence";

export default function findEntry(schedule: Schedule, blockNumber: number) {
  const index = schedule.findIndex(
    (entry) => blockNumber <= entry.mainnet.blockNumber,
  );

  if (index === -1) {
    return { prevEntry: null, entry: null, nextEntry: null };
  }

  return {
    prevEntry: index === 0 ? null : schedule[index - 1],
    entry: schedule[index],
    nextEntry: index === schedule.length - 1 ? null : schedule[index + 1],
  };
}
