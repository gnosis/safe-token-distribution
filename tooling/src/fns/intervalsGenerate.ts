import {
  addMinutes,
  addYears,
  fromUnixTime,
  getUnixTime,
  isBefore,
} from "date-fns";
import { Interval } from "../types";

export default function (timestamp: number, frequency: number): Interval[] {
  let result: Interval[] = [];

  const start = fromUnixTime(timestamp);
  const end = addYears(start, 4);

  let curr = start;

  while (isBefore(curr, end)) {
    result = [
      ...result,
      {
        left: getUnixTime(curr),
        right: getUnixTime(addMinutes(curr, frequency)),
      },
    ];
    curr = addMinutes(curr, frequency);
  }

  return result;
}
