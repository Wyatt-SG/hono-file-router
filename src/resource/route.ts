import { Context } from "hono";

const route = (c: Context) => {
  return c.text("Hello Resource!");
};

export default route;
