// stats-heatmap.js — GitHub-style training calendar (26 weeks × 7 days).
//
// Data contract (from stats-heatmap-data script tag):
//   Array of { date: number (unix ms, midnight UTC), volumeInG: number }
// Only training days are present; empty days are synthesised here.

const HEATMAP_WEEKS = 26;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Render (or re-render) the heatmap into `container`.
 * @param {HTMLElement} container
 * @param {Array<{date: number, volumeInG: number}>} data
 * @param {string} unit  "kg" | "lbs"
 */
const renderHeatmap = (container, data, unit) => {
  d3.select(container).selectAll("*").remove();

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";
  const colorOutline =
    style.getPropertyValue("--color-outline").trim() || "#888";

  // ── Grid geometry ──────────────────────────────────────────────────────────
  // Figure out today's ISO weekday (1=Mon … 7=Sun).
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const isoWeekday = todayUTC.getUTCDay() === 0 ? 7 : todayUTC.getUTCDay(); // 1–7

  // The rightmost column is the current (partial) week.
  // Its Monday = todayUTC minus (isoWeekday - 1) days.
  const currentWeekMonday = new Date(todayUTC);
  currentWeekMonday.setUTCDate(todayUTC.getUTCDate() - (isoWeekday - 1));

  // Build the 26-week × 7-day grid: array of 182 Date objects (or null for
  // future days inside the current week).
  // weeks[0] is the oldest week, weeks[25] is the current week.
  const weeks = [];
  for (let w = HEATMAP_WEEKS - 1; w >= 0; w--) {
    const weekMonday = new Date(currentWeekMonday);
    weekMonday.setUTCDate(currentWeekMonday.getUTCDate() - w * 7);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday);
      day.setUTCDate(weekMonday.getUTCDate() + d);
      // Mark future days as null so we don't draw them.
      days.push(day <= todayUTC ? day : null);
    }
    weeks.push(days);
  }

  // Build lookup: unix-ms-key → volumeInG
  const byDate = new Map(data.map((p) => [p.date, p.volumeInG]));

  // ── Volume scale ───────────────────────────────────────────────────────────
  const volumes = data.map((p) => p.volumeInG);
  const maxVolume = volumes.length > 0 ? Math.max(...volumes) : 1;

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const totalW = container.clientWidth || 300;

  const marginTop = 4;
  const marginBottom = 24; // month labels
  const marginLeft = 30; // weekday labels
  const marginRight = 4;

  const innerW = totalW - marginLeft - marginRight;
  const cellSize = Math.max(4, Math.floor(innerW / HEATMAP_WEEKS));
  const gap = Math.max(1, Math.floor(cellSize * 0.15));
  const cellOuter = cellSize; // total cell pitch (cell + gap already folded in below)

  // We derive actual cell draw size from pitch minus gap.
  const cellDraw = cellOuter - gap;

  const innerH = 7 * cellOuter - gap;
  const totalH = marginTop + innerH + marginBottom;

  // ── SVG ────────────────────────────────────────────────────────────────────
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", totalH)
    .attr("viewBox", `0 0 ${totalW} ${totalH}`)
    .attr("aria-label", "Training calendar — last 26 weeks")
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`);

  // ── Weekday labels (y-axis) — Mon, Wed, Fri ────────────────────────────────
  [0, 2, 4].forEach((di) => {
    g.append("text")
      .attr("x", -4)
      .attr("y", di * cellOuter + cellDraw / 2 + 1)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", colorOutline)
      .attr("font-size", "9px")
      .attr("font-family", "inherit")
      .text(DAY_LABELS[di]);
  });

  // ── Month labels (x-axis) ─────────────────────────────────────────────────
  // Place a label at the first week where the month changes (Monday of that week).
  const MONTH_NAMES = [
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
  let lastMonth = -1;
  weeks.forEach((days, wi) => {
    const monday = days[0]; // first day of this week (Mon); always non-null
    if (!monday) return;
    const m = monday.getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      g.append("text")
        .attr("x", wi * cellOuter)
        .attr("y", innerH + 14)
        .attr("fill", colorOutline)
        .attr("font-size", "9px")
        .attr("font-family", "inherit")
        .text(MONTH_NAMES[m]);
    }
  });

  // ── Tooltip ────────────────────────────────────────────────────────────────
  let tooltip = container.querySelector(".heatmap-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "heatmap-tooltip";
    tooltip.style.cssText =
      "position:absolute;pointer-events:none;padding:4px 10px;" +
      "font-size:11px;font-weight:600;white-space:nowrap;opacity:0;" +
      "transition:opacity 0.1s;" +
      "background:var(--color-on-surface,#000);color:var(--color-surface,#fff);";
    container.style.position = "relative";
    container.appendChild(tooltip);
  }

  const formatVolume = (v) => {
    const converted = unit === "lbs" ? v / 453.592 : v / 1000;
    return converted >= 1000
      ? `${(converted / 1000).toFixed(1)}k ${unit}`
      : `${converted.toFixed(1)} ${unit}`;
  };

  const formatDate = (d) => {
    return d.toLocaleDateString(undefined, {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ── Cells ──────────────────────────────────────────────────────────────────
  weeks.forEach((days, wi) => {
    days.forEach((day, di) => {
      if (day === null) return; // future day — skip entirely

      const key = day.getTime();
      const volume = byDate.get(key) ?? 0;

      // Opacity: ghost for rest days, scaled for training days.
      // We use a square-root scale to make low volumes more visible.
      let opacity;
      if (volume === 0) {
        opacity = 0.08;
      } else {
        // sqrt scale: even small training days get a decent shade
        opacity = 0.2 + 0.8 * Math.sqrt(volume / maxVolume);
      }

      const rect = g
        .append("rect")
        .attr("x", wi * cellOuter)
        .attr("y", di * cellOuter)
        .attr("width", cellDraw)
        .attr("height", cellDraw)
        .attr("fill", colorOnSurface)
        .attr("fill-opacity", opacity);

      if (volume > 0) {
        rect
          .style("cursor", "pointer")
          .on("mouseover", function (event) {
            tooltip.textContent = `${formatDate(day)} — ${formatVolume(volume)}`;

            const containerRect = container.getBoundingClientRect();
            const tx = event.clientX - containerRect.left;
            const ty = event.clientY - containerRect.top;
            const tipW = tooltip.offsetWidth || 180;
            tooltip.style.left = `${Math.min(tx + 12, containerRect.width - tipW - 8)}px`;
            tooltip.style.top = `${Math.max(0, ty - 36)}px`;
            tooltip.style.opacity = "1";
          })
          .on("mouseleave", () => {
            tooltip.style.opacity = "0";
          });
      }
    });
  });

  // If there is genuinely no data at all, add a note.
  if (data.length === 0) {
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", colorOutline)
      .attr("font-size", "12px")
      .attr("font-family", "inherit")
      .text("no training data yet");
  }
};

// ── Bootstrap ────────────────────────────────────────────────────────────────

const getHeatmapData = () => {
  try {
    const el = document.getElementById("stats-heatmap-data");
    if (!el) return [];
    return JSON.parse(el.textContent);
  } catch (_) {
    return [];
  }
};

let heatmapResizeObserver = null;

function initHeatmap() {
  const container = document.getElementById("stats-heatmap");
  if (!container) return;

  const data = getHeatmapData();
  const unit = container.dataset.unit || "kg";

  renderHeatmap(container, data, unit);

  if (heatmapResizeObserver) {
    heatmapResizeObserver.disconnect();
  }
  heatmapResizeObserver = new ResizeObserver(() => {
    renderHeatmap(container, data, unit);
  });
  heatmapResizeObserver.observe(document.documentElement);
}

document.addEventListener("DOMContentLoaded", initHeatmap);
