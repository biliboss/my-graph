"use client";

//! THE PANEL'S CONTENTS CHANGING, and the direction it changes in.
//!
//! DEPTH IS THE DIRECTION. Overview → node → interface is going IN, and the content
//! arrives from the right; every `← back` is going OUT, and it arrives from the left.
//! A panel that always slides the same way tells you something changed and nothing
//! about what — the direction is the only part of this that carries information, and
//! it is why the component takes a `depth` rather than a boolean.
//!
//! IT KEYS ON WHAT IS SHOWN, not on every render. Re-rendering because the graph
//! reloaded must not replay the entrance: an animation that fires when nothing moved
//! trains the eye to ignore it.

import { useEffect, useRef } from "react";
import { panelIn, reveal } from "./Animation";

export function PanelSwap({
	/** What is on screen — `""`, `kanban`, `kanban::Metrics`. Changing it plays. */
	id,
	/** How far in this view is. Higher than last time slides in, lower slides out. */
	depth,
	children,
}: {
	id: string;
	depth: number;
	children: React.ReactNode;
}) {
	const box = useRef<HTMLDivElement>(null);
	const was = useRef(depth);

	useEffect(() => {
		const el = box.current;
		if (!el) return;
		panelIn(el, depth >= was.current ? "in" : "out");
		// The rows arrive after the panel does. `:scope >` so a nested list does not get
		// its own stagger inside a row that is already staggering.
		reveal(el.querySelectorAll(":scope > * > *"));
		was.current = depth;
	}, [id, depth]);

	return <div ref={box}>{children}</div>;
}
