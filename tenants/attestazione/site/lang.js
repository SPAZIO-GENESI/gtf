// Selettore di lingua: file statico, non generato — nessun contenuto qui
// dipende dal registro. Referenziato con path assoluto (/lang.js), stessa
// copia di gtf/site/lang.js (stesso meccanismo, dominio diverso: qui è
// attestazione.trust.spaziogenesi.org, non trust.spaziogenesi.org).
//
// Redirect automatico SOLO dalla radice italiana verso /en/, e SOLO se il
// visitatore non ha mai scelto esplicitamente una lingua: un link condiviso
// a /en/ (es. in una candidatura) non deve mai essere deviato altrove.
(function () {
  var KEY = "sg-gtf-lang";

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-lang]");
    if (link) {
      try {
        localStorage.setItem(KEY, link.getAttribute("data-lang"));
      } catch (err) {
        /* localStorage non disponibile: la scelta manuale funziona lo stesso */
      }
    }
  });

  if (document.documentElement.lang !== "it") return;

  try {
    if (localStorage.getItem(KEY)) return;
  } catch (err) {
    return;
  }

  var languages = navigator.languages || [navigator.language || ""];
  var prefersItalian = languages.some(function (l) {
    return l.toLowerCase().indexOf("it") === 0;
  });
  if (!prefersItalian) location.replace("/en/");
})();
