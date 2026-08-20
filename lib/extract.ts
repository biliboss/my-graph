//! THE APPLICATION LAYER'S ONE JOB: turn a folder of `<system>.ts` contracts into a graph.
//!
//! It knows nothing about React, HeroUI or cytoscape — it reads files and returns
//! data. That is why it lives here and not in a component: a rule about what an edge
//! MEANS must never be reachable only by rendering something.

import { readdirSync, readFileSync } from "node:fs";
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
	/** `export const` names: the facts the system runs on, written as DATA in the
	 *  contract instead of as a paragraph above a method. Worth showing separately —
	 *  a constant is the one part of an interface file that is already the
	 *  configuration, not a description of one. */
	config: string[];
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

/** WHICH TREE TO DRAW. `MY_GRAPH_ROOT=~/src/me/src/interfaces bun run dev` — a path,
 *  because a graph tool that only knows the repo it was born in is not a tool, it is
 *  a picture of one codebase with a server attached.
 *
 *  One folder, one file per system, the system named by the file. */
const DIR = process.env.MY_GRAPH_ROOT ?? join(process.cwd(), "..", "me", "src", "interfaces");

export function extract(): Graph {
	const files = readdirSync(DIR).filter(f => f.endsWith(".ts"));
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];
	const outside = new Set<string>();

	const names = files.map(f => f.replace(/\.ts$/, ""));

	for (const file of files) {
		const id = file.replace(/\.ts$/, "");
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
			config: [...src.matchAll(/^export const (\w+)/gm)].map(m => m[1]),
			interfaces: (src.match(/^export interface /gm) ?? []).length,
			methods: (src.match(/^\t[a-zA-Z]+[(<]/gm) ?? []).length,
			draft: !/THIS ONE IS NOT A DRAFT/.test(src),
			tool: /^\/\/! external:/m.test(src),
		});

		for (const m of src.matchAll(/import type \{[^}]+\} from "\.\/([\w.-]+)"/g)) {
			edges.push({ source: id, target: m[1], kind: "import" });
		}

		const dep = src.match(/^\/\/! depends_on:(.+)$/m);
		if (dep) {
			for (const raw of dep[1].split("·")) {
				const t = raw.trim();
				if (!t) continue;
				// A cited path names a NEIGHBOUR only when it is one: `src/tasks/` from
				// `kanban.ts` is the tasks system, `src/gh/` is somebody else's code.
				const name = t.replace(/\/$/, "").replace(/^src\//, "").split("/")[0];
				// `agents.ts` citing `src/agents/list.ts` is the file pointing at its own
				// implementation, not at a dependency — drawing it put a loop on every node
				// that documents running code (20/08).
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
			draft: false, tool: false, planned: "", exports: [], config: [],
		});
	}

	const solid = edges.filter(e => e.kind === "import");
	const cycles = solid
		.filter(a => solid.some(b => b.source === a.target && b.target === a.source))
		.map(a => `${a.source} ⇄ ${a.target}`);

	return { nodes, edges, generated_at: new Date().toISOString(), files: files.length, cycles };
}
