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

function renderOneRepMaxChart(container) {
  const selectedAlgorithm = container.dataset.oneRepMaxAlgorithm || "epley";
  const lines = Object.entries(oneRepMaxFormulas).map(([name, formula]) => ({
    name,
    data: mockPoints.map((point, x) => ({
      x,
      y: formula(point.weight, point.repetitions),
    })),
  }));
  const maxY = d3.max(lines.flatMap((line) => line.data), (point) => point.y);
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 192;
  const x = d3.scaleLinear().domain([0, 5]).range([8, width - 8]);
  const y = d3.scaleLinear().domain([0, maxY]).range([height - 8, 8]);
  const drawLine = d3
    .line()
    .x((point) => x(point.x))
    .y((point) => y(point.y))
    .curve(d3.curveMonotoneX);

  container.replaceChildren();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", "One rep max curve");

  for (const line of lines) {
    const selected = line.name === selectedAlgorithm;
    svg
      .append("path")
      .datum(line.data)
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", selected ? 2 : 1)
      .attr("opacity", selected ? 1 : 0.2)
      .attr("d", drawLine);
  }
}

const chart = document.getElementById("one-rep-max-chart");
const algorithmSelect = document.getElementById("one-rep-max-algorithm");

if (chart && algorithmSelect) {
  renderOneRepMaxChart(chart);
  new ResizeObserver(() => renderOneRepMaxChart(chart)).observe(chart);

  algorithmSelect.addEventListener("change", (event) => {
    chart.dataset.oneRepMaxAlgorithm = event.target.value;
    renderOneRepMaxChart(chart);
  });
}
