import { Schedule } from "../types";

export default function scheduleFind(schedule: Schedule, blockNumber: number) {
  const index = schedule.findIndex((entry) => blockNumber <= entry.mainnet);
  return index === -1 ? null : schedule[index];
}
