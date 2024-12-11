import { Context } from "hono";

const route = (c: Context) => {
  return c.text("Hello World! dd");
};

export default route;
