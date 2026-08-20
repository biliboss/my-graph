"use client";

//! ONE FILE, IN FULL: what it is, where it will live, what it exports, who needs it.
//!
//! IT REPLACES THE OVERVIEW rather than sitting beside it. A panel showing both makes
//! the reader decide twice which numbers belong to what they clicked.

import { Button, Card, CardContent, Chip } from "@heroui/react";
import { Section, Stack } from "./Spacing";
import { SPACE } from "./Tokens";
import type { Graph } from "@/lib/extract";
import { isExternal, neighbours, nodeById } from "@/lib/viewer-state";
import { Pressable } from "./Pressable";

export function NodeDetail({
	graph,
	id,
	onBack,
	onOpen,
}: {
	graph: Graph;
	id: string;
	onBack: () => void;
	onOpen: (id: string) => void;
}) {
	const node = nodeById(graph, id);
	if (!node) return null;

	const { imports, cites, importedBy } = neighbours(graph, id);
	const kind = isExternal(node.id) ? "fora de interfaces/"
		: node.tool ? "tools — adapta programa de fora"
		: node.draft ? "draft — nada implementado"
		: "documenta código que roda";

	return (
		<Stack gap="group">
			<Button size="sm" variant="ghost" className="w-fit px-0" onClick={onBack}>
				← visão geral
			</Button>

			<div>
				<h1 className="text-2xl font-semibold tracking-tight">{node.label}</h1>
				<p className="mt-1 text-xs text-default-400">{kind}</p>
			</div>

			{node.planned && (
				<Card className="bg-default-100/40">
					<CardContent>
						<h2 className="text-[11px] uppercase tracking-[0.16em] text-default-400">
							caminho planejado
						</h2>
						<code className="mt-1 block text-[13px] leading-6 text-cyan-300">{node.planned}</code>
					</CardContent>
				</Card>
			)}

			<Section title="exporta">
				{node.exports.length ? (
					<ul className="space-y-1">
						{node.exports.map(f => (
							<li key={f.name} className="text-sm text-default-500">
								<code>{f.name}</code>
								{f.methods.length > 0 && <span className="text-default-400"> · {f.methods.length} verbos</span>}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-default-400">nada — é vocabulário puro.</p>
				)}
			</Section>

			<hr className="border-default-200" />

			<Section title="depende de">
				<Links ids={imports} label="importa" onOpen={onOpen} />
				<Links ids={cites} label="cita" onOpen={onOpen} muted />
				{!imports.length && !cites.length && (
					<p className="text-sm text-default-400">nada. É camada de baixo.</p>
				)}
			</Section>

			<Section title="quem depende dele">
				{importedBy.length ? (
					<Links ids={importedBy} label="" onOpen={onOpen} />
				) : (
					<p className="text-sm text-default-400">ninguém — ilha.</p>
				)}
			</Section>

			<p className="text-xs text-default-400">
				{node.interfaces} interfaces · {node.methods} verbos
			</p>
		</Stack>
	);
}

/** Clicking a neighbour walks there — a detail panel whose names are not clickable is
 *  a panel that makes you go back to the graph to do what it just showed you. */
const Links = ({
	ids, label, onOpen, muted,
}: { ids: string[]; label: string; onOpen: (id: string) => void; muted?: boolean }) =>
	ids.length ? (
		<div className="flex flex-wrap gap-1">
			{ids.map(id => (
				<Pressable key={`${label}-${id}`} onClick={() => onOpen(id)}>
					<Chip size="sm" variant={muted ? "tertiary" : "soft"} className="cursor-pointer">
						{label ? `${label} ${id}` : id}
					</Chip>
				</Pressable>
			))}
		</div>
	) : null;
