/**
 * `npm run dev`: prints the address phones on your network should use, then
 * runs `next dev` unchanged (extra args pass through, e.g. `npm run dev -- -p 4000`).
 *
 * Next's own "Network:" line shows the first adapter it finds. On Windows
 * that is often Mobile Hotspot (192.168.137.x) or a WSL/Docker virtual
 * adapter, which a phone on your Wi-Fi can't reach.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { networkInterfaces } from "node:os";

const args = process.argv.slice(2);
const portFlag = args.findIndex((a) => a === "-p" || a === "--port");
const port = portFlag >= 0 ? args[portFlag + 1] : (process.env.PORT ?? "3000");

const virtual =
  /vethernet|wsl|docker|hyper-v|virtualbox|vmware|loopback|local area connection\*/i;
const physical = /wi-?fi|wlan|ethernet|^en\d|^eth\d/i;

const candidates = Object.entries(networkInterfaces())
  .flatMap(([name, addrs]) =>
    (addrs ?? [])
      .filter((a) => a.family === "IPv4" && !a.internal)
      .map((a) => ({ name, ip: a.address })),
  )
  .filter(
    ({ name, ip }) =>
      !virtual.test(name) &&
      !ip.startsWith("192.168.137.") &&
      !ip.startsWith("169.254."),
  )
  .sort(
    (a, b) => Number(physical.test(b.name)) - Number(physical.test(a.name)),
  );

if (candidates.length > 0) {
  const lines = candidates.map((c) => `  http://${c.ip}:${port}   (${c.name})`);
  console.log(`\nOn your phone (same Wi-Fi), open:\n${lines.join("\n")}\n`);
} else {
  console.log(
    "\nNo Wi-Fi or Ethernet address found; the site is only reachable on this machine.\n",
  );
}

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", ...args], {
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => child.kill(signal));
}
