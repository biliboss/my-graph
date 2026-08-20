"use client";

//! THE ONE BRIDGE between the application layer and React. Every widget reads state
//! through this hook and changes it through `update` — none of them touches the URL,
//! and none of them keeps a copy.
//!
//! WHY A HOOK AND NOT A CONTEXT WITH A REDUCER: the store is the URL. There is
//! nothing to hold, only something to read and write, and a reducer would add a copy
//! that has to be kept in agreement with the address bar.

import { useCallback, useEffect, useState } from "react";
import type { Graph } from "@/lib/extract";
import { parse, serialize, type ViewerState } from "@/lib/viewer-state";

export function useViewerState() {
	const [state, setState] = useState<ViewerState>(() => parse(""));

	useEffect(() => {
		const read = () => setState(parse(location.hash));
		read();
		addEventListener("hashchange", read);
		return () => removeEventListener("hashchange", read);
	}, []);

	/** `push` false for a change nobody would want to undo — density, mostly. */
	const update = useCallback((next: ViewerState, push = true) => {
		const url = serialize(next);
		push ? history.pushState(null, "", url) : history.replaceState(null, "", url);
		setState(next);
	}, []);

	return [state, update] as const;
}

/** Polls the API and swaps the graph only when it actually changed.
 *
 *  DEEP-COMPARED, NOT TIMESTAMPED: the response carries `generated_at`, which differs
 *  on every request, so trusting it would redraw the picture every two seconds and
 *  make the layout unreadable. */
export function useGraph(intervalMs = 2000) {
	const [graph, setGraph] = useState<Graph | null>(null);

	useEffect(() => {
		let alive = true;
		let last = "";

		const pull = async () => {
			try {
				const next: Graph = await (await fetch("/api/graph", { cache: "no-store" })).json();
				const fingerprint = JSON.stringify([next.nodes, next.edges]);
				if (!alive || fingerprint === last) return;
				last = fingerprint;
				setGraph(next);
			} catch {
				// A failed poll is not an event: the files are still there, the next tick
				// will get them, and a toast every time a save races the read is noise.
			}
		};

		pull();
		const t = setInterval(pull, intervalMs);
		return () => { alive = false; clearInterval(t); };
	}, [intervalMs]);

	return graph;
}
