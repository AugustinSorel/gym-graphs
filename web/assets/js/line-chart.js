const oneRepMaxFormulas = {
  adams: (w, r) => w / (1 - 0.02 * r),
  baechle: (w, r) => w * (1 + 0.033 * r),
  berger: (w, r) => w / Math.pow(1.0261, 0.0262 * r),
  brown: (w, r) => w * (0.9849 + 0.0328 * r),
  brzycki: (w, r) => w * (36 / (37 - r)),
  epley: (w, r) => w * (1 + r / 30),
  kemmler: (w, r) =>
    w * (0.988 + 0.0104 * r + 0.0019 * r * r - 0.0000584 * r * r * r),
  landers: (w, r) => w / (1.013 - 0.0267123 * r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
  mayhew: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
  naclerio: (w, r) => w / (0.951 * Math.exp(-0.021 * r)),
  oconner: (w, r) => w * (1 + 0.025 * r),
  wathen: (w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r)),
};

const mockPoints = [
  { repetitions: 1, weight: 1 },
  { repetitions: 5, weight: 5 },
  { repetitions: 10, weight: 10 },
  { repetitions: 15, weight: 15 },
  { repetitions: 20, weight: 20 },
  { repetitions: 25, weight: 25 },
];

const buildAlgoLines = () =>
  Object.entries(oneRepMaxFormulas).map(([name, formula]) => ({
    name,
    data: mockPoints.map((point, i) => ({
      x: i,
      y: formula(point.weight, point.repetitions),
    })),
  }));

const renderOneRepMaxChart = (container) => {
  const selectedAlgorithm = container.dataset.oneRepMaxAlgorithm || "epley";

  const algoLines = buildAlgoLines();
  const allPoints = algoLines.flatMap((l) => l.data);
  const maxX = d3.max(allPoints, (d) => d.x) ?? 0;
  const maxY = d3.max(allPoints, (d) => d.y) ?? 0;

  const style = getComputedStyle(document.documentElement);
  const colorOnSurface =
    style.getPropertyValue("--color-on-surface").trim() || "#000";

  const rect = container.getBoundingClientRect();
  const width = rect.width || 400;
  const height = rect.height || 192;
  const margin = { top: 8, right: 8, bottom: 8, left: 8 };
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

  const x = d3.scaleLinear().domain([0, maxX]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, maxY]).range([innerH, 0]);

  const lineGen = d3
    .line()
    .x((d) => x(d.x))
    .y((d) => y(d.y))
    .curve(d3.curveMonotoneX);

  const sorted = [
    ...algoLines.filter((l) => l.name !== selectedAlgorithm),
    algoLines.find((l) => l.name === selectedAlgorithm),
  ].filter(Boolean);

  for (const line of sorted) {
    const isSelected = line.name === selectedAlgorithm;
    g.append("path")
      .datum(line.data)
      .attr("fill", "none")
      .attr("stroke", colorOnSurface)
      .attr("stroke-width", isSelected ? 2 : 1)
      .attr("opacity", isSelected ? 1 : 0.2)
      .attr("d", lineGen);
  }
};

let oneRepMaxResizeObserver = null;

function initOneRepMaxChart() {
  const container = document.getElementById("one-rep-max-chart");
  if (!container) return;

  renderOneRepMaxChart(container);

  if (oneRepMaxResizeObserver) {
    oneRepMaxResizeObserver.disconnect();
  }
  oneRepMaxResizeObserver = new ResizeObserver(() => {
    renderOneRepMaxChart(container);
  });
  oneRepMaxResizeObserver.observe(container);
}

document.addEventListener("DOMContentLoaded", initOneRepMaxChart);

document.addEventListener("one-rep-max-algorithm-changed", (e) => {
  const container = document.getElementById("one-rep-max-chart");
  if (!container) return;
  container.dataset.oneRepMaxAlgorithm = e.detail.value;
  renderOneRepMaxChart(container);
});
