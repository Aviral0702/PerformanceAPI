import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { Redis } from "@upstash/redis/cloudflare";
export const runtime = "edge"; //Cloudflare Workers is the under the hood runtime of Vercel also so deploying there would be beneficial for performance
const app = new Hono().basePath("/api"); //now no need to worry about the base path of the app for every single route we are defining it here

type EnvConfig = {
  UPSTASH_REDIS_REST_TOKEN: string;
  UPSTASH_REDIS_REST_URL: string;
};

app.use("/*", cors());
app.get("/search", async (c) => {
  try {
    const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = env<EnvConfig>(
      c
    );
    const start = performance.now();
    //to take access of database at the backend
    const redis = new Redis({
      token: UPSTASH_REDIS_REST_TOKEN,
      url: UPSTASH_REDIS_REST_URL,
    });

    const query = c.req.query("q")?.toUpperCase();
    if (!query)
      return c.json({ message: "Invalid search query" }, { status: 400 });

    const res = [];
    const rank = await redis.zrank("terms", query);

    if (rank !== null && rank !== undefined) {
      const temp = await redis.zrange<string[]>("terms", rank, rank + 100);
      for (const el of temp) {
        if (!el.startsWith(query)) {
          break;
        }
        if (el.endsWith("*")) {
          res.push(el.substring(0, el.length - 1));
        }
      }
    }
    //--------------------------
    const end = performance.now();
    return c.json({
      results: res,
      duration: end - start,
    });
  } catch (err) {
    console.error(err);
    return c.json(
      { results: [], message: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const GET = handle(app); // this handle function is integration function of Vercel with Hono so we can also deploy it to Vercel and make it compatible like Next.js
export default app as never; // this is just to make sure that the app is not exported as a default export as nextjs compiler does not like it to be exported as default export just to bypass it
//testing for github integration