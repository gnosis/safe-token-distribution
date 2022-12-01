import clsx from "clsx";
import { arc, DefaultArcObject, map, pie, range, Selection } from "d3";
import { useState } from "react";
import { useD3 } from "../../utils/hooks";

import classes from "./style.module.css";

export interface WedgeData {
  value: number;
  className: string;
}

interface Props {
  safeTokenSupply: number;
  gnosisDaoAllocation: number;
  gnosisDaoVested: number;
}

const HoverLabels = [
  "Unvested GnosisDAO allocation",
  "Tokens vested to GnosisDAO",
  "Non-GnosisDAO allocations",
];

const VestingChart: React.FC<Props> = ({
  safeTokenSupply,
  gnosisDaoAllocation,
  gnosisDaoVested,
}) => {
  const [hoverLabel, setHoverLabel] = useState("");
  const width = 640;
  const height = 400;

  const wedges = [
    {
      value: safeTokenSupply - gnosisDaoAllocation,
      className: classes.elseAllocation,
    },
    {
      value: gnosisDaoAllocation - gnosisDaoVested,
      className: classes.gnosisAllocation,
    },
    {
      value: gnosisDaoVested,
      className: classes.gnosisVested,
    },
  ];

  const ref = useD3(
    (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
      const value = (d: WedgeData) => d.value;
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
        .attr("class", (d, i) => wedges[i].className)
        .on("mouseover", (e: MouseEvent, d) => {
          const target = e.target as SVGElement;
          target.classList.add(classes.focus);
          setHoverLabel(HoverLabels[d.index]);
        })
        .on("mouseout", (e: MouseEvent, d) => {
          const target = e.target as SVGElement;
          target.classList.remove(classes.focus);
          setHoverLabel("");
        });

      // draw labels
      const labels = [
        {
          label: `${(
            gnosisDaoAllocation - gnosisDaoVested
          ).toLocaleString()}\nAllocated`,
          position: [-170, -240],
        },
        {
          label: `${gnosisDaoVested.toLocaleString()}\nVested`,
          position: [-90, -280],
        },
      ];
      svg
        .select(`.${classes.labels}`)
        .selectAll("text")
        .data(labels)
        .join("text")
        .attr("transform", (d) => {
          return `translate(${d.position[0]} ${d.position[1]}) rotate(-118)`;
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
        return [position[0] + amount, position[1] + amount * 1.9];
      };

      const markArcStart = arc()
        .innerRadius(outerRadius)
        .outerRadius(outerRadius);

      // remove wedge we don't need marker for
      arcs.shift();

      // draw markers
      svg
        .select(`.${classes.marks}`)
        .selectAll("polyline")
        .data(arcs)
        .join("polyline")
        .attr("points", (d, i) => {
          const arcObj = d as unknown as DefaultArcObject;
          return [
            markArcStart.centroid(arcObj),
            translateLabelPositionLeft(labels[i].position, 30),
            translateLabelPositionLeft(labels[i].position, 23),
          ] as unknown as number;
        });
    },
    [gnosisDaoVested],
  );
  return (
    <div>
      <svg
        ref={ref}
        className={classes.vestingChart}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      >
        <g transform={`translate(${-width / 2 + 20}) scale(1.7) rotate(118)`}>
          <g className={classes.pieChart} />
          <g className={classes.marks} />
          <g className={classes.labels} />
        </g>
      </svg>
      <div
        className={clsx(
          classes.hoverLabel,
          hoverLabel.length > 0 && classes.active,
        )}
      >
        {hoverLabel}
      </div>
    </div>
  );
};

export default VestingChart;
