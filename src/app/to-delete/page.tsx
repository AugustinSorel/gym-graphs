import { Chart } from "./Chart";

type DataPoint = [number, number];

const getPrices = async () => {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
  );

  const data = (await res.json()) as {
    prices: DataPoint[];
  };

  return data.prices;
};

const Page = async () => {
  const prices = await getPrices();
  return (
    <main className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
      <div className="relative min-h-[500px] min-w-[500px] overflow-hidden rounded-md bg-neutral-500">
        <Chart data={prices} />
      </div>
    </main>
  );
};

export default Page;
