// Menu mobile
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("is-open"));
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("is-open"))
    );
  }

  // Contagem regressiva até o casamento — 31/10/2026 às 16h (horário de Brasília)
  const WEDDING_DATE = new Date("2026-10-31T16:00:00-03:00").getTime();
  const els = {
    dias: document.getElementById("cd-dias"),
    horas: document.getElementById("cd-horas"),
    min: document.getElementById("cd-min"),
    seg: document.getElementById("cd-seg"),
  };

  if (els.dias) {
    const tick = () => {
      const diff = WEDDING_DATE - Date.now();
      if (diff <= 0) {
        els.dias.textContent = "0";
        els.horas.textContent = "0";
        els.min.textContent = "0";
        els.seg.textContent = "0";
        return;
      }
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const seg = Math.floor((diff / 1000) % 60);
      els.dias.textContent = dias;
      els.horas.textContent = String(horas).padStart(2, "0");
      els.min.textContent = String(min).padStart(2, "0");
      els.seg.textContent = String(seg).padStart(2, "0");
    };
    tick();
    setInterval(tick, 1000);
  }
});
