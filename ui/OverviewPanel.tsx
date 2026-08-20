"use client";

//! What the folder IS, when nothing is selected. It reads the summary the app layer
//! computed — it never counts edges itself, because two widgets counting the same
//! thing is two widgets that will eventually disagree.

import { Card, CardContent, Chip } from "@heroui/react";
import { Section, Stack } from "./Spacing";
import type { Graph } from "@/lib/extract";
import { summary } from "@/lib/viewer-state";

export function OverviewPanel({ graph }: { graph: Graph }) {
	const s = summary(graph);

	return (
		<Stack gap="group">
			<div>
				<Chip size="sm" variant="flat">lido dos arquivos, agora</Chip>
				<h1 className="mt-3 text-xl font-semibold tracking-tight">src/*/interface.ts</h1>
				<p className="mt-1 text-sm text-default-500">
					{s.files} arquivos · {s.imports} imports · {s.values} por valor · {s.drafts} drafts
				</p>
			</div>

			{s.cycles.length > 0 && (
				// A cycle is a finding, not a drawing problem: two files importing each
				// other have no bottom layer, so neither can be built first.
				<Card className="border border-danger-400 bg-danger-50/10">
					<CardContent className="text-sm">
						<b className="text-danger">ciclo</b>
						<p className="text-default-500">{s.cycles.join(", ")}</p>
					</CardContent>
				</Card>
			)}

			<div>
				<h2 className="text-[11px] uppercase tracking-[0.16em] text-default-400">arestas</h2>
				<ul className="mt-2 space-y-1 text-sm text-default-500">
					<li><span className="text-cyan-400">──</span> <code>import type</code> — lido do código</li>
					<li><span className="text-default-400">┈┈</span> <code>depends_on</code> — comentário, nada verifica</li>
				</ul>
			</div>

			<hr className="border-default-200" />

			<div>
				<h2 className="text-[11px] uppercase tracking-[0.16em] text-default-400">nós</h2>
				<ul className="mt-2 space-y-1 text-sm text-default-500">
					<li><Dot className="bg-[#a6e22e]" /> documenta código que roda</li>
					<li><Dot className="bg-[#ae81ff]" /> draft — nada implementado</li>
					<li><Dot className="bg-[#66d9ef]" /> <code>tools</code> — adapta programa de fora</li>
					<li><Dot className="bg-[#3b3d33]" /> fora de <code>src/</code></li>
				</ul>
			</div>

			<p className="text-xs text-default-400">
				gerado {graph.generated_at.slice(0, 16).replace("T", " ")}Z
			</p>
		</Stack>
	);
}

const Dot = ({ className }: { className: string }) => (
	<span className={`inline-block h-3 w-3 rounded-full align-middle ${className}`} />
);
