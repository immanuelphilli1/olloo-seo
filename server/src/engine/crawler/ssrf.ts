import dns from "node:dns";
import net from "node:net";
import { config } from "../../config.ts";

// SSRF protection: we fetch arbitrary user-supplied URLs, so every connection
// must go to a public IP address. The check runs inside the socket `lookup`
// (see fetch.ts), which means the IP we validate is the IP we connect to —
// DNS rebinding can't slip a private address in between.

const blockList = new net.BlockList();
for (const [subnet, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockList.addSubnet(subnet, prefix, "ipv4");
}
for (const [subnet, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockList.addSubnet(subnet, prefix, "ipv6");
}

export class BlockedTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedTargetError";
  }
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return blockList.check(ip, "ipv4");
  if (family === 6) {
    const mapped = ip.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return blockList.check(mapped[1], "ipv4");
    return blockList.check(ip, "ipv6");
  }
  return true;
}

/** Validates the shape of a URL before any network access. */
export function assertAllowedUrl(raw: string | URL): URL {
  const url = typeof raw === "string" ? new URL(raw) : raw;
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedTargetError("Only http and https URLs can be audited.");
  }
  if (url.username || url.password) {
    throw new BlockedTargetError("URLs with embedded credentials are not allowed.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!hostname) throw new BlockedTargetError("The URL has no hostname.");
  if (config.allowPrivateTargets) return url;

  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new BlockedTargetError("Only the standard web ports (80 and 443) are allowed.");
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new BlockedTargetError("Local and internal hostnames cannot be audited.");
  }
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new BlockedTargetError("Private and reserved IP addresses cannot be audited.");
  }
  return url;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number,
) => void;

/** Drop-in replacement for dns.lookup that refuses private addresses. */
export function safeLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (!config.allowPrivateTargets) {
      const blocked = list.find((a) => isPrivateIp(a.address));
      if (blocked) {
        return callback(new BlockedTargetError(`${hostname} resolves to a private address.`), "", 0);
      }
    }
    if (options.all) return callback(null, list);
    const first = list[0];
    if (!first) return callback(new Error(`No address for ${hostname}`), "", 0);
    callback(null, first.address, first.family);
  });
}

/** Resolves a hostname up front so we can fail fast with a clear message. */
export async function assertPublicHost(hostname: string): Promise<void> {
  if (config.allowPrivateTargets) return;
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(bare)) {
    if (isPrivateIp(bare)) throw new BlockedTargetError("Private and reserved IP addresses cannot be audited.");
    return;
  }
  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(bare, { all: true });
  } catch {
    throw new BlockedTargetError(`We couldn't find a website at ${bare}. Check the address and try again.`);
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new BlockedTargetError(`${bare} resolves to a private address and cannot be audited.`);
  }
}
