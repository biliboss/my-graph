"use client";

//! THE ONLY PLACE THAT WIRES. It holds no rule of its own: state comes from the URL
//! through `useViewerState`, data from the API through `useGraph`, and every widget
//! below is handed both and reports back. Nothing here computes anything about a
//! graph — that is the app layer's job, and this file cannot be tempted because it
//! never imports the extractor.

import { Spinner } from "@heroui/react";
import { GraphCanvas } from "@/ui/GraphCanvas";
import { NodeDetail } from "@/ui/NodeDetail";
import { InterfaceDetail } from "@/ui/InterfaceDetail";
import { OverviewPanel } from "@/ui/OverviewPanel";
import { DensityControl } from "@/ui/DensityControl";
import { ExternalsToggle } from "@/ui/ExternalsToggle";
import { useGraph, useViewerState } from "@/ui/useViewer";
import { toggleOpen } from "@/lib/viewer-state";
import { densityStyle } from "@/ui/Spacing";

export default function Page() {
	const graph = useGraph();
	const [state, update] = useViewerState();

	if (!graph) {
		return (
			<main className="flex h-screen items-center justify-center">
				<Spinner />
			</main>
		);
	}

	return (
		<main className="flex h-screen">
			<section className="min-w-0 flex-1">
				<GraphCanvas
					graph={graph}
					state={state}
					onSelect={id => update(id ? toggleOpen(state, id) : { ...state, selected: "" })}
				/>
			</section>

			{/* THE ONE PLACE `--density` IS SET. Every gap in the panel is
			    `calc(token * var(--density))`, so this single style is the whole
			    setting — and `p-6` became a scaled padding for the same reason: a
			    panel that breathes inside but keeps a fixed frame reads as cramped
			    at the edges. */}
			<aside
				style={{
					...densityStyle(state.density),
					padding: "calc(24px * var(--density))",
					gap: "calc(24px * var(--density))",
				}}
				className="flex w-[380px] flex-col overflow-auto border-l border-default-200 bg-content1"
			>
				{state.selected.includes("::") ? (
					<InterfaceDetail
						graph={graph}
						id={state.selected}
						onBack={fileId => update({ ...state, selected: fileId })}
					/>
				) : state.selected ? (
					<NodeDetail
						graph={graph}
						id={state.selected}
						onBack={() => update({ ...state, selected: "" })}
						onOpen={id => update(toggleOpen(state, id))}
					/>
				) : (
					<OverviewPanel graph={graph} />
				)}

				<div className="mt-auto flex flex-col gap-3 border-t border-default-200 pt-4">
					<DensityControl
						value={state.density}
						onChange={d => update({ ...state, density: d }, false)}
					/>
					<ExternalsToggle
						value={state.externals}
						onChange={on => update({ ...state, externals: on }, false)}
					/>
				</div>
			</aside>
		</main>
	);
}
