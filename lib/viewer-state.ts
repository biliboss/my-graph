//! THE APPLICATION LAYER of the viewer: what is selected, what is open, how dense
//! the shell is — and the derivations a widget would otherwise reinvent.
//!
//! IT DOES NOT KNOW THE UI EXISTS. No React, no cytoscape, no DOM. Widgets subscribe
//! and render whatever they find; nothing here reaches back. That is the whole rule,
//! and the reason it is a rule: state reachable only through a component is state
//! that cannot be tested, shared or restored from a URL.
//!
//! THE URL IS THE STORE. `#open=teams,agents&sel=kanban&d=compact` — back, forward
//! and reload work for free, and a link points at one reading of the graph. A second
//! copy in memory would be a second truth the moment somebody pressed Back.

import type { Graph, GraphNode } from "./extract";

export type Density = "compact" | "balanced" | "comfortable";

export type ViewerState = {
	/** Files whose exported interfaces are expanded. */
	open: string[];
	/** The file the detail panel is describing, or `""` for the overview. */
	selected: string;
	density: Density;
	/** External stubs (`ext:src/…`) are hidden by default: 22 circles for 9 files is
	 *  a picture of the extractor, not of the architecture. */
	externals: boolean;
	/** Hide the arrows INTO a hub — a node half the graph imports. `shared` is one:
	 *  twelve of its arrows are true and say nothing, because "everybody depends on the
	 *  bottom layer" is the design, not news. Hidden, what is left is the shape that
	 *  changes. */
	hideHub: boolean;
	/** Mostrar as pastas de código que contrato NENHUM reivindica. Fora por padrão:
	 *  são 17 pastas nesta árvore, e elas não pertencem ao grafo de dependência — são a
	 *  pergunta que fica DO LADO dele. */
	orphans: boolean;
	/** A palette name from `ui/Themes.tsx`. In the URL like everything else, so a
	 *  screenshot of the graph carries the theme it was read in. */
	theme: string;
};

/** COMFORTABLE IS THE DEFAULT, chosen by looking: at this node count the extra 15%
 *  is what stops labels touching the circle below them. */
const DEFAULTS: ViewerState = {
	open: [], selected: "", density: "comfortable", externals: false, hideHub: false, orphans: false,
	// MONOKAI IS THE DEFAULT because the editor in the next window is Monokai, and two
	// greens for one idea is a reader translating between windows.
	theme: "monokai",
};

