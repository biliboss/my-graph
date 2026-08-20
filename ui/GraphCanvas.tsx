"use client";

//! THE CANVAS. Draws whatever the state says and reports clicks back — it decides
//! nothing.
//!
//! COLA, BECAUSE IT IS THE ONE THAT GUARANTEES IT. Force layouts (cose, fcose,
//! d3-force) REDUCE overlap by pushing nodes apart until the energy is low enough;
//! two circles can still end up on top of each other and nothing notices. WebCola
//! solves separation as CONSTRAINTS (VPSC), so `avoidOverlap` is a promise about
//! bounding boxes, not a tendency.
//!
//! `flow: { axis: "y" }` keeps the DAG reading downward. The layering is the whole
//! argument of the folder, and a physics layout that forgets it draws a pretty cloud
//! that says nothing.

import { useEffect, useRef } from "react";
import cytoscape, { type Core, type NodeSingular } from "cytoscape";
// @ts-expect-error — no types published for this extension
import cola from "cytoscape-cola";
import type { Graph } from "@/lib/extract";
import { hubs, type ViewerState } from "@/lib/viewer-state";
import { pulse } from "./Animation";
import { paletteOf } from "./Themes";

let registered = false;

/** EDGES THAT NEVER PASS UNDER A NODE.
 *
 *  Cola guarantees NODES do not overlap; it says nothing about edges, and a line that
 *  disappears behind a circle is a dependency the reader cannot follow — the one thing
 *  this picture exists for.
 *
 *  THE ALGORITHM, after the layout settles:
 *    1. for each edge, take the straight segment between its endpoints;
 *    2. find every other node whose centre falls within `r + margin` of that segment,
 *       measured perpendicular and only where the projection lands ON the segment —
 *       a node beyond either end is not in the way;
 *    3. bend the curve past the worst offender: the control point goes to that node's
 *       side of the line, far enough to clear it, at the projection's position;
 *    4. repeat twice, because a bend can push the curve into something else.
 *
 *  IT IS PER EDGE, NOT PER GRAPH, so it stays cheap and never moves a node: the layout
 *  keeps the compactness cola found, and only the ink moves.
 */
