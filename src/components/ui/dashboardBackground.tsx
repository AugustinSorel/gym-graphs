export const DashboardBackground = () => {
  return (
    <svg width="100%" height="100%" className="h-full w-full">
      <filter
        id="dashboardBackgroundBlur"
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="150" />
      </filter>
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
        filter="url(#dashboardBackgroundBlur)"
        className="fill-brand-color-one opacity-30 dark:opacity-20"
      />
      <ellipse
        cx="100%"
        cy="100%"
        rx="60%"
        ry="60%"
        filter="url(#dashboardBackgroundBlur)"
        className="fill-brand-color-two opacity-30 dark:opacity-20"
      />
    </svg>
  );
};
