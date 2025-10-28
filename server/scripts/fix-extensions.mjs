import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(process.cwd(), "dist");

const isRelative = (specifier) => specifier.startsWith("./") || specifier.startsWith("../");
const shouldSkip = (specifier) =>
  !isRelative(specifier) ||
  specifier.endsWith(".js") ||
  specifier.endsWith(".json");

const transformFile = async (filePath) => {
  let content = await readFile(filePath, "utf8");
  let changed = false;

  const replaceImport = (regex) =>
    content.replace(regex, (match, spec) => {
      if (shouldSkip(spec)) {
        return match;
      }
      changed = true;
      return match.replace(spec, `${spec}.js`);
    });

  content = replaceImport(/from\s+["']([^"']+)["']/g);
  content = replaceImport(/import\(\s*["']([^"']+)["']\s*\)/g);

  if (changed) {
    await writeFile(filePath, content, "utf8");
  }
};

const walk = async (dir) => {
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      await walk(fullPath);
    } else if (entryStat.isFile() && entry.endsWith(".js")) {
      await transformFile(fullPath);
    }
  }
};

await walk(DIST_DIR);

