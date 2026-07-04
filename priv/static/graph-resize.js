document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll("[data-graph-container]");

  if (!containers.length) return;

  const timers = new WeakMap();

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      const { width, height } = entry.contentRect;

      const endpoint = el.getAttribute("hx-get");

      const url = new URL(endpoint, window.location.origin);

      url.searchParams.set("width", Math.round(width));
      url.searchParams.set("height", Math.round(height));

      clearTimeout(timers.get(el));

      timers.set(
        el,
        setTimeout(() => {
          el.setAttribute("hx-get", url.toString());

          htmx.trigger(el, "graph-resize");
        }, 150),
      );
    }
  });

  for (const container of containers) {
    observer.observe(container);
  }
});
