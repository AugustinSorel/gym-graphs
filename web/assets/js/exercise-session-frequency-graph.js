const WEEKS = 8;
const FREQ_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MAX_SESSIONS_PER_WEEK = 7;

const renderSessionFrequencyGraph = (container, points) => {
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

  const marginTop = 8;
  const marginBottom = 24; // date labels
  const marginLeft = 20; // y-axis
  const marginRight = 4;
  const innerW = totalW - marginLeft - marginRight;
  const innerH = 80;
  const totalH = marginTop + innerH + marginBottom;

  // Build map from weekOffset (-7…0) -> sessionCount
  const byOffset = new Map(points.map((p) => [p.weekOffset, p.sessionCount]));

  // 8 slots: index 0 = 7 weeks ago, index 7 = current week
  const slots = d3.range(WEEKS).map((i) => {
    const offset = i - (WEEKS - 1); // -7 … 0
    const date = new Date();
    const weekday = date.getDay() === 0 ? 7 : date.getDay();
    date.setDate(date.getDate() - (weekday - 1) + offset * 7);
    return {
      slotIndex: i,
      weekOffset: offset,
      label: `${FREQ_MONTHS[date.getMonth()]} ${date.getDate()}`,
      isCurrentWeek: offset === 0,
      sessionCount: byOffset.get(offset) ?? 0,
    };
  });

  // X: slot index -> center x position
  const slotW = innerW / WEEKS;
  const cx = (d) => d.slotIndex * slotW + slotW / 2;

  // Dot radius scaled by session count (0 = invisible, 7 = max)
  const maxR = Math.min(slotW / 2 - 2, innerH / 2 - 4);
  const rScale = d3
    .scaleSqrt()
    .domain([0, MAX_SESSIONS_PER_WEEK])
    .range([0, maxR]);

  // Y: fixed center line
  const cy = innerH / 2;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", totalH)
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .attr("aria-label", "Session frequency last 8 weeks")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`);

  // Subtle guide line through the center
  g.append("line")
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", cy)
    .attr("y2", cy)
    .attr("stroke", colorOutline)
    .attr("stroke-opacity", 0.15)
    .attr("stroke-width", 1);

  // Tooltip
  let tooltip = container.querySelector(".freq-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "freq-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity 0.1s;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);border-radius:2px;";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

  // Empty-week ghost dots
  g.selectAll(".dot-ghost")
    .data(slots.filter((d) => d.sessionCount === 0))
    .join("circle")
    .attr("class", "dot-ghost")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", rScale(1) * 0.5)
    .attr("fill", "none")
    .attr("stroke", colorOutline)
    .attr("stroke-opacity", 0.2)
    .attr("stroke-width", 1);

  // Filled dots
  g.selectAll(".dot")
    .data(slots.filter((d) => d.sessionCount > 0))
    .join("circle")
    .attr("class", "dot")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", (d) => rScale(d.sessionCount))
    .attr("fill", colorOnSurface);

  // Invisible hit areas (full slot column)
  g.selectAll(".hit")
    .data(slots)
    .join("rect")
    .attr("class", "hit")
    .attr("x", (d) => d.slotIndex * slotW)
    .attr("y", 0)
    .attr("width", slotW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mouseover", function (event, d) {
      if (d.sessionCount === 0) {
        tooltip.textContent = `${d.label} — no sessions`;
      } else {
        const s = d.sessionCount === 1 ? "session" : "sessions";
        tooltip.textContent = `${d.label} — ${d.sessionCount} ${s}`;
      }
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

  // Date labels — first and last slot only
  g.selectAll(".date-label")
    .data(slots.filter((d) => d.slotIndex === 0 || d.slotIndex === WEEKS - 1))
    .join("text")
    .attr("class", "date-label")
    .attr("x", cx)
    .attr("y", innerH + 16)
    .attr("text-anchor", (d) => (d.slotIndex === 0 ? "start" : "end"))
    .attr("fill", colorOutline)
    .attr("font-size", "10px")
    .attr("font-family", "inherit")
    .text((d) => d.label);
};

const getSessionFrequencyData = () => {
  try {
    const el = document.getElementById("exercise-session-frequency-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let sessionFrequencyResizeObserver = null;

function initSessionFrequencyGraph() {
  const container = document.getElementById("exercise-session-frequency-graph");
  if (!container) return;

  const points = getSessionFrequencyData();

  renderSessionFrequencyGraph(container, points);

  if (sessionFrequencyResizeObserver) {
    sessionFrequencyResizeObserver.disconnect();
  }
  sessionFrequencyResizeObserver = new ResizeObserver(() => {
    renderSessionFrequencyGraph(container, points);
  });
  sessionFrequencyResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initSessionFrequencyGraph);