function routeEdges(cy: Core) {
	// THE INSTANCE MAY BE GONE. Routing is scheduled from `layoutstop` and from the
	// selection effect, and cola keeps ticking for seconds — a hot reload in the middle
	// destroys the core while a tick is still queued, and every read below then hits a
	// null renderer (`Cannot read properties of null (reading 'isHeadless')`, 20/08).
	if (cy.destroyed()) return;
	const nodes = cy.nodes("[!iface]:visible").map(n => ({ id: n.id(), p: n.position(), r: n.width() / 2 }));
	const CLEAR = 14;   // px of daylight between ink and circle
	const SAMPLES = 24;
	const BEND = 26;    // the resting curvature, same value the initial style uses

	/** A quadratic Bézier reaches only HALF its control-point distance at the apex —
	 *  the first version of this bent by the penetration depth and still clipped every
	 *  circle it was dodging (measured 20/08: 23 sample points inside a node). */
	const pointAt = (a: { x: number; y: number }, b: { x: number; y: number }, d: number, w: number, t: number) => {
		const abx = b.x - a.x, aby = b.y - a.y, L = Math.hypot(abx, aby) || 1;
		// `d` IS THE STYLE VALUE cytoscape will use, unmodified — modelling it as
		// anything else is how the first two attempts "cleared" a node on paper and
		// clipped it on screen.
		const cx = a.x + abx * w - (aby / L) * d;
		const cy = a.y + aby * w + (abx / L) * d;
		const u = 1 - t;
		return { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
	};

	cy.edges().forEach(edge => {
		const a = edge.source().position();
		const b = edge.target().position();
		const src = edge.source().id(), tgt = edge.target().id();
		const others = nodes.filter(n => n.id !== src && n.id !== tgt);

		// THE CEILING on a detour. Without it a pass that could not clear kept adding its
		// push, and twelve of them put control points thousands of px out — the canvas
		// filled with lassos (seen 20/08). A detour much longer than the edge is not a
		// route, it is a scribble, and past that the honest answer is "this one crosses".
		const chord = Math.hypot(b.x - a.x, b.y - a.y) || 1;
		const CAP = Math.min(210, chord * 0.7);

		/** Worst penetration of the curve at (dist, weight), and where along it. */
		const probe = (dist: number, weight: number) => {
			let worst = 0, worstT = weight;
			for (let i = 1; i < SAMPLES; i++) {
				const t = i / SAMPLES;
				const p = pointAt(a, b, dist, weight, t);
				for (const n of others) {
					const gap = Math.hypot(n.p.x - p.x, n.p.y - p.y) - n.r - CLEAR;
					if (gap < 0 && -gap > worst) { worst = -gap; worstT = t; }
				}
			}
			return { worst, worstT };
		};

		// BOTH SIDES, SEPARATELY. Deciding the side from where the obstacle sits works
		// until two obstacles disagree — then the search flips every pass and converges on
		// nothing. Running each side to exhaustion and keeping the better result is two
		// cheap searches instead of one that oscillates.
		let best = { dist: BEND, weight: 0.5, worst: Infinity };
		for (const side of [1, -1] as const) {
			let dist = side * BEND, weight = 0.5;
			for (let pass = 0; pass < 10; pass++) {
				const { worst, worstT } = probe(dist, weight);
				// Ties go to the smaller bend: straighter ink for the same clearance.
				if (worst < best.worst || (worst === best.worst && Math.abs(dist) < Math.abs(best.dist)))
					best = { dist, weight, worst };
				if (!worst) break;
				// A quadratic reaches only HALF its control distance at the apex, so
				// clearing `worst` costs twice that much control distance.
				const next = dist + side * 2 * (worst + CLEAR);
				if (Math.abs(next) > CAP) break;
				dist = next;
				weight = worstT;
			}
			if (best.worst === 0) break;
		}

		edge.style({
			"curve-style": "unbundled-bezier",
			"control-point-distances": [best.dist],
			"control-point-weights": [best.weight],
		});
	});
}

const SPACING = { compact: 0.85, balanced: 1, comfortable: 1.2 };

export function GraphCanvas({
	graph,
	state,
	onSelect,
}: {
	graph: Graph;
	state: ViewerState;
	onSelect: (id: string) => void;
}) {
	const box = useRef<HTMLDivElement>(null);
	const cy = useRef<Core | null>(null);
	/** Kept in a ref, not state: the handler must see the latest without rebinding on
	 *  every keystroke of the URL. */
	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;

	// ── build once per graph ────────────────────────────────────────────────
	useEffect(() => {
		if (!box.current) return;
		if (!registered) { cytoscape.use(cola); registered = true; }

		const scale = SPACING[state.density];
		// THE CANVAS CANNOT INHERIT A CSS VARIABLE — it is one <canvas>, not a tree of
		// elements. So it reads the same record the panel's variables came from: one
		// source, two consumers, and no picture that disagrees with the panel beside it.
		const COLOURS = paletteOf(state.theme);
		const instance = cytoscape({
			container: box.current,
			elements: (() => {
				// EXTERNALS ARE A LAYOUT INPUT, not a `display: none`. Hiding them left cola
				// solving for 22 circles and showing 9, so the visible nine sat wherever the
				// hidden thirteen pushed them — a sprawl with no reason on screen (20/08).
				const nodes = graph.nodes.filter(
					n =>
						(state.externals || !n.id.startsWith("ext:")) &&
						(state.orphans || !n.orphan),
				);
				const has = (id: string) => nodes.some(n => n.id === id);
				// The hub keeps its circle and loses its arrows: removing the node too would
				// say `shared` does not exist, and it is the one thing everything rests on.
				const hidden = state.hideHub ? new Set(hubs(graph)) : new Set<string>();
				return [
					// THE CIRCLE HOLDS ITS OWN NAME, so it can never be big enough only for the
					// dot: a label outside floats between two circles and the reader guesses
					// which one it belongs to.
					...nodes.map(n => {
						// A path breaks at its slashes, so `src/references.ts` is two short
						// lines instead of one that would inflate the circle to 130px and make
						// the nine files it exists to frame look like the small print.
						const lines = n.label.split("/");
						const widest = Math.max(...lines.map(l => l.length));
						return {
							data: {
								...n,
								ext: n.id.startsWith("ext:"),
								// VAZADO = NADA ATRÁS. Contrato sem `implemented:` é promessa, e promessa
								// desenhada igual a código que roda é a figura mentindo com a autoridade
								// de um diagrama.
								hollow: !n.id.startsWith("ext:") && n.implemented.length === 0,
								label: lines.join("\n"),
								size: Math.max(34 + Math.min(46, n.methods * 2.2), widest * 6.6 + 12),
							},
						};
					}),
					...graph.edges
						.filter(e => has(e.source) && has(e.target) && !hidden.has(e.target))
						.map((e, i) => ({ data: { id: `e${i}`, ...e } })),
				];
			})(),
			style: [
				{
					selector: "node",
					style: {
						// A COR DIZ O PAPEL, O PREENCHIMENTO DIZ SE EXISTE. A cor também tentava
						// dizer "draft", e `tasks` saía roxo com oito arquivos atrás — dois
						// sinais contando histórias diferentes sobre o mesmo círculo. Vazado
						// responde "tem código?"; a cor responde "é o quê?".
						"background-color": (n: NodeSingular) =>
							n.data("id").startsWith("ext:") ? COLOURS.line
							: n.data("tool") ? COLOURS.tool
							: COLOURS.runs,
						label: "data(label)", "font-size": 12, "font-weight": 700,
						// Dark ink on the bright fills, light on the grey externals — one
						// colour for both would be unreadable on one of them.
						color: (n: NodeSingular) => (n.data("id").startsWith("ext:") ? COLOURS.text : COLOURS.bg),
						"text-valign": "center", "text-halign": "center", "text-wrap": "wrap",
						width: "data(size)", height: "data(size)",
						"border-width": 2, "border-color": COLOURS.bg,
						"transition-property": "opacity", "transition-duration": 180,
					},
				},
				{
					// ÓRFÃO: retângulo, e da cor do erro. NÃO é círculo de propósito — ele não
					// participa do grafo, não tem aresta, e desenhá-lo igual aos outros
					// sugeriria que participa. A forma diferente É a mensagem: isto está do
					// LADO da arquitetura, não dentro dela.
					selector: "node[?orphan]",
					style: {
						shape: "round-rectangle",
						"background-opacity": 0.12,
						"background-color": COLOURS.danger,
						"border-width": 2,
						"border-color": COLOURS.danger,
						color: COLOURS.danger,
						"font-size": 10,
						width: "label",
						height: 26,
						padding: "10px",
					},
				},
				{
					// O CÍRCULO VAZADO: só o contorno, e o rótulo na cor do papel em vez do
					// fundo — sem preenchimento não há contraste pra tinta escura.
					selector: "node[?hollow]",
					style: {
						"background-opacity": 0,
						"border-width": 3,
						"border-color": (n: NodeSingular) => (n.data("tool") ? COLOURS.tool : COLOURS.draft),
						color: (n: NodeSingular) => (n.data("tool") ? COLOURS.tool : COLOURS.draft),
					},
				},
				{
					// The cited paths are context, not subject: smaller ink so the nine files
					// stay the thing you read first.
					selector: "node[?ext]",
					style: { "font-size": 9, "font-weight": 500, color: COLOURS.dim },
				},
				{
					selector: "node[?iface]",
					style: {
						"background-color": COLOURS.panel, "border-color": COLOURS.line,
						label: "data(label)", "font-size": 11, color: COLOURS.dim,
						"text-valign": "center", "text-halign": "center",
						shape: "round-rectangle", width: "label", height: 22, padding: "8px",
					},
				},
				{
					selector: "edge",
					style: {
						// CURVED FROM THE FIRST FRAME. `bezier` draws a lone edge dead straight
						// and only the router made it bend, so the graph appeared as one thing
						// and became another a second later.
						width: 2, "curve-style": "unbundled-bezier",
						"control-point-distances": [26], "control-point-weights": [0.5],
						"target-arrow-shape": "triangle", "arrow-scale": 0.9, opacity: 0.85,
						"line-color": (e: cytoscape.EdgeSingular) =>
							e.data("kind") === "import" ? COLOURS.tool : COLOURS.dim,
						"target-arrow-color": (e: cytoscape.EdgeSingular) =>
							e.data("kind") === "import" ? COLOURS.tool : COLOURS.dim,
						"line-style": (e: cytoscape.EdgeSingular) =>
							e.data("kind") === "import" ? "solid" : "dashed",
					},
				},
				{
					selector: "edge[kind = 'member']",
					style: { "line-color": COLOURS.line, "target-arrow-shape": "none", width: 1, opacity: 0.6 },
				},
				{ selector: ".dim", style: { opacity: 0.12 } },
			],
			// SEM `layout:` AQUI DE PROPÓSITO — ele nasce logo abaixo, por `instance.layout()`,
			// porque um layout criado dentro do construtor não devolve referência e não há
			// como PARAR o ticker do cola na limpeza. `instance.stop()` para as animações e
			// não a simulação, e era daí que vinha o `Cannot read properties of null
			// (reading 'isHeadless')`: o cola continua tickando contra um core destruído.
			layout: { name: "preset" },
		});

		const layout = instance.layout({
				name: "cola",
				animate: true,
				refresh: 1,
				maxSimulationTime: 4000,
				randomize: true,
				avoidOverlap: true,        // the guarantee
				handleDisconnected: true,  // `system` is an island on purpose; it must not fly off
				// COMPACT ON PURPOSE: short edges pull the graph in, `avoidOverlap` stops
				// it collapsing, and `routeEdges` handles the crossings that tightness
				// creates. Spreading nodes out to avoid crossings is paying in screen for
				// something arithmetic can fix.
				nodeSpacing: () => 18 * scale,
				flow: { axis: "y", minSeparation: 70 * scale },
				edgeLength: (e: cytoscape.EdgeSingular) => (e.data("kind") === "member" ? 78 : 118 * scale),
				fit: true,
				padding: 70,
		} as cytoscape.LayoutOptions);
		layout.run();

		// Route once the physics stops: bending against positions that are still moving
		// would compute a detour around where a node USED to be.
		instance.one("layoutstop", () => routeEdges(instance));

		instance.on("tap", "node[!iface]", ev => onSelectRef.current(ev.target.data("id")));
		// A satellite is selectable too: its id is `file::Iface`, which the panel reads
		// to show the verbs. Without this the ring is decoration.
		instance.on("tap", "node[?iface]", ev => onSelectRef.current(ev.target.data("id")));
		instance.on("tap", ev => { if (ev.target === instance) onSelectRef.current(""); });

		cy.current = instance;
		// A TEST SEAM, on purpose: the canvas is one <canvas> element, so a driver has
		// no DOM to click. Everything else here is reachable through the URL; this is
		// the one thing that is not, and hiding it would mean the graph is the only
		// part nobody can prove works.
		(window as unknown as { __cy?: Core }).__cy = instance;
		return () => {
			// PARA O LAYOUT, DEPOIS AS ANIMAÇÕES, DEPOIS DESTRÓI — nesta ordem. `destroy()`
			// sozinho deixa a simulação do cola segurando um core cujo renderer já é null, e
			// o próximo tick estoura de dentro da biblioteca, onde guarda nenhuma nossa
			// alcança. `instance.stop()` não basta: ele para animação, não simulação.
			layout.stop();
			instance.stop();
			instance.destroy();
			cy.current = null;
		};
		// Density, externals and theme rebuild on purpose: the first two are layout
		// inputs, and the third is baked into a stylesheet cytoscape compiled once.
	}, [graph, state.density, state.externals, state.theme, state.hideHub, state.orphans]);

	// ── react to selection and open rings ───────────────────────────────────
	useEffect(() => {
		const c = cy.current;
		if (!c || c.destroyed()) return;

		c.nodes("[?iface]").remove();
		c.edges("[kind = 'member']").remove();

		for (const id of state.open) {
			// `getElementById`, NUNCA `$("#"+id)`: um id de órfão é `orphan:extension/webview`,
			// e `:` e `/` são sintaxe de seletor — o `$` joga e derruba a página inteira
			// (medido 20/08, clicando num órfão).
			const node = c.getElementById(id);
			if (!node.length) continue;
			const ifaces = (node.data("exports") ?? []) as { name: string; methods: number }[];
			if (!ifaces.length) continue;

			// A RING AROUND THE NODE, not a re-layout: a picture that rearranges itself
			// on every click loses the mental map the layout just built.
			const c0 = node.position();
			const radius = 90 + ifaces.length * 8;
			ifaces.forEach((f, i) => {
				const a = (2 * Math.PI * i) / ifaces.length - Math.PI / 2;
				c.add([
					{
						data: { id: `${id}::${f.name}`, label: f.name, iface: true, parentFile: id },
						position: { x: c0.x + radius * Math.cos(a), y: c0.y + radius * Math.sin(a) },
					},
					{ data: { id: `${id}->${f.name}`, source: id, target: `${id}::${f.name}`, kind: "member" } },
				]);
			});
		}

		c.elements().removeClass("dim");
		if (state.selected) {
			const node = c.getElementById(state.selected);
			if (node.length) {
				c.elements().addClass("dim");
				node.closedNeighborhood().union(c.$(`[parentFile = "${state.selected}"]`)).removeClass("dim");
				// A PULSE ON WHAT YOU PICKED, before the camera moves. The zoom answers
				// "where", the pulse answers "which one" — and during a 320ms fit the eye
				// cannot follow a circle it has not yet identified.
				pulse(node as unknown as Parameters<typeof pulse>[0]);
				// Zoom in on selection, out when it clears: a ring of satellites is
				// unreadable at whole-graph zoom.
				c.animate({
					fit: { eles: node.closedNeighborhood().union(c.$(`[parentFile = "${state.selected}"]`)), padding: 110 },
					duration: 320,
				});
			}
			routeEdges(c);
		} else {
			c.animate({ fit: { eles: c.elements(":visible"), padding: 70 }, duration: 320 });
			routeEdges(c);
		}
	}, [state.open, state.selected]);

	return <div ref={box} className="h-full w-full" />;
}
