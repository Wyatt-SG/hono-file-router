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
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

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
        const importPath = path
          .relative(path.dirname(config.output), entryPath)
          .replace(/\\|\//g, "/");
        result[routePath] = `./${importPath}`;
      }
    }
  }

  await traverseDirectory(targetDir);
  return result;
}

async function generateHonoApp(
  routes: Record<string, string>,
  outputFile: string
) {
  const outputDir = path.dirname(outputFile);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let content = "import { Hono } from 'hono';\n";
  content += "const app = new Hono();\n\n";

  const importNames = new Set<string>();

  for (const [route, modulePath] of Object.entries(routes)) {
    let importName = path
      .basename(modulePath, ".ts")
      .replace(/[^a-zA-Z0-9]/g, "_");

    // Ensure unique import names
    while (importNames.has(importName)) {
      importName += "_";
    }
    importNames.add(importName);

    content += `import ${importName} from '${modulePath}';\n`;
    content += `app.all('${route}', ${importName});\n`;
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
