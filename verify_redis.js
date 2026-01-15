import Redis from "ioredis";

const redis = new Redis("redis://localhost:6379");

redis
  .set("test_key", "Hello Redis")
  .then(() => redis.get("test_key"))
  .then((val) => {
    console.log("Redis Test Result:", val);
    if (val === "Hello Redis") {
      console.log("SUCCESS: Redis is connected and working.");
      process.exit(0);
    } else {
      console.error("FAILURE: Value mismatch.");
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("FAILURE: Could not connect to Redis.", err);
    process.exit(1);
  });
