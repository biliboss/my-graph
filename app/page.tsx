"use client";

//! THE ONLY PLACE THAT WIRES. It holds no rule of its own: state comes from the URL
//! through `useViewerState`, data from the API through `useGraph`, and every widget
//! below is handed both and reports back. Nothing here computes anything about a
//! graph — that is the app layer's job, and this file cannot be tempted because it
//! never imports the extractor.

import { GraphCanvas } from "@/ui/GraphCanvas";
import { NodeDetail } from "@/ui/NodeDetail";
import { InterfaceDetail } from "@/ui/InterfaceDetail";
import { OverviewPanel } from "@/ui/OverviewPanel";
import { DensityControl } from "@/ui/DensityControl";
import { ExternalsToggle } from "@/ui/ExternalsToggle";
import { useGraph, useViewerState } from "@/ui/useViewer";
import { hubs, toggleOpen } from "@/lib/viewer-state";
import { densityStyle } from "@/ui/Spacing";
import { PanelSwap } from "@/ui/PanelSwap";
import { Loading } from "@/ui/Loading";
import { HubToggle } from "@/ui/HubToggle";
import { OrphansToggle } from "@/ui/OrphansToggle";
import { ThemePicker } from "@/ui/ThemePicker";
import { themeStyle } from "@/ui/Themes";

export default function Page() {
	const graph = useGraph();
	const [state, update] = useViewerState();

	if (!graph) {
		return (
			<main className="flex h-screen items-center justify-center" style={themeStyle("monokai")}>
				<Loading />
			</main>
		);
	}

	// THE THEME IS SET ON <main>, one level above both halves: the panel inherits the
	// variables and the canvas is handed the same record by name. Setting it on the
	// panel only would leave the graph in whatever palette it was compiled with.
	return (
		<main className="flex h-screen" style={themeStyle(state.theme)}>
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
				{/* DEPTH, not a boolean: overview is 0, a file is 1, one of its interfaces
				    is 2 — and the number is what tells the swap which way to slide. */}
				<PanelSwap
					id={state.selected}
					depth={state.selected.includes("::") ? 2 : state.selected ? 1 : 0}
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
				</PanelSwap>

				<div className="mt-auto flex flex-col gap-3 border-t border-default-200 pt-4">
					<DensityControl
						value={state.density}
						onChange={d => update({ ...state, density: d }, false)}
					/>
					<ExternalsToggle
						value={state.externals}
						onChange={on => update({ ...state, externals: on }, false)}
					/>
					<HubToggle
						value={state.hideHub}
						names={hubs(graph)}
						onChange={on => update({ ...state, hideHub: on }, false)}
					/>
					<OrphansToggle
						value={state.orphans}
						count={graph.nodes.reduce((n, x) => n + (x.files?.length ?? 0), 0)}
						onChange={on => update({ ...state, orphans: on }, false)}
					/>
					<ThemePicker
						value={state.theme}
						onChange={t => update({ ...state, theme: t }, false)}
					/>
				</div>
			</aside>
		</main>
	);
}
