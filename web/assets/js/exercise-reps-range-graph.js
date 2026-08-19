const renderRepsRangeGraph = (container, buckets) => {
  d3.select(container).selectAll("*").remove();

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";

  const rect = container.getBoundingClientRect();
  const width = rect.width || 200;

  const barH = 8;
  const labelH = 14; // space for label + count above each bar
  const rowH = labelH + barH;
  const gap = 12; // gap between rows
  const marginLeft = 0;
  const marginRight = 0;
  const innerW = width - marginLeft - marginRight;
  const height = buckets.length * rowH + (buckets.length - 1) * gap;

  const maxCount = d3.max(buckets, (d) => d.count) || 1;
  const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerW]);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("aria-label", "Reps range distribution chart")
    .attr("role", "img");

  const rows = svg
    .selectAll(".row")
    .data(buckets)
    .join("g")
    .attr("class", "row")
    .attr(
      "transform",
      (_, i) => `translate(${marginLeft},${i * (rowH + gap)})`,
    );

  // Label (left) and count (right) above the bar
  rows
    .append("text")
    .attr("x", 0)
    .attr("y", labelH - 4)
    .attr("fill", colorOutline)
    .attr("font-size", "12px")
    .attr("font-family", "inherit")
    .text((d) => d.label);

  rows
    .append("text")
    .attr("x", innerW)
    .attr("y", labelH - 4)
    .attr("text-anchor", "end")
    .attr("fill", colorOutline)
    .attr("font-size", "12px")
    .attr("font-family", "inherit")
    .text((d) => d.count);

  // Background track
  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", labelH)
    .attr("width", innerW)
    .attr("height", barH)
    .attr("fill", colorOutline)
    .attr("opacity", 0.15)
    .attr("rx", 1);

  // Filled bar
  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", labelH)
    .attr("width", (d) => (d.count > 0 ? x(d.count) : 0))
    .attr("height", barH)
    .attr("fill", colorOnSurface)
    .attr("opacity", 0.85)
    .attr("rx", 1);
};

const getRepsRangeData = () => {
  try {
    const el = document.getElementById("exercise-reps-range-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let repsRangeResizeObserver = null;

function initRepsRangeGraph() {
  const container = document.getElementById("exercise-reps-range-graph");
  if (!container) return;

  const buckets = getRepsRangeData();

  renderRepsRangeGraph(container, buckets);

  if (repsRangeResizeObserver) {
    repsRangeResizeObserver.disconnect();
  }
  repsRangeResizeObserver = new ResizeObserver(() => {
    renderRepsRangeGraph(container, buckets);
  });
  repsRangeResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initRepsRangeGraph);
