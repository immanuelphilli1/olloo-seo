import { brokenSite, goodSite, startSite } from "./sites.ts";

// `npm run fixtures` — serves the two test sites so you can audit them from the UI.
// Run the app with ALLOW_PRIVATE_TARGETS=true to audit localhost URLs.
await startSite(brokenSite, 4001);
await startSite(goodSite, 4002, true);
console.log("Broken fixture site: http://localhost:4001");
console.log("Good fixture site:   http://localhost:4002");
