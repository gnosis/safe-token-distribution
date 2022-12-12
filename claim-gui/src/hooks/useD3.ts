import { useEffect, useRef } from "react";
import { select, Selection } from "d3";

export default function useD3(
  renderFunc: (
    svgEl: Selection<SVGSVGElement, unknown, null, undefined>,
  ) => void,
  dependencies: any,
) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current) renderFunc(select(ref.current));
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependencies]);

  return ref;
}
