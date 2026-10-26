import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { config } from "../src/config.ts";
import { fetchUrl } from "../src/engine/crawler/fetch.ts";
import { assertAllowedUrl, assertPublicHost, isPrivateIp } from "../src/engine/crawler/ssrf.ts";

// These tests run with the SSRF guard ON, as in production.
let server: http.Server;
beforeAll(async () => {
  config.allowPrivateTargets = false;
  server = http.createServer((_, res) => res.end("internal secret"));
  await new Promise<void>((resolve) => server.listen(4199, resolve));
});
afterAll(() => {
  config.allowPrivateTargets = true;
  server.close();
});

describe("SSRF guard", () => {
  it.each(["127.0.0.1", "10.0.0.5", "172.16.3.4", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"])(
    "treats %s as private",
    (ip) => expect(isPrivateIp(ip)).toBe(true),
  );

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("treats %s as public", (ip) => expect(isPrivateIp(ip)).toBe(false));

  it.each([
    "http://localhost/",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://example.com:8080/",
    "ftp://example.com/",
    "file:///etc/passwd",
    "http://user:pass@example.com/",
    "http://printer.local/",
  ])("rejects %s", (url) => {
    expect(() => assertAllowedUrl(url)).toThrow();
  });

  it("rejects hostnames that resolve to loopback", async () => {
    await expect(assertPublicHost("localhost")).rejects.toThrow();
  });

  it("refuses to connect to a private address even if asked directly", async () => {
    const res = await fetchUrl("http://127.0.0.1:4199/");
    expect(res.status).toBe(0);
    expect(res.body).toBeNull();
  });

  it("refuses a public-looking name that resolves to loopback at connect time", async () => {
    // "localhost." (trailing dot) slips past the hostname check but resolves to 127.0.0.1.
    const res = await fetchUrl("http://localhost.:80/");
    expect(res.status).toBe(0);
  });
});
