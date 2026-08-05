const renderOneRepMaxChart = (container) => {
  const raw = container.dataset.oneRepMaxChart;
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(data) || data.length === 0) return;

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";

  const rect = container.getBoundingClientRect();
  const width = rect.width || 400;
  const height = rect.height || 192;
  const margin = { top: 12, right: 16, bottom: 32, left: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  d3.select(container).selectAll("*").remove();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("aria-label", "One rep max curve")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([1, 10]).range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(data, (d) => d.orm) * 0.98,
      d3.max(data, (d) => d.orm) * 1.02,
    ])
    .range([innerH, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(9)
        .tickFormat((d) => `${d}`),
    )
    .call((axis) => {
      axis.select(".domain").attr("stroke", colorOutline);
      axis.selectAll(".tick line").attr("stroke", colorOutline);
      axis
        .selectAll(".tick text")
        .attr("fill", colorOutline)
        .style("font-size", "11px");
    });

  g.append("g")
    .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(".0f")))
    .call((axis) => {
      axis.select(".domain").attr("stroke", colorOutline);
      axis.selectAll(".tick line").attr("stroke", colorOutline);
      axis
        .selectAll(".tick text")
        .attr("fill", colorOutline)
        .style("font-size", "11px");
    });

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorOnSurface)
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line()
        .x((d) => x(d.r))
        .y((d) => y(d.orm))
        .curve(d3.curveMonotoneX),
    );

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.r))
    .attr("cy", (d) => y(d.orm))
    .attr("r", 3)
    .attr("fill", colorOnSurface);
};

function initOneRepMaxChart() {
  const container = document.getElementById("one-rep-max-chart");
  if (!container) return;

  renderOneRepMaxChart(container);

  const observer = new ResizeObserver(() => {
    renderOneRepMaxChart(container);
  });
  observer.observe(container);
}

document.addEventListener("DOMContentLoaded", initOneRepMaxChart);
document.addEventListener("htmx:after:settle", initOneRepMaxChart);
