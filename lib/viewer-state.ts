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
	/** A palette name from `ui/Themes.tsx`. In the URL like everything else, so a
	 *  screenshot of the graph carries the theme it was read in. */
	theme: string;
};

/** COMFORTABLE IS THE DEFAULT, chosen by looking: at this node count the extra 15%
 *  is what stops labels touching the circle below them. */
const DEFAULTS: ViewerState = {
	open: [], selected: "", density: "comfortable", externals: false, hideHub: false,
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
	if (s.theme !== DEFAULTS.theme) p.set("t", s.theme);
	const q = p.toString();
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
	const real = g.nodes.filter(n => !isExternal(n.id));
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
		drafts: g.nodes.filter(n => n.draft && !isExternal(n.id)).length,
		cycles: g.cycles,
	};
}
