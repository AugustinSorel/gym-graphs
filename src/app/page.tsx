import { Button } from "@/components/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="mx-auto flex h-[calc(100vh-32px-25px)] max-w-md flex-col items-center justify-center gap-14 text-center sm:max-w-3xl">
        <h1 className="text-4xl font-bold sm:text-7xl">
          Monitor your gym progress{" "}
          <strong className="bg-brand-gradient bg-clip-text font-bold text-transparent">
            with ease
          </strong>
        </h1>

        <p className="px-4 sm:px-20 sm:text-2xl">
          Gym-tracker is a simple modular and free monitoring application with
          features like{" "}
          <strong className="font-normal text-accent">graphs</strong>,{" "}
          <strong className="font-normal text-accent">heat maps</strong> and{" "}
          <strong className="font-normal text-accent">dashboard</strong>, for
          you for free.
        </p>

        <Button asChild size="lg">
          <Link href="/login">
            <span className="sm:text-xl">get started</span>
            <ArrowRight className="ml-2" />
          </Link>
        </Button>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1890 1027"
          className="absolute inset-0 left-0 top-0 -z-10 h-full w-full"
          preserveAspectRatio="none"
        >
          <rect
            width="100%"
            height="100%"
            filter="url(#noise)"
            className="opacity-30"
          />
          <g clipPath="url(#clip0_9_46)" className="opacity-50">
            <rect
              width="1027"
              height="1890"
              transform="matrix(-6.88803e-08 -1 -1 2.77392e-08 1890 1027)"
              fill="url(#paint0_linear_9_46)"
            />
            <g filter="url(#filter0_f_9_46)">
              <path
                d="M1028.61 1087.75C811.445 356.138 44.283 293.866 -312.153 354.182C-847.442 407.977 -882.959 -105.523 -458.026 -169.099C-33.0929 -232.675 314.464 -161.763 956.303 406.754C1598.14 975.272 1865 966 1934.28 999.724C2324.96 1189.89 1300.05 2002.27 1028.61 1087.75Z"
                fill="url(#paint1_linear_9_46)"
              />
            </g>
            <g className="mix-blend-screen" filter="url(#filter1_f_9_46)">
              <path
                d="M1125.01 1405.63C907.848 674.019 140.686 611.747 -215.75 672.063C-751.039 725.858 -786.556 212.358 -361.623 148.782C63.31 85.2055 410.867 156.117 1052.71 724.635C1694.54 1293.15 1803.63 947.152 2030.69 1317.61C2257.74 1688.06 1396.46 2320.15 1125.01 1405.63Z"
                fill="url(#paint2_linear_9_46)"
              />
            </g>
            <g className="mix-blend-screen" filter="url(#filter2_f_9_46)">
              <path
                d="M2586.52 1122.76C2789.82 1175.61 3035.45 1068.57 3135.15 883.684L3430.62 335.752C3530.32 150.866 3446.34 -41.8539 3243.04 -94.7009L2289.51 -342.569C2086.21 -395.416 1840.59 -288.378 1740.89 -103.492L1445.41 444.44C1345.72 629.326 1429.7 822.046 1633 874.893L2586.52 1122.76Z"
                fill="url(#paint3_radial_9_46)"
              />
            </g>
            <g className="mix-blend-screen" filter="url(#filter3_f_9_46)">
              <path
                d="M280.632 1348.02C483.929 1400.87 729.557 1293.83 829.256 1108.94L1124.73 561.009C1224.43 376.123 1140.44 183.403 937.147 130.556L-16.3819 -117.312C-219.679 -170.159 -465.307 -63.1206 -565.007 121.765L-860.478 669.697C-960.178 854.583 -876.195 1047.3 -672.897 1100.15L280.632 1348.02Z"
                fill="url(#paint4_radial_9_46)"
              />
            </g>
          </g>

          <defs>
            <filter id="noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1"
                numOctaves="6"
                stitchTiles="stitch"
              />
            </filter>

            <filter
              id="filter0_f_9_46"
              x="-874.389"
              y="-314.283"
              width="3022.4"
              height="1954.4"
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
              <feGaussianBlur
                stdDeviation="63"
                result="effect1_foregroundBlur_9_46"
              />
            </filter>
            <filter
              id="filter1_f_9_46"
              x="-777.986"
              y="3.59741"
              width="2972.38"
              height="1999.82"
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
              <feGaussianBlur
                stdDeviation="63"
                result="effect1_foregroundBlur_9_46"
              />
            </filter>
            <filter
              id="filter2_f_9_46"
              x="1282.79"
              y="-476.712"
              width="2310.45"
              height="1733.62"
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
              <feGaussianBlur
                stdDeviation="60.323"
                result="effect1_foregroundBlur_9_46"
              />
            </filter>
            <filter
              id="filter3_f_9_46"
              x="-1023.1"
              y="-251.455"
              width="2310.45"
              height="1733.62"
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
              <feGaussianBlur
                stdDeviation="60.323"
                result="effect1_foregroundBlur_9_46"
              />
            </filter>
            <linearGradient
              id="paint0_linear_9_46"
              x1="1027"
              y1="-3.58037e-05"
              x2="-58.4532"
              y2="1855.81"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#6070FF" />
              <stop offset="1" stopColor="#4D1B5F" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_9_46"
              x1="69.7652"
              y1="-55.018"
              x2="1113.9"
              y2="1369.69"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#5E31BD" />
              <stop offset="1" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_9_46"
              x1="166.168"
              y1="262.863"
              x2="1210.31"
              y2="1687.58"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" />
              <stop offset="1" />
            </linearGradient>
            <radialGradient
              id="paint3_radial_9_46"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(2189.46 600.563) rotate(-144.199) scale(735.231 715.392)"
            >
              <stop offset="0" stopColor="#5BDCC6" />
              <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="paint4_radial_9_46"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(-116.431 825.821) rotate(-144.199) scale(735.231 715.392)"
            >
              <stop offset="0" stopColor="#5BDCC6" />
              <stop offset="1" stopColor="#F257A0" stopOpacity="0" />
            </radialGradient>
            <clipPath id="clip0_9_46">
              <rect
                width="1027"
                height="1890"
                fill="white"
                transform="matrix(-6.88803e-08 -1 -1 2.77392e-08 1890 1027)"
              />
            </clipPath>
          </defs>
        </svg>
      </section>
    </main>
  );
}
