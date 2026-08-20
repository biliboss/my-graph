//! THE APPLICATION LAYER'S ONE JOB: turn `src/*/interface.ts` into a graph.
//!
//! It knows nothing about React, HeroUI or cytoscape — it reads files and returns
//! data. That is why it lives here and not in a component: a rule about what an edge
//! MEANS must never be reachable only by rendering something.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** METHOD NAMES, not a count: a circle sized by "how many" says how big something is,
 *  and the panel has to say WHAT. The count is `methods.length`. */
export type Iface = { name: string; methods: string[] };

export type GraphNode = {
	id: string;
	label: string;
	interfaces: number;
	methods: number;
	/** Says so in its own header: a draft has nothing implemented behind it. */
	draft: boolean;
	/** Wraps a program this house does not own. */
	tool: boolean;
	/** Where the file lands when implemented, read from `//! planned:`. */
	planned: string;
	exports: Iface[];
};

/** SOLID is read from the source; DASHED is a comment nobody verifies. The extractor
 *  once claimed both were imports, which was false for 22 of 26 edges (20/08). */
export type GraphEdge = { source: string; target: string; kind: "import" | "value" };

export type Graph = {
	nodes: GraphNode[];
	edges: GraphEdge[];
	/** Stamped, so a stale picture is detectable instead of arguable. */
	generated_at: string;
	files: number;
	/** Two files importing each other have no bottom layer: neither can be built
	 *  first. Reported, never drawn away. */
	cycles: string[];
};

/** WHICH TREE TO DRAW. `MY_GRAPH_ROOT=~/src/me/src bun run dev` — a path, because a
 *  graph tool that only knows the repo it was born in is not a tool, it is a picture
 *  of one codebase with a server attached.
 *
 *  The contract it reads is the same everywhere: `<root>/<system>/interface.ts`, the
 *  system named by its directory. */
const DIR = process.env.MY_GRAPH_ROOT ?? join(process.cwd(), "..", "me", "src");

export function extract(): Graph {
	const files = readdirSync(DIR, { withFileTypes: true })
		.filter(d => d.isDirectory() && existsSync(join(DIR, d.name, "interface.ts")))
		.map(d => `${d.name}/interface.ts`);
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const outside = new Set<string>();

	const names = files.map(f => f.split("/")[0]);

	for (const file of files) {
		const id = file.split("/")[0];
		const src = readFileSync(join(DIR, file), "utf8");

		// Brace-counting, not a TS parse: these files are hand-written and flat, and a
		// parser here would be a dependency taken on to read twelve declarations.
		const exports: Iface[] = [];
		const lines = src.split("\n");
		lines.forEach((line, i) => {
			const m = line.match(/^export interface (\w+)/);
			if (!m) return;
			let depth = 0;
			const methods: string[] = [];
			for (let j = i; j < lines.length; j++) {
				depth += (lines[j].match(/\{/g) ?? []).length - (lines[j].match(/\}/g) ?? []).length;
				const decl = j > i && depth === 1 ? lines[j].match(/^\t([a-zA-Z]+)[(<]/) : null;
				if (decl) methods.push(decl[1]);
				if (depth === 0 && j > i) break;
			}
			exports.push({ name: m[1], methods });
		});

		nodes.push({
			id,
			label: id,
			exports,
			planned: src.match(/^\/\/! planned:\s*(.+)$/m)?.[1].trim() ?? "",
			interfaces: (src.match(/^export interface /gm) ?? []).length,
			methods: (src.match(/^\t[a-zA-Z]+[(<]/gm) ?? []).length,
			draft: !/THIS ONE IS NOT A DRAFT/.test(src),
			tool: /^\/\/! external:/m.test(src),
		});

		for (const m of src.matchAll(/import type \{[^}]+\} from "\.\.\/([\w.-]+)\/interface"/g)) {
			edges.push({ source: id, target: m[1], kind: "import" });
		}

		const dep = src.match(/^\/\/! depends_on:(.+)$/m);
		if (dep) {
			for (const raw of dep[1].split("·")) {
				const t = raw.trim();
				if (!t) continue;
				// `src/resources.ts` and `interfaces/resources.ts` share a basename, and
				// matching on it drew a SELF-LOOP (20/08). A path with a slash is outside.
				// `src/kanban/` cites its own neighbours by name; anything else is a path
				// somewhere out of the picture.
				const name = t.replace(/\/$/, "").replace(/^src\//, "").split("/")[0];
				// SINCE THE MOVE, a citation of its own directory is the file citing itself —
				// `shared/interface.ts` naming `src/shared/` is where it now lives, not a
				// dependency. Drawing it put a loop on every node.
				if (name === id) continue;
				const target = names.includes(name)
					? name
					: `ext:${t.split("/").slice(0, 2).join("/")}`;
				if (target.startsWith("ext:")) outside.add(target);
				// One arrow per pair: citing two files of the same neighbour is one
				// dependency written twice, and two identical arrows read as two facts.
				if (!edges.some(e => e.source === id && e.target === target && e.kind === "value"))
					edges.push({ source: id, target, kind: "value" });
			}
		}
	}

	for (const o of outside) {
		nodes.push({
			id: o, label: o.replace("ext:", ""), interfaces: 0, methods: 0,
			draft: false, tool: false, planned: "", exports: [],
		});
	}

	const solid = edges.filter(e => e.kind === "import");
	const cycles = solid
		.filter(a => solid.some(b => b.source === a.target && b.target === a.source))
		.map(a => `${a.source} ⇄ ${a.target}`);

	return { nodes, edges, generated_at: new Date().toISOString(), files: files.length, cycles };
}
