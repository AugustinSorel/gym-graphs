import { cache } from "~/libs/cache";

const createTokenBucketRateLimiter = (
  storageKey: string,
  max: number,
  refillIntervalInSeconds: number,
) => {
  const checkRate = async (key: string, cost: number) => {
    const [isValidInBinary] = await cache.checkRate(
      `${storageKey}:${key}`,
      max.toString(),
      refillIntervalInSeconds.toString(),
      cost.toString(),
      Math.floor(Date.now() / 1000).toString(),
    );

    return Boolean(isValidInBinary);
  };

  return { checkRate };
};

export const rateLimiter = createTokenBucketRateLimiter("global_ip", 20, 2);
