const renderWeeklyVolumeTrend = (container, points, unit) => {
  d3.select(container).selectAll("*").remove();

  if (!points || points.length === 0) {
    container.innerHTML =
      '<p style="font-size:14px;text-align:center;padding:24px 0;color:var(--color-outline)">no sets yet</p>';
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";
  const colorSurface =
    style.getPropertyValue("--color-surface").trim() || "#fff";

  const toDisplay = (g) => (unit === "lbs" ? g / 453.592 : g / 1000);
  const fmtVolume = (g) => {
    const v = toDisplay(g);
    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(1);
  };

  const data = points.map((p) => ({
    date: new Date(p.weekStartUnixMs),
    volumeInG: p.volumeInG,
  }));

  const rect = container.getBoundingClientRect();
  const width = rect.width || 600;
  const margin = { top: 12, right: 8, bottom: 32, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = 120;
  const totalH = margin.top + innerH + margin.bottom;

  const xExtent = d3.extent(data, (d) => d.date);
  const yMax = d3.max(data, (d) => d.volumeInG) || 1;

  const x = d3.scaleTime().domain(xExtent).range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([0, yMax * 1.1])
    .range([innerH, 0])
    .nice();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", totalH)
    .attr("viewBox", `0 0 ${width} ${totalH}`)
    .attr("aria-label", "Weekly volume trend — last 12 weeks")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Horizontal grid lines
  const yTicks = y.ticks(3);
  g.selectAll(".grid-line")
    .data(yTicks)
    .join("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .attr("stroke", colorOutline)
    .attr("stroke-opacity", 0.2)
    .attr("stroke-width", 1);

  // X axis — month labels only
  const xAxisG = g
    .append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.timeMonth.every(1))
        .tickSize(3)
        .tickFormat((d) =>
          d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
        ),
    );
  xAxisG.select(".domain").remove();
  xAxisG
    .selectAll(".tick line")
    .attr("stroke", colorOutline)
    .attr("opacity", 0.3);
  xAxisG
    .selectAll(".tick text")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit");

  // Y axis
  const yAxisG = g
    .append("g")
    .call(
      d3
        .axisLeft(y)
        .tickValues(yTicks)
        .tickFormat((d) => fmtVolume(d))
        .tickSize(0),
    );
  yAxisG.select(".domain").remove();
  yAxisG
    .selectAll("text")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit")
    .attr("dx", "-4");

  // Gradient area fill
  const gradientId = `wvt-grad-${Math.random().toString(36).slice(2)}`;
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

  const areaGen = d3
    .area()
    .x((d) => x(d.date))
    .y0(innerH)
    .y1((d) => y(d.volumeInG));

  g.append("path")
    .datum(data)
    .attr("fill", `url(#${gradientId})`)
    .attr("d", areaGen);

  // Line
  const lineGen = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d.volumeInG));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorOnSurface)
    .attr("stroke-width", 2)
    .attr("d", lineGen);

  // Dots
  g.selectAll("circle.wvt-dot")
    .data(data)
    .join("circle")
    .attr("class", "wvt-dot")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.volumeInG))
    .attr("r", 3)
    .attr("fill", colorOnSurface)
    .attr("opacity", 0.7);

  // Tooltip
  let tooltip = container.querySelector(".wvt-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "wvt-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity 0.1s;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);border-radius:2px;";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

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
      const d =
        d1 && hoveredDate - d0.date > d1.date - hoveredDate ? d1 : d0;
      if (!d) return;

      const cx = x(d.date);
      const cy = y(d.volumeInG);

      hoverLine.attr("x1", cx).attr("x2", cx).attr("opacity", 0.5);
      hoverDot.attr("cx", cx).attr("cy", cy).attr("opacity", 1);

      const weekLabel = d.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
      tooltip.innerHTML = `w/o ${weekLabel} &mdash; ${fmtVolume(d.volumeInG)} ${unit}`;

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
};

const getWeeklyVolumeTrendData = () => {
  try {
    const el = document.getElementById("stats-weekly-volume-trend-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let weeklyVolumeTrendResizeObserver = null;

function initWeeklyVolumeTrend() {
  const container = document.getElementById("stats-weekly-volume-trend-graph");
  if (!container) return;

  const points = getWeeklyVolumeTrendData();
  const unit = container.dataset.unit || "kg";

  renderWeeklyVolumeTrend(container, points, unit);

  if (weeklyVolumeTrendResizeObserver) {
    weeklyVolumeTrendResizeObserver.disconnect();
  }
  weeklyVolumeTrendResizeObserver = new ResizeObserver(() => {
    renderWeeklyVolumeTrend(container, points, unit);
  });
  weeklyVolumeTrendResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initWeeklyVolumeTrend);
