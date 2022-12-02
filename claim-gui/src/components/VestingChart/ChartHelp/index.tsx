import clsx from "clsx";
import { arc, DefaultArcObject, map, pie, range } from "d3";
import { useState } from "react";
import { useD3 } from "../../../utils/hooks";
import Card from "../../Card";
import SafeTag from "../../SafeTag";
import classes from "./style.module.css";

export interface WedgeData {
  value: number;
  className: string;
  color: string;
}

const ChartHelp: React.FC<{ className?: string }> = ({ className }) => {
  const [hoverLabel, setHoverLabel] = useState("");
  const width = 400;
  const height = 400;

  const wedges = [
    {
      value: 15,
      className: classes.gnosisDao,
      color: "#CAEFFF",
      label: "GnosisDAO",
    },
    {
      value: 40,
      className: classes.safeDao,
      color: "#CBFFDC",
      label: "SafeDAO",
    },
    {
      value: 5,
      className: classes.ecosystem,
      color: "#B3DD99",
      label: "Ecosystem",
    },
    {
      value: 5,
      className: classes.user,
      color: "#F8FFCB",
      label: "Users",
    },
    {
      value: 15,
      className: classes.foundation,
      color: "#CBD3AA",
      label: "Safe Foundation",
    },
    {
      value: 15,
      className: classes.contributors,
      color: "#FFE5BE",
      label: "Core Contributors",
    },
    {
      value: 5,
      className: classes.joint,
      color: "#AAD3C9",
      label: "Joint Treasury GNO <> SAFE",
    },
  ];
  const ref = useD3((svg) => {
    const value = (d: WedgeData) => d.value;
    const innerRadius = 0;
    const outerRadius = (Math.min(width, height) / 2) * 0.7;
    const labelRadius = outerRadius * 1.22;
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
      .attr("class", (_, i) => wedges[i].className)
      .attr("fill", (_, i) => wedges[i].color)
      .on("mouseover", (e: MouseEvent, d) => {
        const target = e.target as SVGElement;
        target.classList.add(classes.focus);
        setHoverLabel(wedges[d.index].label);
      })
      .on("mouseout", (e: MouseEvent, d) => {
        const target = e.target as SVGElement;
        target.classList.remove(classes.focus);
        setHoverLabel("");
      });

    // draw labels
    const labelArc = arc().innerRadius(labelRadius).outerRadius(labelRadius);
    svg
      .select(`.${classes.labels}`)
      .selectAll("text")
      .data(arcs)
      .join("text")
      .attr(
        "transform",
        (d) =>
          `translate(${labelArc.centroid(
            d as unknown as DefaultArcObject,
          )}) rotate(-65)`,
      )
      .text((_, i) => `${wedges[i].value}%`);
  }, "");
  return (
    <div className={clsx(className, classes.container)}>
      <Card>
        <p className={classes.info}>
          This chart is zoomed and cropped version of the total <SafeTag />{" "}
          <a
            href="https://forum.gnosis.io/t/gip-29-spin-off-safedao-and-launch-safe-token/3476"
            target="_blank"
            rel="noreferrer"
          >
            allocation chart
          </a>
          :
        </p>
        <svg
          ref={ref}
          className={classes.allocationChart}
          viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
        >
          <g transform="translate(-5 0) rotate(65)">
            <g className={classes.pieChart} />
            <g className={classes.labels} />
          </g>
        </svg>
        <div
          className={clsx(
            classes.hoverLabel,
            hoverLabel.length > 0 && classes.active,
          )}
        >
          <p>{hoverLabel}</p>
        </div>
      </Card>
    </div>
  );
};

export default ChartHelp;
