import * as fs from "fs";
import * as path from "path";

import config from "../config.json" assert { type: "json" };

/**
 * Recursively finds all files named "route.ts" in the target directory and its subdirectories.
 * @param targetDir - The directory to search in.
 * @returns An object with paths as keys and default exported functions as values.
 */
async function findRouteHandlers(
  targetDir: string
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  /**
   * Recursively traverse the directory and find files named "route.ts".
   * @param dir - The current directory being traversed.
   */
  async function traverseDirectory(dir: string): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await traverseDirectory(entryPath); // Recurse into subdirectory
      } else if (entry.isFile() && entry.name === "route.ts") {
        const relativePath = path.relative(targetDir, path.dirname(entryPath));
        const routePath = `/${relativePath.replace(/\\|\//g, "/")}`;

        try {
          const routeModule = await import(path.resolve(entryPath));
          if (
            routeModule.default &&
            typeof routeModule.default === "function"
          ) {
            result[routePath] = routeModule.default;
          }
        } catch (error) {
          console.error(`Failed to import ${entryPath}:`, error);
        }
      }
    }
  }

  await traverseDirectory(targetDir);
  return result;
}

async function generateHonoApp(
  routes: Record<string, any>,
  outputFile: string
) {
  const outputDir = path.dirname(outputFile);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let content = "import { Hono } from 'hono';\n\n";
  content += "const app = new Hono();\n\n";

  for (const [route, handler] of Object.entries(routes)) {
    content += `app.all('${route}', ${handler});\n`;
  }

  content += "\nexport default app;\n";

  fs.writeFileSync(outputFile, content);
  console.log(`Generated Hono app in ${outputFile}`);
}

(async () => {
  const { base, output } = config;
  const routeHandlers = await findRouteHandlers(base);
  console.log("Found route handlers:", routeHandlers);
  await generateHonoApp(routeHandlers, output);
})();
