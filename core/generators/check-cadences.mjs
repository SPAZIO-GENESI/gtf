import { loadRegistry } from "./lib/registry.mjs";
import { loadTenant } from "./lib/tenant.mjs";
import { computeCadences, overdueOnly } from "./lib/cadences.mjs";

// B3 (voce del piano 2026, img-auth-hub): un allarme che raggiunge solo il
// gestore non è un allarme se il gestore è la persona indisponibile. Secondo
// destinatario opzionale — nessun comportamento cambia finché il secondo
// secret non viene configurato (variabile assente = stringa vuota = nessun
// invio aggiuntivo, come oggi). Il destinatario reale è una decisione umana
// (chi sarà il secondo referente tecnico), non presa qui — vedi
// piano-2026/umano/procedura-successione.md §3 e §7.
async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID_SECONDARY].filter(Boolean);
  if (!token || chatIds.length === 0) {
    console.log("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID assenti: nessun invio, solo log.");
    console.log(text);
    return;
  }
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      });
      if (!res.ok) console.error(`Invio Telegram fallito (chat ${chatId}): ${res.status} ${await res.text()}`);
    } catch (e) {
      console.error(`Invio Telegram fallito (chat ${chatId}): ${e.message}`);
    }
  }
}

async function main() {
  const cfg = loadTenant();

  if (process.env.TEST_TELEGRAM === "true") {
    await sendTelegram(
      "Genesis Trust Framework — messaggio di prova (check-cadences.mjs, avviato manualmente con test_telegram). " +
        "Se lo stai leggendo, il canale funziona: i prossimi avvisi arriveranno solo quando un processo ricorrente sarà davvero scaduto."
    );
    console.log("Test Telegram inviato (o loggato soltanto, se i secret mancano ancora).");
    return;
  }

  const overdue = overdueOnly(computeCadences(cfg, loadRegistry()));

  if (overdue.length === 0) {
    console.log("Nessun processo ricorrente scaduto.");
    return;
  }

  // Il messaggio dice chi deve agire e manda in UN posto solo, dove i passi
  // sono scritti per esteso. Prima elencava i comandi da dare: chi li riceveva
  // senza essere tecnico non poteva farci niente, e chi li riceveva da tecnico
  // doveva comunque ricostruire il resto della procedura a memoria.
  const lines = overdue.map((o) => {
    const chi = o.who ? ` — se ne occupa: ${o.who}` : "";
    const da = o.never_run ? "mai eseguito finora" : `in ritardo di ${o.overdue_days} giorni`;
    return `- <b>${o.title}</b> (${da})${chi}`;
  });

  const panel = cfg.operations?.panel_url;
  const text =
    `Genesis Trust Framework — manutenzioni da fare:\n\n${lines.join("\n")}\n\n` +
    (panel
      ? `Cosa fare, passo per passo: ${panel}\n(${cfg.operations.panel_label ?? "pannello di gestione"})\n\n`
      : "") +
    `Registro dei processi: ${cfg.operations.processes_url}`;

  console.log(text.replace(/<\/?b>/g, ""));
  await sendTelegram(text);
}

await main();
