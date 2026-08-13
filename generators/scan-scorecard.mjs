import { writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/registry.mjs";

const SNAPSHOTS_DIR = join(ROOT, "snapshots");

// I tre repo con scorecard.yml attivo (A3 del piano P43, parte 1). Elenco
// statico: aggiungerne uno significa toccare questo file, non una
// scoperta automatica — stesso principio di R2_PREFIXES in scan-privacy.mjs.
const REPOS = ["SPAZIO-GENESI/imgauth", "SPAZIO-GENESI/imgauthweb", "SPAZIO-GENESI/autart-signer"];

const API_BASE = "https://api.securityscorecards.dev/projects/github.com";

// Stesso pattern di latestWeek() in scan-privacy.mjs/score.mjs: legge solo
// snapshot già committati, mai stato in memoria tra script diversi.
function latestWeek() {
  if (!existsSync(SNAPSHOTS_DIR)) return null;
  const weeks = readdirSync(SNAPSHOTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "anchors")
    .map((d) => d.name)
    .sort();
  return weeks.length > 0 ? weeks[weeks.length - 1] : null;
}

async function fetchScorecard(repo) {
  const url = `${API_BASE}/${repo}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      // 404 atteso finché lo scorecard.yml del repo non ha ancora girato
      // almeno una volta con publish_results:true — non un errore da
      // segnalare in modo allarmante, solo "nessun dato ancora".
      return { repo, ok: false, status: res.status };
    }
    const data = await res.json();
    return {
      repo,
      ok: true,
      score: data.score ?? null,
      date: data.date ?? null,
      checks: Array.isArray(data.checks)
        ? data.checks.map((c) => ({ name: c.name, score: c.score }))
        : null,
    };
  } catch (e) {
    return { repo, ok: false, error: e.message };
  }
}

function writeSnapshot(week, result) {
  if (!week) return;
  const dir = join(SNAPSHOTS_DIR, week);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "scorecard.json"), JSON.stringify(result, null, 2) + "\n");
}

async function main() {
  const week = latestWeek();
  if (!week) {
    console.log("scan-scorecard: nessuno snapshot settimanale ancora creato, nulla da scrivere.");
    return;
  }

  const repos = await Promise.all(REPOS.map(fetchScorecard));
  const result = { week, ok: true, repos };
  writeSnapshot(week, result);

  const withData = repos.filter((r) => r.ok).length;
  console.log(`scan-scorecard: ${withData}/${repos.length} repo con punteggio Scorecard pubblico disponibile.`);
  for (const r of repos) {
    console.log(r.ok ? `  ${r.repo}: ${r.score}` : `  ${r.repo}: nessun dato (${r.status ?? r.error})`);
  }
}

main();
