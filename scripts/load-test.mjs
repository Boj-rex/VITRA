#!/usr/bin/env node

import autocannon from "autocannon";

// Parse CLI flags
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}
const hasFlag = (flag) => args.includes(flag);

const baseUrl = getArg("--url", "http://localhost:3000").replace(/\/$/, "");
const targetPath = getArg("--route", "/");
const targetUrl = `${baseUrl}${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`;
const explicitConnections = parseInt(getArg("--connections", "0"), 10);
const duration = parseInt(getArg("--duration", "15"), 10);
const runRamp = hasFlag("--ramp") || explicitConnections === 0;

console.log("\n========================================================");
console.log("             VITRA HIGH-CONCURRENCY LOAD TEST           ");
console.log("========================================================");
console.log(` Target URL : ${targetUrl}`);
console.log(` Environment: Node.js ${process.version}`);
console.log("========================================================\n");

async function runStage({ name, connections, durationSec, pipelining = 1 }) {
  console.log(`\n▶ [${name}] Testing with ${connections} concurrent connections for ${durationSec}s...`);

  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: targetUrl,
        connections,
        pipelining,
        duration: durationSec,
        timeout: 10,
        headers: {
          "user-agent": "VitraLoadTester/1.0",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      },
      (err, result) => {
        if (err) {
          console.error(`❌ Error during ${name}:`, err.message);
          return resolve(null);
        }

        console.log(`\n--- Results for ${name} (${connections} concurrent users) ---`);
        console.log(autocannon.printResult(result));

        const rps = Math.round(result.requests.average);
        const p99 = result.latency.p99;
        const errCount = result.errors + result.timeouts;

        console.log(`📊 Summary:`);
        console.log(`   - Throughput    : ${rps.toLocaleString()} requests/second`);
        console.log(`   - Total Requests: ${result.requests.total.toLocaleString()}`);
        console.log(`   - 2xx Successes : ${result["2xx"].toLocaleString()}`);
        console.log(`   - Non-2xx / Fail: ${result.non2xx.toLocaleString()}`);
        console.log(`   - Errors/Timeouts: ${errCount}`);
        console.log(`   - Median Latency: ${result.latency.p50} ms`);
        console.log(`   - 99th Percentile: ${p99} ms`);

        resolve(result);
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  if (!runRamp && explicitConnections > 0) {
    // Single targeted test
    await runStage({
      name: `Targeted Load Test (${explicitConnections} VUs)`,
      connections: explicitConnections,
      durationSec: duration,
      pipelining: explicitConnections >= 2000 ? 1 : 1,
    });
  } else {
    // Staged ramp-up test to safely find the breaking point
    console.log("Initiating progressive 4-stage ramp-up test to 5,000 concurrent users...");

    console.log("\n[Stage 1/4] Baseline Sanity Check (50 users)");
    await runStage({ name: "Stage 1 (50 users)", connections: 50, durationSec: 8 });

    console.log("\n[Stage 2/4] Moderate Concurrency (500 users)");
    await runStage({ name: "Stage 2 (500 users)", connections: 500, durationSec: 10 });

    console.log("\n[Stage 3/4] High Concurrency (2,000 users)");
    await runStage({ name: "Stage 3 (2,000 users)", connections: 2000, durationSec: 12 });

    console.log("\n[Stage 4/4] Peak Stress Target (5,000 users)");
    await runStage({ name: "Stage 4 (5,000 users)", connections: 5000, durationSec: 15 });
  }

  console.log("\n========================================================");
  console.log("                   TEST COMPLETE                        ");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Fatal load test failure:", err);
  process.exit(1);
});

