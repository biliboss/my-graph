"use client";

//! ONE INTERFACE, WITH ITS VERBS LISTED. A circle sized by "how many" says how big
//! something is; only the list says WHAT it does, and a graph you cannot read down to
//! the verb is a graph you have to leave to answer any real question.

import { Button, Chip } from "@heroui/react";
import type { Graph } from "@/lib/extract";
import { nodeById } from "@/lib/viewer-state";
import { Section, Stack } from "./Spacing";

export function InterfaceDetail({
	graph,
	id,
	onBack,
}: {
	/** `kanban::Metrics` — the file, then the interface. */
	id: string;
	graph: Graph;
	onBack: (fileId: string) => void;
}) {
	const [fileId, ifaceName] = id.split("::");
	const file = nodeById(graph, fileId);
	const iface = file?.exports.find(e => e.name === ifaceName);
	if (!file || !iface) return null;

	return (
		<Stack gap="group">
			<Button size="sm" variant="ghost" className="w-fit px-0" onClick={() => onBack(fileId)}>
				← {file.label}
			</Button>

			<div>
				<h1 className="font-mono text-2xl font-semibold tracking-tight">{iface.name}</h1>
				<p className="mt-1 text-xs text-default-400">
					{fileId}.ts · {iface.methods.length} verbos
				</p>
			</div>

			<Section title="verbos">
				{iface.methods.length ? (
					<div className="flex flex-wrap gap-1">
						{iface.methods.map(m => (
							<Chip key={m} size="sm" variant="soft" className="font-mono">
								{m}
							</Chip>
						))}
					</div>
				) : (
					// A vocabulary type is not a failure to have verbs: `Finding` is a shape
					// somebody else returns, and saying so beats an empty list.
					<p className="text-sm text-default-400">
						nenhum — é forma, não superfície. Alguém devolve isto.
					</p>
				)}
			</Section>

			<Section title="ao lado">
				<div className="flex flex-wrap gap-1">
					{file.exports
						.filter(e => e.name !== iface.name)
						.map(e => (
							<Chip key={e.name} size="sm" variant="tertiary" className="font-mono">
								{e.name}
							</Chip>
						))}
				</div>
			</Section>
		</Stack>
	);
}
