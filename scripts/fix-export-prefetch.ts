/**
 * Runs after `next build` (npm "postbuild"). Works around a Next.js 16 export
 * bug on Windows: segment prefetch files for nested routes are written as
 *   out/classes/__next.classes/__PAGE__.txt          (folder)
 * but the client requests
 *   out/classes/__next.classes.__PAGE__.txt          (dot-joined)
 * because the exporter only converts "/" to "." and Windows paths use "\".
 * Result: 404s on every prefetch and late navigations.
 *
 * Flattens any `__next.*` folder into dot-joined files. On Linux (CI, Cloudflare
 * Pages) the exporter writes the right names and this finds nothing to do.
 */
import { copyFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");

async function filesUnder(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? filesUnder(full) : Promise.resolve([full]);
    }),
  );
  return nested.flat();
}

async function walk(dir: string, found: string[]) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) found.push(full);
    else await walk(full, found);
  }
}

try {
  await stat(OUT);
} catch {
  console.log("fix-export-prefetch: no out/ folder, skipping");
  process.exit(0);
}

const broken: string[] = [];
await walk(OUT, broken);

let fixed = 0;
for (const dir of broken) {
  for (const file of await filesUnder(dir)) {
    const rest = path.relative(dir, file).split(path.sep).join(".");
    const target = path.join(
      path.dirname(dir),
      `${path.basename(dir)}.${rest}`,
    );
    await copyFile(file, target);
    fixed++;
  }
  await rm(dir, { recursive: true });
}

console.log(
  fixed
    ? `fix-export-prefetch: flattened ${fixed} prefetch files in ${broken.length} folders`
    : "fix-export-prefetch: nothing to fix",
);
