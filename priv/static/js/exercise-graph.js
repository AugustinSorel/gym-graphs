const formatExerciseGraphDate = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function renderExerciseGraph(container, points) {
  const unit = container.dataset.unit || "kg";
  const data = points.map((point) => ({
    date: new Date(point.date),
    value: point.oneRepMax,
  }));

  if (data.length === 0) {
    container.replaceChildren();
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";
  const colorSurface =
    style.getPropertyValue("--color-surface").trim() || "#fff";
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 280;
  const margin = { top: 32, right: 8, bottom: 48, left: 32 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  container.replaceChildren();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("aria-label", "Exercise progress chart")
    .attr("role", "img");
  const graph = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (point) => point.date))
    .range([0, innerWidth]);
  const max = d3.max(data, (point) => point.value) ?? 0;
  const min = d3.min(data, (point) => point.value) ?? 0;
  const padding = (max - min) * 0.1 || max * 0.1;
  const y = d3
    .scaleLinear()
    .domain([Math.max(0, min - padding), max + padding])
    .range([innerHeight, 0]);

  graph
    .append("g")
    .selectAll("line")
    .data(y.ticks(5))
    .join("line")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", (value) => y(value))
    .attr("y2", (value) => y(value))
    .attr("stroke", colorOutline)
    .attr("opacity", 0.25)
    .attr("stroke-dasharray", "4,4");

  const xAxis = graph
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width < 400 ? 4 : 6)
        .tickSize(4)
        .tickFormat(formatExerciseGraphDate),
    );
  const yAxis = graph
    .append("g")
    .call(d3.axisLeft(y).ticks(5).tickSize(4).tickFormat(d3.format(".1f")));

  for (const axis of [xAxis, yAxis]) {
    axis.select(".domain").attr("stroke", colorOutline).attr("opacity", 0.4);
    axis
      .selectAll(".tick line")
      .attr("stroke", colorOutline)
      .attr("opacity", 0.4);
    axis
      .selectAll(".tick text")
      .attr("fill", colorOutline)
      .attr("font-size", "10px")
      .attr("font-family", "inherit");
  }

  const gradientId = `exercise-gradient-${Math.random().toString(36).slice(2)}`;
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0")
    .attr("y1", "0")
    .attr("x2", "0")
    .attr("y2", "1");
  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorOnSurface)
    .attr("stop-opacity", 0.15);
  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorOnSurface)
    .attr("stop-opacity", 0);

  graph
    .append("path")
    .datum(data)
    .attr("fill", `url(#${gradientId})`)
    .attr(
      "d",
      d3
        .area()
        .x((point) => x(point.date))
        .y0(innerHeight)
        .y1((point) => y(point.value)),
    );
  graph
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorOnSurface)
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .line()
        .x((point) => x(point.date))
        .y((point) => y(point.value)),
    );
  graph
    .selectAll("circle.dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (point) => x(point.date))
    .attr("cy", (point) => y(point.value))
    .attr("r", 3)
    .attr("fill", colorOnSurface)
    .attr("opacity", 0.7);

  const tooltip = document.createElement("div");
  tooltip.style.cssText =
    "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);";
  container.style.position = "relative";
  container.appendChild(tooltip);

  const hoverLine = graph
    .append("line")
    .attr("y1", 0)
    .attr("y2", innerHeight)
    .attr("stroke", colorOutline)
    .attr("stroke-dasharray", "4,3")
    .attr("opacity", 0);
  const hoverDot = graph
    .append("circle")
    .attr("r", 5)
    .attr("fill", colorOnSurface)
    .attr("stroke", colorSurface)
    .attr("stroke-width", 2)
    .attr("opacity", 0);
  const findDate = d3.bisector((point) => point.date).left;

  graph
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", (event) => {
      const hoveredDate = x.invert(d3.pointer(event)[0]);
      const index = findDate(data, hoveredDate, 1);
      const before = data[index - 1];
      const after = data[index];
      const point =
        after && hoveredDate - before.date > after.date - hoveredDate
          ? after
          : before;
      if (!point) return;

      const cx = x(point.date);
      hoverLine.attr("x1", cx).attr("x2", cx).attr("opacity", 0.5);
      hoverDot
        .attr("cx", cx)
        .attr("cy", y(point.value))
        .attr("opacity", 1);
      tooltip.textContent = `${formatExerciseGraphDate(point.date)} - ${point.value.toFixed(1)} ${unit} 1RM`;

      const bounds = container.getBoundingClientRect();
      const left = event.clientX - bounds.left;
      tooltip.style.left = `${Math.min(left + 12, bounds.width - tooltip.offsetWidth - 8)}px`;
      tooltip.style.top = `${event.clientY - bounds.top - 36}px`;
      tooltip.style.opacity = "1";
    })
    .on("mouseleave", () => {
      hoverLine.attr("opacity", 0);
      hoverDot.attr("opacity", 0);
      tooltip.style.opacity = "0";
    });
}

function exerciseGraphPoints() {
  const data = document.getElementById("exercise-graph-data");
  if (!data) return [];

  try {
    return JSON.parse(data.textContent);
  } catch (_) {
    return [];
  }
}

const exerciseGraph = document.getElementById("exercise-graph");

if (exerciseGraph) {
  const points = exerciseGraphPoints();
  renderExerciseGraph(exerciseGraph, points);
  new ResizeObserver(() => renderExerciseGraph(exerciseGraph, points)).observe(
    exerciseGraph,
  );
}
