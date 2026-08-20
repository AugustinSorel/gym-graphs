const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = 7;

const renderVolumeSessionGraph = (container, points, unit) => {
  d3.select(container).selectAll("*").remove();

  if (points.length === 0) {
    container.innerHTML =
      '<p style="font-size:12px;text-align:center;padding:24px 0;color:var(--color-outline)">no sets yet</p>';
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";

  const totalW = container.clientWidth || 200;

  const marginTop = 6;
  const marginBottom = 24; // day labels
  const marginLeft = 36;   // y-axis
  const marginRight = 4;
  const innerW = totalW - marginLeft - marginRight;
  const innerH = 120;
  const totalH = marginTop + innerH + marginBottom;

  // Build a map from dayOffset (-6…0) -> volumeInG
  const byOffset = new Map(points.map((p) => [p.dayOffset, p.volumeInG]));

  // 7 slots: index 0 = 6 days ago, index 6 = today
  const slots = d3.range(DAYS).map((i) => {
    const offset = i - (DAYS - 1); // -6 … 0
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      slotIndex: i,
      dayOffset: offset,
      label: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
      isToday: offset === 0,
      volumeInG: byOffset.get(offset) ?? 0,
    };
  });

  const maxVolume = d3.max(slots, (d) => d.volumeInG) || 1;
  const y = d3.scaleLinear().domain([0, maxVolume]).range([innerH, 0]).nice();

  const slotW = innerW / DAYS;
  const barW = Math.max(4, slotW * 0.45);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", totalH)
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .attr("aria-label", "Volume per session last 7 days")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`);

  // Volume formatter
  const formatVolume = (v) => {
    const converted = unit === "lb" ? v / 453.592 : v / 1000;
    return converted >= 1000
      ? `${(converted / 1000).toFixed(1)}k`
      : converted.toFixed(0);
  };

  // Horizontal grid lines at each y tick, spanning full inner width
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

  // Y-axis
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(formatVolume)
        .tickSize(0),
    )
    .call((ax) => ax.select(".domain").remove())
    .selectAll("text")
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit")
    .attr("dx", "-4");

  // Baseline
  g.append("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", innerH)
    .attr("y2", innerH)
    .attr("stroke", colorOutline)
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 1);

  // Tooltip
  let tooltip = container.querySelector(".vol-session-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "vol-session-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity 0.1s;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);border-radius:2px;";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

  // Slot groups
  const slotG = g
    .selectAll(".slot")
    .data(slots)
    .join("g")
    .attr("class", "slot")
    .attr("transform", (d) => `translate(${d.slotIndex * slotW},0)`);

  // Filled bar — solid color, no opacity, only when data exists
  slotG
    .filter((d) => d.volumeInG > 0)
    .append("rect")
    .attr("x", (slotW - barW) / 2)
    .attr("y", (d) => y(d.volumeInG))
    .attr("width", barW)
    .attr("height", (d) => innerH - y(d.volumeInG))
    .attr("fill", colorOnSurface)
    .attr("rx", 2);

  // Date labels — only first and last slot
  slotG
    .filter((d) => d.slotIndex === 0 || d.slotIndex === DAYS - 1)
    .append("text")
    .attr("x", slotW / 2)
    .attr("y", innerH + 16)
    .attr("text-anchor", (d) => (d.slotIndex === 0 ? "start" : "end"))
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit")
    .text((d) => d.label);

  // Invisible hit area for tooltip (only slots with data)
  slotG
    .filter((d) => d.volumeInG > 0)
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", slotW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mouseover", function (event, d) {
      const converted =
        unit === "lb" ? d.volumeInG / 453.592 : d.volumeInG / 1000;
      const formatted =
        converted >= 1000
          ? `${(converted / 1000).toFixed(2)}k`
          : converted.toFixed(1);
      tooltip.textContent = `${d.label} — ${formatted} ${unit}`;

      const containerRect = container.getBoundingClientRect();
      const tx = event.clientX - containerRect.left;
      const ty = event.clientY - containerRect.top;
      const tipW = tooltip.offsetWidth || 160;
      tooltip.style.left = `${Math.min(tx + 12, containerRect.width - tipW - 8)}px`;
      tooltip.style.top = `${ty - 36}px`;
      tooltip.style.opacity = "1";
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = "0";
    });
};

const getVolumeSessionData = () => {
  try {
    const el = document.getElementById("exercise-volume-session-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let volumeSessionResizeObserver = null;

function initVolumeSessionGraph() {
  const container = document.getElementById("exercise-volume-session-graph");
  if (!container) return;

  const points = getVolumeSessionData();
  const unit = container.dataset.unit || "kg";

  renderVolumeSessionGraph(container, points, unit);

  if (volumeSessionResizeObserver) {
    volumeSessionResizeObserver.disconnect();
  }
  volumeSessionResizeObserver = new ResizeObserver(() => {
    renderVolumeSessionGraph(container, points, unit);
  });
  volumeSessionResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initVolumeSessionGraph);
