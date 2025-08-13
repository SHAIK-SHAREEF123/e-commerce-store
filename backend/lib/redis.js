// import Redis from "ioredis";
// import dotenv from "dotenv";
// dotenv.config();

// export const redis = new Redis(process.env.UPSTASH_REDIS_URL);
export const redis = {
  get: async () => null,
  set: async () => {},
};
