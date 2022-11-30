import { arc, map, pie, range, Selection } from "d3";
import { useD3 } from "../../utils/hooks";

import classes from "./style.module.css";

export interface AllocationData {
  name: string;
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
      name: "GnosisDAO Allocation",
    },
    {
      allocation: gnosisDaoVested,
      className: classes.gnosisVested,
      name: "GnosisDAO Vested",
    },
    {
      allocation: safeTokenSupply - gnosisDaoAllocation,
      className: classes.elseAllocation,
      name: "Non GnosisDAO Allocation",
    },
  ];

  const ref = useD3(
    (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
      const value = (d: AllocationData) => d.allocation;
      const innerRadius = 0; // inner radius of pie, in pixels (non-zero for donut)
      const outerRadius = Math.min(width, height) / 2; // outer radius of pie, in pixels
      const stroke = innerRadius > 0 ? "none" : "black"; // stroke separating widths
      const strokeWidth = 1; // width of stroke separating wedges
      const strokeLinejoin = "round"; // line join of stroke separating wedges
      const padAngle = stroke === "none" ? 1 / outerRadius : 0; // angular separation between wedges

      const valueMap = map(wedges, value);
      const I = range(valueMap.length);

      const arcs = pie()
        .padAngle(padAngle)
        .sort(null)
        .value((i) => valueMap[i as number])(I);
      const arcDef = arc().innerRadius(innerRadius).outerRadius(outerRadius);

      svg
        .select(`.${classes.pieChart}`)
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-linejoin", strokeLinejoin)
        .selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arcDef as unknown as string)
        .attr("class", (d, i) => wedges[i].className);
    },
    [gnosisDaoVested],
  );
  return (
    <svg
      ref={ref}
      className={classes.vestingChart}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
    >
      <g
        className={classes.pieChart}
        transform={`translate(${-width / 2 + 20}) scale(1.7) rotate(64)`}
      />
    </svg>
  );
};

export default VestingChart;
