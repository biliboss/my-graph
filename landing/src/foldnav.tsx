import { useEffect, useState } from "react";

//! NAVEGAÇÃO POR DOBRA, no teclado: `j` desce uma dobra, `k` sobe.
//!
//! Uma dobra é qualquer elemento com `data-fold` — as seções da página, e também
//! os PASSOS internos de uma dobra rolável (marcadores invisíveis posicionados
//! ao longo dela). Sem isso, `j` pularia a demonstração inteira de uma vez.
//!
//! Padrão da família my: my · my-graph · my-company · my-kanban.

/** Um teclado só é atalho quando ninguém está escrevendo. */
function typingInside(el: EventTarget | null) {
  const n = el as HTMLElement | null;
  if (!n) return false;
  return n.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(n.tagName);
}

export function useFoldNav() {
  const [fold, setFold] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const stops = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-fold]")).map(
        (el) => el.getBoundingClientRect().top + scrollY,
      );

    const current = (tops: number[]) => {
      // +2px de folga: `scrollTo` costuma parar meio pixel antes do alvo, e um
      // `<=` cru devolveria a dobra anterior logo depois de navegar pra esta.
      const y = scrollY + 2;
      let i = 0;
      for (let k = 0; k < tops.length; k++) if (tops[k] <= y) i = k;
      return i;
    };

    const onScroll = () => {
      const tops = stops();
      setTotal(tops.length);
      setFold(current(tops));
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInside(e.target)) return;
      const step = e.key === "j" || e.key === "J" ? 1 : e.key === "k" || e.key === "K" ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const tops = stops();
      const next = Math.min(tops.length - 1, Math.max(0, current(tops) + step));
      scrollTo({ top: tops[next], behavior: "smooth" });
    };

    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      removeEventListener("keydown", onKey);
    };
  }, []);

  return { fold, total };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function FoldNav() {
  const { fold, total } = useFoldNav();
  if (!total) return null;
  return (
    <aside className="foldnav" aria-label="Navegação por dobra">
      <kbd>j</kbd>
      <kbd>k</kbd>
      <span>
        {pad(fold + 1)} <i>/</i> {pad(total)}
      </span>
    </aside>
  );
}
