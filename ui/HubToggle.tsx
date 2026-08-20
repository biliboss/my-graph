"use client";

//! HIDING THE ARROWS INTO THE HUB — the one node half the graph imports.
//!
//! TWELVE TRUE ARROWS THAT SAY NOTHING. Everything imports `shared`, because that is
//! the design: it is the bottom layer, it depends on nobody, and every system is
//! allowed to use it. Drawn, those arrows dominate the picture and push the layout
//! apart while carrying one fact the reader learned once. Hidden, what remains is the
//! part that actually changes — who depends on whom ABOVE the floor.
//!
//! THE HUB IS COMPUTED, NEVER NAMED. `shared` is this codebase's word; the next tree
//! this tool draws will have another. `hubs()` in the app layer finds it by counting.

import { Toggle } from "./Toggle";

export function HubToggle({
	value,
	onChange,
	names,
}: {
	value: boolean;
	onChange: (on: boolean) => void;
	/** What was found to be a hub, so the label names it instead of saying "hub". */
	names: string[];
}) {
	if (!names.length) return null;
	return (
		<Toggle value={value} onChange={onChange}>
			esconder setas para <code className="font-mono">{names.join(", ")}</code>
		</Toggle>
	);
}
