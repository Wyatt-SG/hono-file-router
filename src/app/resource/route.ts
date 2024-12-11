import { Context } from "hono";
import { getObj } from "../../lib/obj.js";

const route = (c: Context) => {
  const obj = getObj();
  return c.text(obj.message);
};

export default route;
