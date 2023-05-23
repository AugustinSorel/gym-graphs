export const DashboardBackground = () => {
  return (
    <svg width="100%" height="100%" className="h-full w-full">
      <pattern
        id="pattern-circles"
        x="0"
        y="0"
        width="30"
        height="30"
        patternUnits="userSpaceOnUse"
        patternContentUnits="userSpaceOnUse"
      >
        <circle
          id="pattern-circle"
          cx="10"
          cy="10"
          r="1.5"
          className="fill-current"
        />
      </pattern>

      <rect
        id="rect"
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#pattern-circles)"
        className="opacity-10"
      />

      <ellipse
        cx="0"
        cy="0"
        rx="40%"
        ry="40%"
        className="fill-brand-color-one opacity-70 blur-[200px] dark:opacity-40"
      />

      <ellipse
        cx="100%"
        cy="100%"
        rx="40%"
        ry="40%"
        className="fill-brand-color-two opacity-70 blur-[200px] dark:opacity-30"
      />
    </svg>
  );
};
