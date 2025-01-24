import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
export const runtime  = "edge"; //Cloudflare Workers is the under the hood runtime of Vercel also so deploying there would be beneficial for performance
const app =  new Hono().basePath("/api") //now no need to worry about the base path of the app for every single route we are defining it here
app.use('/*', cors())
app.get("/search", (c) => {
    return c.json({})
})

export const GET = handle(app); // this handle function is integration function of Vercel with Hono so we can also deploy it to Vercel and make it compatible like Next.js
export const POST = handle(app);
export default app as never // this is just to make sure that the app is not exported as a default export as nextjs compiler does not like it to be exported as default export just to bypass it