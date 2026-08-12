const formatDate = (date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const renderExerciseGraph = (container, points) => {
  const unit = container.dataset.unit || "kg";

  const data = points.map((p) => ({
    date: new Date(p.date),
    value: p.oneRepMax,
  }));

  if (data.length === 0) {
    d3.select(container).selectAll("*").remove();
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";
  const colorSurface =
    style.getPropertyValue("--color-surface").trim() || "#fff";

  const rect = container.getBoundingClientRect();
  const width = rect.width || 600;
  const height = rect.height || 280;
  const margin = { top: 32, right: 8, bottom: 48, left: 32 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  d3.select(container).selectAll("*").remove();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("aria-label", "Exercise progress chart")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xExtent = d3.extent(data, (d) => d.date);
  const yMax = d3.max(data, (d) => d.value) ?? 0;
  const yMin = d3.min(data, (d) => d.value) ?? 0;
  const yPad = (yMax - yMin) * 0.1 || yMax * 0.1;

  const x = d3.scaleTime().domain(xExtent).range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([Math.max(0, yMin - yPad), yMax + yPad])
    .range([innerH, 0]);

  // Grid lines
  const yTicks = y.ticks(5);
  g.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(yTicks)
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", colorOutline)
    .attr("stroke-width", 1)
    .attr("opacity", 0.25)
    .attr("stroke-dasharray", "4,4");

  // X axis
  const xAxisG = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width < 400 ? 4 : 6)
        .tickSize(4)
        .tickFormat((d) => formatDate(d)),
    );

  xAxisG.select(".domain").attr("stroke", colorOutline).attr("opacity", 0.4);
  xAxisG
    .selectAll(".tick line")
    .attr("stroke", colorOutline)
    .attr("opacity", 0.4);
  xAxisG
    .selectAll(".tick text")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit");

  // Y axis
  const yAxisG = g.append("g").call(
    d3
      .axisLeft(y)
      .ticks(5)
      .tickSize(4)
      .tickFormat((d) => d.toFixed(1)),
  );

  yAxisG.select(".domain").attr("stroke", colorOutline).attr("opacity", 0.4);
  yAxisG
    .selectAll(".tick line")
    .attr("stroke", colorOutline)
    .attr("opacity", 0.4);
  yAxisG
    .selectAll(".tick text")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit");

  // Area fill under the line
  const areaGen = d3
    .area()
    .x((d) => x(d.date))
    .y0(innerH)
    .y1((d) => y(d.value));

  const gradientId = `ex-grad-${Math.random().toString(36).slice(2)}`;
  const defs = svg.append("defs");
  const grad = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0")
    .attr("y1", "0")
    .attr("x2", "0")
    .attr("y2", "1");
  grad
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorOnSurface)
    .attr("stop-opacity", 0.15);
  grad
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorOnSurface)
    .attr("stop-opacity", 0);

  g.append("path")
    .datum(data)
    .attr("fill", `url(#${gradientId})`)
    .attr("d", areaGen);

  // Line
  const lineGen = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorOnSurface)
    .attr("stroke-width", 2)
    .attr("d", lineGen);

  // Dots
  g.selectAll("circle.dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value))
    .attr("r", 3)
    .attr("fill", colorOnSurface)
    .attr("opacity", 0.7);

  // Tooltip
  let tooltip = container.querySelector(".ex-graph-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "ex-graph-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity 0.1s;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);border-radius:2px;";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

  // Invisible overlay for hover interactions
  const bisectDate = d3.bisector((d) => d.date).left;

  const hoverLine = g
    .append("line")
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("stroke", colorOutline)
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0);

  const hoverDot = g
    .append("circle")
    .attr("r", 5)
    .attr("fill", colorOnSurface)
    .attr("stroke", colorSurface)
    .attr("stroke-width", 2)
    .attr("opacity", 0);

  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);
      const idx = bisectDate(data, hoveredDate, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      const d = d1 && hoveredDate - d0.date > d1.date - hoveredDate ? d1 : d0;
      if (!d) return;

      const cx = x(d.date);
      const cy = y(d.value);

      hoverLine.attr("x1", cx).attr("x2", cx).attr("opacity", 0.5);
      hoverDot.attr("cx", cx).attr("cy", cy).attr("opacity", 1);

      const dateLabel = formatDate(d.date);
      tooltip.innerHTML = `${dateLabel} &mdash; ${d.value.toFixed(1)} ${unit} 1RM`;

      const containerRect = container.getBoundingClientRect();
      const tx = event.clientX - containerRect.left;
      const ty = event.clientY - containerRect.top;
      const tipW = tooltip.offsetWidth || 160;
      tooltip.style.left = `${Math.min(tx + 12, containerRect.width - tipW - 8)}px`;
      tooltip.style.top = `${ty - 36}px`;
      tooltip.style.opacity = "1";
    })
    .on("mouseleave", () => {
      hoverLine.attr("opacity", 0);
      hoverDot.attr("opacity", 0);
      tooltip.style.opacity = "0";
    });

  // Y-axis label
  svg
    .append("text")
    .attr("transform", `rotate(-90)`)
    .attr("x", -(margin.top + innerH / 2))
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit");
};

const getPoints = () => {
  try {
    const dataEl = document.getElementById("exercise-graph-data");

    if (!dataEl) {
      return [];
    }

    return JSON.parse(dataEl.textContent);
  } catch (_) {
    return [];
  }
};

let exerciseGraphResizeObserver = null;

function initExerciseGraph() {
  const container = document.getElementById("exercise-graph");

  if (!container) {
    return;
  }

  let points = getPoints();

  renderExerciseGraph(container, points);

  if (exerciseGraphResizeObserver) {
    exerciseGraphResizeObserver.disconnect();
  }
  exerciseGraphResizeObserver = new ResizeObserver(() => {
    renderExerciseGraph(container, points);
  });
  exerciseGraphResizeObserver.observe(container);
}

document.addEventListener("DOMContentLoaded", initExerciseGraph);
