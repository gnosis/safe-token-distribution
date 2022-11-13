import fromUnixTime from "date-fns/fromUnixTime";
import getUnixTime from "date-fns/getUnixTime";
import addMinutes from "date-fns/addMinutes";
import addYears from "date-fns/addYears";
import isBefore from "date-fns/isBefore";

import { Block } from "@ethersproject/providers";

export type Interval = {
  left: number;
  right: number;
};

export function generate(inceptionBlock: Block, frequency: number): Interval[] {
  let result: Interval[] = [];

  const start = fromUnixTime(inceptionBlock.timestamp);
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

export function isPast(interval: Interval) {
  return interval.right < getUnixTime(new Date());
}
