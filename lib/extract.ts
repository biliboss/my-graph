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
	/** ÓRFÃO: uma pasta de código que contrato NENHUM reivindica. `files` são os
	 *  arquivos dela, porque a pergunta que este nó existe pra fazer — "por que isto
	 *  existe?" — não se responde sem os nomes. */
	orphan?: boolean;
	files?: string[];
	/** Files listed on `//! implemented:` — the code that exists behind the contract.
	 *  EMPTY IS THE INTERESTING CASE: a contract with nothing behind it is a promise,
	 *  and the picture has to say which circles are promises. */
	implemented: string[];
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

/** WHICH TREE TO DRAW. `MY_GRAPH_ROOT=~/src/my/packages/interfaces/src bun run dev` — a path,
 *  because a graph tool that only knows the repo it was born in is not a tool, it is
 *  a picture of one codebase with a server attached.
 *
 *  One folder, one file per system, the system named by the file. */
/** A ÁRVORE DE CÓDIGO que os contratos deveriam cobrir. Por padrão a pasta ACIMA dos
 *  contratos, que é onde eles moram nesta casa (`src/interfaces/` dentro de `src/`). */
const CODE = process.env.MY_GRAPH_CODE ?? "";

// O DEFAULT MUDOU DUAS VEZES EM 20/08 e a segunda diz por quê: os contratos saíram
// de `me/src/interfaces` (repositório privado, código dentro da casa) pra
// `my/packages/interfaces/src` — um pacote de workspace que a família inteira
// importa por nome. Um default é conveniência; `MY_GRAPH_ROOT` é o contrato.
const DIR = process.env.MY_GRAPH_ROOT ?? join(process.cwd(), "..", "my", "packages", "interfaces", "src");

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
				// ONE LEVEL DEEP TOO. `tools` groups its verbs by program —
				// `askuser: { ask() }`, `gh: { prs() }` — and counting only the outer level
				// reported ONE verb for an interface with thirty (20/08). A grouped surface
				// is not a smaller surface.
				const decl =
					j > i && depth === 1 ? lines[j].match(/^\t([a-zA-Z]+)[(<]/)
					: j > i && depth === 2 ? lines[j].match(/^\t\t([a-zA-Z]+)[(<]/)
					: null;
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
			methods: (src.match(/^\t{1,2}[a-zA-Z]+[(<]/gm) ?? []).length,
			draft: !/THIS ONE IS NOT A DRAFT/.test(src),
			implemented: (src.match(/^\/\/! implemented:\s*(.+)$/m)?.[1] ?? "")
				.split("·").map(t => t.trim()).filter(Boolean),
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
			draft: false, tool: false, planned: "", exports: [], config: [], implemented: [],
		});
	}

	// ─── OS ÓRFÃOS ──────────────────────────────────────────────────────────
	// CÓDIGO QUE CONTRATO NENHUM RECLAMA. A pergunta que isto faz é a única que o grafo
	// não sabia fazer: por que este arquivo existe? Um arquivo que nenhum contrato cita
	// ou é trabalho que ninguém documentou, ou é trabalho que ninguém precisa — e as
	// duas respostas são acionáveis.
	//
	// AGRUPADOS POR PASTA de propósito: 198 círculos soltos matam o layout e não
	// respondem nada. A pasta é onde a pergunta tem dono.
	const codeRoot = CODE || join(DIR, "..");
	const claimed = new Set<string>();
	for (const file of files) {
		const src = readFileSync(join(DIR, file), "utf8");
		for (const m of src.matchAll(/^\/\/! (?:implemented|planned|depends_on|absorbs|impacts):(.+)$/gm))
			for (const raw of m[1].split("·")) {
				const t = raw.trim().split(/\s/)[0].replace(/\/$/, "");
				if (t.startsWith("src/")) claimed.add(t.slice(4));
			}
	}

	const byDir = new Map<string, string[]>();
	const walk = (rel: string) => {
		let entries: { name: string; isDirectory(): boolean }[];
		try { entries = readdirSync(join(codeRoot, rel), { withFileTypes: true }); } catch { return; }
		for (const e of entries) {
			const r = rel ? `${rel}/${e.name}` : e.name;
			if (e.isDirectory()) {
				// Pastas que não são código desta casa. `interfaces` sai porque é a fonte do
				// próprio grafo — ela não pode ser órfã de si mesma.
				if (["node_modules", ".next", "dist", "out", "interfaces", ".git"].includes(e.name)) continue;
				walk(r);
			} else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) {
				// Teste segue o arquivo que testa: um `.test.ts` órfão é o mesmo achado
				// contado duas vezes.
				if (e.name.endsWith(".test.ts")) continue;
				// Reivindicado se ele, ou qualquer pasta acima dele, foi citado.
				const parts = r.split("/");
				const covered = parts.some((_, i) => claimed.has(parts.slice(0, i + 1).join("/")));
				if (covered) continue;
				const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
				byDir.set(dir, [...(byDir.get(dir) ?? []), e.name]);
			}
		}
	};
	walk("");

	for (const [dir, list] of byDir) {
		nodes.push({
			id: `orphan:${dir}`,
			label: dir === "." ? "src/*" : `src/${dir}`,
			interfaces: 0, methods: 0, draft: false, tool: false, planned: "",
			exports: [], config: [], implemented: [], orphan: true, files: list.sort(),
		});
	}

	const solid = edges.filter(e => e.kind === "import");
	const cycles = solid
		.filter(a => solid.some(b => b.source === a.target && b.target === a.source))
		.map(a => `${a.source} ⇄ ${a.target}`);

	return { nodes, edges, generated_at: new Date().toISOString(), files: files.length, cycles };
}
