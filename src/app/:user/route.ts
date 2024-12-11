import { Context } from "hono";

const route = (c: Context) => {
  return c.text(`Hello: ${c.req.param("user")}`);
};

export default route;
