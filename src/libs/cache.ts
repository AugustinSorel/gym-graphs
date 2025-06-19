import checkRateScript from "~/auth/scripts/check-rate.lua?raw" assert { type: "lua" };
import { Redis } from "ioredis";
import { env } from "~/env";
import type { Callback, Result } from "ioredis";

export const cache = new Redis({
  username: env.CACHE_USER,
  password: env.CACHE_PASSWORD,
  host: env.CACHE_HOST,
  port: env.CACHE_PORT,
  name: env.CACHE_NAME.toString(),
  scripts: {
    checkRate: {
      numberOfKeys: 1,
      lua: checkRateScript,
    },
  },
});

declare module "ioredis" {
  interface RedisCommander<Context> {
    checkRate(
      key: string,
      max: string,
      refillIntervalInSeconds: string,
      cost: string,
      currentTimeInSeconds: string,
      callback?: Callback<string>,
    ): Result<string, Context>;
  }
}