export function parse(hash: string): ViewerState {
	const p = new URLSearchParams(hash.replace(/^#/, ""));
	const density = p.get("d") as Density | null;
	return {
		open: (p.get("open") ?? "").split(",").filter(Boolean),
		selected: p.get("sel") ?? "",
		density: density && ["compact", "balanced", "comfortable"].includes(density) ? density : DEFAULTS.density,
		externals: p.get("ext") === "1",
		hideHub: p.get("hub") === "0",
		orphans: p.get("orf") === "1",
		theme: p.get("t") ?? DEFAULTS.theme,
	};
}

export function serialize(s: ViewerState): string {
	const p = new URLSearchParams();
	if (s.open.length) p.set("open", s.open.join(","));
	if (s.selected) p.set("sel", s.selected);
	if (s.density !== DEFAULTS.density) p.set("d", s.density);
	if (s.externals) p.set("ext", "1");
	if (s.hideHub) p.set("hub", "0");
	if (s.orphans) p.set("orf", "1");
	if (s.theme !== DEFAULTS.theme) p.set("t", s.theme);
	// `:` `/` `,` VOLTAM A SER ELES MESMOS. `URLSearchParams` percent-encoda os três,
	// e no FRAGMENTO nenhum deles é reservado — `#sel=orphan%3Aextension%2Fwebview` é o
	// mesmo endereço que `#sel=orphan:extension/webview`, só ilegível. E ilegível cobra:
	// um link colado num commit não se lê, e o driver de teste desta casa casa alvo por
	// URL exata, então a forma encodada quebrou cinco sessões seguidas (20/08).
	const q = p.toString().replace(/%3A/g, ":").replace(/%2F/g, "/").replace(/%2C/g, ",");
	return q ? `#${q}` : "#";
}

/** Clicking an open file closes it. One verb, because "open" and "close" are the same
 *  gesture and two of them would need somebody to track which is next. */
export function toggleOpen(s: ViewerState, id: string): ViewerState {
	// `file::Iface` selects the interface and leaves the ring exactly as it is —
	// clicking a satellite to read it must not close the thing you are reading.
	if (id.includes("::")) return { ...s, selected: id };
	const open = s.open.includes(id) ? s.open.filter(o => o !== id) : [...s.open, id];
	return { ...s, open, selected: id };
}

// ─── DERIVATIONS ────────────────────────────────────────────────────────────
// Anything a widget would otherwise compute in a render. Kept here so two widgets
// asking the same question cannot get two answers.

export const nodeById = (g: Graph, id: string): GraphNode | undefined =>
	g.nodes.find(n => n.id === id);

export const isExternal = (id: string) => id.startsWith("ext:");

/** What a file imports and what imports it — satellites excluded, since a ring the
 *  user opened is the picture describing itself, not a dependency. */
export function neighbours(g: Graph, id: string) {
	return {
		imports: g.edges.filter(e => e.source === id && e.kind === "import").map(e => e.target),
		cites: g.edges.filter(e => e.source === id && e.kind === "value").map(e => e.target),
		importedBy: g.edges.filter(e => e.target === id && e.kind === "import").map(e => e.source),
	};
}

/** LONGEST PATH TO A FILE THAT IMPORTS NOTHING. Depth is what makes the layering
 *  visible — the folder's whole argument is that nothing skips a level — and the
 *  physics layout uses it as a flow constraint rather than a fixed row. */
export function depths(g: Graph): Map<string, number> {
	const out = new Map<string, string[]>(g.nodes.map(n => [n.id, []]));
	g.edges
		.filter(e => e.kind === "import" && out.has(e.source) && out.has(e.target))
		.forEach(e => out.get(e.source)!.push(e.target));

	const depth = new Map<string, number>();
	const walking = new Set<string>();
	const walk = (id: string): number => {
		if (depth.has(id)) return depth.get(id)!;
		if (walking.has(id)) return 0; // a cycle is reported by `extract`; do not hang here
		walking.add(id);
		const outs = out.get(id) ?? [];
		const d = outs.length ? 1 + Math.max(...outs.map(walk)) : 0;
		depth.set(id, d);
		return d;
	};
	g.nodes.forEach(n => walk(n.id));
	return depth;
}

/** A NODE HALF THE GRAPH IMPORTS. Computed, never named: `shared` is what this
 *  codebase calls it, and the next tree to be drawn will call it something else. The
 *  threshold is half of everything that could import it — below that, the arrows still
 *  carry information about who chose to depend on what.
 *
 *  Only `import` edges count. A `depends_on` comment is a claim, and a hub built out
 *  of claims would hide real arrows on the strength of a sentence nobody verifies. */
export function hubs(g: Graph): string[] {
	// ÓRFÃO NÃO ENTRA NO DENOMINADOR, pela mesma razão que ele não entra em
	// `drafts` logo abaixo: um hub é um CONTRATO que metade dos outros importa, e
	// órfão é código sem contrato nenhum. Medido 20/08 — ligar a toggle de órfãos
	// levava `real` de 9 pra 111, o limiar de 4 pra 55, e `shared` (12 setas)
	// deixava de ser hub. O sintoma foi a toggle de esconder as setas DESAPARECER
	// da barra, porque `HubToggle` não se desenha sem um nome pra dizer.
	const real = g.nodes.filter(n => !isExternal(n.id) && !n.orphan);
	const threshold = Math.max(2, Math.ceil((real.length - 1) / 2));
	return real
		.filter(n => g.edges.filter(e => e.kind === "import" && e.target === n.id).length >= threshold)
		.map(n => n.id);
}

/** The counts the overview shows. A widget summing edges by hand is a widget that
 *  disagrees with the next one that tries. */
export function summary(g: Graph) {
	return {
		files: g.files,
		nodes: g.nodes.length,
		imports: g.edges.filter(e => e.kind === "import").length,
		values: g.edges.filter(e => e.kind === "value").length,
		// PROMESSA, não "draft": o cabeçalho dizia intenção, `implemented:` diz se
		// existe arquivo. Um contrato pode ter perdido o rótulo de draft e continuar
		// sem uma linha atrás — foi o caso de `tasks`, verde e roxo ao mesmo tempo.
		// ÓRFÃO NÃO É CONTRATO SEM CÓDIGO — é o contrário exato: código sem contrato.
		// Contá-lo aqui somava as duas ausências opostas num número só (19, quando os
		// contratos sem código eram 2).
		drafts: g.nodes.filter(n => !isExternal(n.id) && !n.orphan && n.implemented.length === 0).length,
		cycles: g.cycles,
	};
}
