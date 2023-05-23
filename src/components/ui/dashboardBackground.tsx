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
        className="opacity-10 dark:opacity-[0.15]"
      />

      <ellipse
        cx="0"
        cy="0"
        rx="60%"
        ry="60%"
        className="fill-brand-color-one opacity-50 blur-[200px] dark:opacity-20"
      />

      <ellipse
        cx="100%"
        cy="100%"
        rx="60%"
        ry="60%"
        className="fill-brand-color-two opacity-50 blur-[200px] dark:opacity-20"
      />
    </svg>
  );
};
