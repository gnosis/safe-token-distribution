import {
  arc,
  DefaultArcObject,
  map,
  pie,
  PieArcDatum,
  range,
  Selection,
} from "d3";
import { useD3 } from "../../utils/hooks";

import classes from "./style.module.css";

export interface AllocationData {
  allocation: number;
  className: string;
}

interface Props {
  safeTokenSupply: number;
  gnosisDaoAllocation: number;
  gnosisDaoVested: number;
}

const VestingChart: React.FC<Props> = ({
  safeTokenSupply,
  gnosisDaoAllocation,
  gnosisDaoVested,
}) => {
  const width = 640;
  const height = 400;

  const wedges = [
    {
      allocation: gnosisDaoAllocation - gnosisDaoVested,
      className: classes.gnosisAllocation,
    },
    {
      allocation: gnosisDaoVested,
      className: classes.gnosisVested,
    },
    {
      allocation: safeTokenSupply - gnosisDaoAllocation,
      className: classes.elseAllocation,
    },
  ];

  const midAngle = (d: DefaultArcObject) =>
    d.startAngle + (d.endAngle - d.startAngle) / 2;

  const ref = useD3(
    (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
      const value = (d: AllocationData) => d.allocation;
      const innerRadius = 0;
      const outerRadius = Math.min(width, height) / 2;
      const padAngle = 0;

      const valueMap = map(wedges, value);
      const I = range(valueMap.length);

      const arcs = pie()
        .padAngle(padAngle)
        .sort(null)
        .value((i) => valueMap[i as number])(I);
      const arcDef = arc().innerRadius(innerRadius).outerRadius(outerRadius);

      // draw pie chart wedges
      svg
        .select(`.${classes.pieChart}`)
        .selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arcDef as unknown as string)
        .attr("class", (d, i) => wedges[i].className);

      // draw labels
      const labels = [
        {
          label: `${(
            gnosisDaoAllocation - gnosisDaoVested
          ).toLocaleString()}\nAllocated`,
          position: [61, -293],
        },
        {
          label: `${gnosisDaoVested.toLocaleString()}\nVested`,
          position: [148, -253],
        },
      ];
      svg
        .select(`.${classes.labels}`)
        .selectAll("text")
        .data(labels)
        .join("text")
        .attr("transform", (d) => {
          return `translate(${d.position[0]} ${d.position[1]}) rotate(-64)`;
        })
        .selectAll("tspan")
        .data((d) => {
          return d.label.split(/\n/);
        })
        .join("tspan")
        .attr("x", 0)
        .attr("y", (_, i) => `${i * 1.1}em`)
        .attr("font-weight", (_, i) => (i ? null : "bold"))
        .text((d) => d);

      const translateLabelPositionLeft = (
        position: number[],
        amount: number,
      ) => {
        return [position[0] - amount, position[1] + amount * 2.2];
      };

      const markArcStart = arc()
        .innerRadius(outerRadius)
        .outerRadius(outerRadius);

      // draw markers
      svg
        .select(`.${classes.marks}`)
        .selectAll("polyline")
        .data(arcs.slice(0, -1))
        .join("polyline")
        .attr("points", (d) => {
          const arcObj = d as unknown as DefaultArcObject;

          return [
            markArcStart.centroid(arcObj),
            translateLabelPositionLeft(labels[d.index].position, 25),
            translateLabelPositionLeft(labels[d.index].position, 20),
          ] as unknown as number;
        });
    },
    [gnosisDaoVested],
  );
  return (
    <svg
      ref={ref}
      className={classes.vestingChart}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
    >
      <g transform={`translate(${-width / 2 + 20}) scale(1.7) rotate(64)`}>
        <g className={classes.pieChart} />
        <g className={classes.marks} />
        <g className={classes.labels} />
      </g>
    </svg>
  );
};

export default VestingChart;
