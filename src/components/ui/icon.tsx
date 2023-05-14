export const Icon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      fill="none"
      className="h-6 w-6 rounded-full drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] duration-300 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]"
    >
      <circle cx="25" cy="25" r="25" fill="url(#gradient)" />
      <path
        d="M50 25C50 28.283 49.3534 31.5339 48.097 34.5671C46.8406 37.6002 44.9991 40.3562 42.6777 42.6777C40.3562 44.9991 37.6002 46.8406 34.5671 48.097C31.5339 49.3534 28.283 50 25 50C21.717 50 18.4661 49.3534 15.4329 48.097C12.3998 46.8406 9.64379 44.9991 7.32233 42.6777C5.00086 40.3562 3.15938 37.6002 1.90301 34.5671C0.646644 31.5339 -2.87013e-07 28.283 0 25L25 25H50Z"
        className="fill-primary"
      />
      <defs>
        <linearGradient
          id="gradient"
          x1="100%"
          y1="50%"
          x2="50%"
          y2="50%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="hsl(var(--brand-color-two))" />
          <stop offset="1" stopColor="hsl(var(--brand-color-one))" />
        </linearGradient>
      </defs>
    </svg>
  );
};
