import { Context } from "hono";

const route = (c: Context) => {
  return c.text(`Hello User: ${c.req.param("id")}`);
};

export default route;
