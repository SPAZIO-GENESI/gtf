import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRegistry, byFolder } from "./lib/registry.mjs";

const SNAPSHOTS_DIR = join(ROOT, "snapshots");
const ANCHORS_DIR = join(SNAPSHOTS_DIR, "anchors");

// Data di nascita del GTF: baseline per i processi mai eseguiti finora
// (nessun last_run dichiarato) e per l'attesa del primo ancoraggio dogfooding.
const GTF_BIRTH = "2026-07-09";

// Grazia oltre il mese per il ciclo dogfooding (cadenza mensile, GTF-ARCH §6.4).
const DOGFOODING_GRACE_DAYS = 35;

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// Ultimo bundle dogfooding committato (fonte di verità unica: nessun campo
// da aggiornare a mano, a differenza dei PRC qui sotto — vedi CTL-dogfooding-anchor).
function latestAnchor() {
  if (!existsSync(ANCHORS_DIR)) return null;
  const bundles = readdirSync(ANCHORS_DIR)
    .filter((f) => /^\d{4}-\d{2}-bundle\.json$/.test(f))
    .sort();
  if (bundles.length === 0) return null;
  try {
    const data = JSON.parse(readFileSync(join(ANCHORS_DIR, bundles[bundles.length - 1]), "utf8"));
    return data.generated_at ?? null;
  } catch {
    return null;
  }
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID assenti: nessun invio, solo log.");
    console.log(text);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!res.ok) console.error(`Invio Telegram fallito: ${res.status} ${await res.text()}`);
  } catch (e) {
    console.error(`Invio Telegram fallito: ${e.message}`);
  }
}

async function main() {
  if (process.env.TEST_TELEGRAM === "true") {
    await sendTelegram(
      "Genesis Trust Framework — messaggio di prova (check-cadences.mjs, avviato manualmente con test_telegram). " +
        "Se lo stai leggendo, il canale funziona: i prossimi avvisi arriveranno solo quando un processo ricorrente sarà davvero scaduto."
    );
    console.log("Test Telegram inviato (o loggato soltanto, se i secret mancano ancora).");
    return;
  }

  const records = loadRegistry();
  const overdue = [];

  const anchorDate = latestAnchor();
  const anchorDays = anchorDate ? daysSince(anchorDate) : null;
  if (!anchorDate || anchorDays > DOGFOODING_GRACE_DAYS) {
    overdue.push({
      id: "CTL-dogfooding-anchor",
      title: "Ancoraggio dogfooding mensile",
      days: anchorDays,
      hint: "npm run anchor-monthly, poi attesta il bundle su attestazione.spaziogenesi.org",
    });
  }

  const prc = byFolder(records, "processes").filter((p) => p.frequency_days);
  for (const p of prc) {
    const ref = p.last_run ?? GTF_BIRTH;
    const days = daysSince(ref);
    if (days > p.frequency_days) {
      overdue.push({
        id: p.id,
        title: p.title,
        days,
        hint: p.last_run ? `ultima esecuzione dichiarata: ${p.last_run}` : "mai eseguito da quando il GTF esiste (nessun last_run nel registro)",
      });
    }
  }

  if (overdue.length === 0) {
    console.log("Nessun processo ricorrente scaduto.");
    return;
  }

  const lines = overdue.map(
    (o) => `- <b>${o.title}</b> (${o.id}) — ${o.days !== null ? `${o.days} giorni` : "mai eseguito"}. ${o.hint}`
  );
  const text =
    `Genesis Trust Framework — processi in scadenza:\n\n${lines.join("\n")}\n\n` +
    `Dettagli: https://github.com/SPAZIO-GENESI/gtf/tree/main/registry/processes`;

  console.log(text.replace(/<\/?b>/g, ""));
  await sendTelegram(text);
}

await main();
