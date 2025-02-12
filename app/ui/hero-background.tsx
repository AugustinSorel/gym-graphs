export const HeroBackground = () => {
  return (
    <svg
      viewBox="0 0 1920 1080"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full min-w-[1000px] opacity-50"
      preserveAspectRatio="none"
    >
      <g className="contrast-150">
        <rect width="100%" height="100%" fill="url(#paint0_linear_9_46)" />
        <g filter="url(#blur-sm)">
          <path
            d="M1028.61 1087.75C811.445 356.138 44.283 293.866 -312.153 354.182C-847.442 407.977 -882.959 -105.523 -458.026 -169.099C-33.0929 -232.675 314.464 -161.763 956.303 406.754C1598.14 975.272 1865 966 1934.28 999.724C2324.96 1189.89 1300.05 2002.27 1028.61 1087.75Z"
            fill="url(#paint1_linear_9_46)"
          />
        </g>
        <g className="mix-blend-screen">
          <path
            d="M1125.01 1405.63C907.848 674.019 140.686 611.747 -215.75 672.063C-751.039 725.858 -786.556 212.358 -361.623 148.782C63.31 85.2055 410.867 156.117 1052.71 724.635C1694.54 1293.15 1803.63 947.152 2030.69 1317.61C2257.74 1688.06 1396.46 2320.15 1125.01 1405.63Z"
            fill="url(#paint2_linear_9_46)"
          />
        </g>
        <g className="mix-blend-color-dodge" filter="url(#blur-sm)">
          <path
            d="M2586.52 1122.76C2789.82 1175.61 3035.45 1068.57 3135.15 883.684L3430.62 335.752C3530.32 150.866 3446.34 -41.854 3243.04 -94.7009L2289.51 -342.569C2086.21 -395.416 1840.59 -288.378 1740.89 -103.492L1445.41 444.44C1345.72 629.326 1429.7 822.046 1633 874.893L2586.52 1122.76Z"
            fill="url(#paint3_radial_9_46)"
          />
        </g>
        <g className="mix-blend-color-dodge">
          <path
            d="M280.632 1348.02C483.929 1400.87 729.557 1293.83 829.256 1108.94L1124.73 561.009C1224.43 376.123 1140.44 183.403 937.147 130.556L-16.3819 -117.312C-219.679 -170.159 -465.307 -63.1206 -565.007 121.765L-860.478 669.697C-960.178 854.583 -876.195 1047.3 -672.897 1100.15L280.632 1348.02Z"
            fill="url(#paint4_radial_9_46)"
          />
        </g>
      </g>

      <defs>
        <filter
          id="blur-sm"
          x="0"
          y="0"
          width="100%"
          height="100%"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur stdDeviation="60" />
        </filter>
        <linearGradient
          id="paint0_linear_9_46"
          x1="50%"
          y1="0"
          x2="0"
          y2="200%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6070FF" />
          <stop offset="1" stopColor="#4D1B5F" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_9_46"
          x1="0"
          y1="0"
          x2="100%"
          y2="100%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5E31BD" />
          <stop offset="1" className="[stop-color:hsl(var(--background))]" />
        </linearGradient>
        <radialGradient
          id="paint3_radial_9_46"
          cx="115%"
          cy="50%"
          r="700"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#5BDCC6" />
          <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id="paint4_radial_9_46"
          cx="-5%"
          cy="75%"
          r="700"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            className="[stop-color:#43A392] sm:[stop-color:#5BDCC6]"
          />
          <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};
