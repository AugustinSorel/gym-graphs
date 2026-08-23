const renderVolumeByTagGraph = (container, points, unit) => {
  d3.select(container).selectAll("*").remove();

  if (!points || points.length === 0) {
    container.innerHTML =
      '<p style="font-size:14px;text-align:center;padding:24px 0;color:var(--color-outline)">no tagged sets in the last 7 days</p>';
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";

  const toDisplayUnit = (grams) =>
    unit === "lbs" ? grams / 453.592 : grams / 1000;

  const formatValue = (grams) => {
    const v = toDisplayUnit(grams);
    return v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1);
  };

  const rect = container.getBoundingClientRect();
  const width = rect.width || 300;

  const barH = 8;
  const labelH = 14;
  const rowH = labelH + barH;
  const gap = 12;
  const height = points.length * rowH + (points.length - 1) * gap;

  const maxVolume = d3.max(points, (d) => d.volumeInG) || 1;
  const totalVolume = d3.sum(points, (d) => d.volumeInG);

  const x = d3.scaleLinear().domain([0, maxVolume]).range([0, width]);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("aria-label", "Volume by muscle group chart")
    .attr("role", "img");

  const rows = svg
    .selectAll(".row")
    .data(points)
    .join("g")
    .attr("class", "row")
    .attr("transform", (_, i) => `translate(0,${i * (rowH + gap)})`);

  // Tag name label (left)
  rows
    .append("text")
    .attr("x", 0)
    .attr("y", labelH - 4)
    .attr("fill", colorOutline)
    .attr("font-size", "12px")
    .attr("font-family", "inherit")
    .text((d) => d.tagName);

  // Volume value (right)
  rows
    .append("text")
    .attr("x", width)
    .attr("y", labelH - 4)
    .attr("text-anchor", "end")
    .attr("fill", colorOutline)
    .attr("font-size", "12px")
    .attr("font-family", "inherit")
    .text((d) => `${formatValue(d.volumeInG)} ${unit}`);

  // Background track
  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", labelH)
    .attr("width", width)
    .attr("height", barH)
    .attr("fill", colorOutline)
    .attr("opacity", 0.15)
    .attr("rx", 1);

  // Filled bar — width proportional to volume relative to max tag
  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", labelH)
    .attr("width", (d) => (d.volumeInG > 0 ? x(d.volumeInG) : 0))
    .attr("height", barH)
    .attr("fill", colorOnSurface)
    .attr("opacity", 0.85)
    .attr("rx", 1);

  // Tooltip
  let tooltip = container.querySelector(".volume-by-tag-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "volume-by-tag-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;font-size:11px;font-weight:600;white-space:nowrap;opacity:0;transition:opacity 0.1s;background:var(--color-on-surface,#000);color:var(--color-surface,#fff);border-radius:2px;";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

  // Invisible hit area over each row for hover
  rows
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", rowH)
    .attr("fill", "transparent")
    .on("mouseover", function (event, d) {
      const pct =
        totalVolume > 0 ? ((d.volumeInG / totalVolume) * 100).toFixed(0) : 0;
      tooltip.textContent = `${d.tagName} — ${formatValue(d.volumeInG)} ${unit} (${pct}%)`;

      const containerRect = container.getBoundingClientRect();
      const tx = event.clientX - containerRect.left;
      const ty = event.clientY - containerRect.top;
      const tipW = tooltip.offsetWidth || 180;
      tooltip.style.left = `${Math.min(tx + 12, containerRect.width - tipW - 8)}px`;
      tooltip.style.top = `${ty - 36}px`;
      tooltip.style.opacity = "1";
    })
    .on("mouseleave", () => {
      tooltip.style.opacity = "0";
    });
};

const getVolumeByTagData = () => {
  try {
    const el = document.getElementById("stats-volume-by-tag-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let volumeByTagResizeObserver = null;

function initVolumeByTagGraph() {
  const container = document.getElementById("stats-volume-by-tag-graph");
  if (!container) return;

  const points = getVolumeByTagData();
  const unit = container.dataset.unit || "kg";

  renderVolumeByTagGraph(container, points, unit);

  if (volumeByTagResizeObserver) {
    volumeByTagResizeObserver.disconnect();
  }
  volumeByTagResizeObserver = new ResizeObserver(() => {
    renderVolumeByTagGraph(container, points, unit);
  });
  volumeByTagResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initVolumeByTagGraph);
