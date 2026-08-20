"use client";

//! THE WAIT, SAYING WHAT THE TOOL IS. Three nodes on a line passing a pulse along it —
//! a spinner says "something is happening", and this says "edges are being read".
//! It is the first screen a stranger sees, and the first screen is the one that should
//! say what they are looking at.
//!
//! THIS IS THE SCENE A RIVE ARTBOARD WOULD REPLACE — see `RIVE_SEAM` in `Animation.ts`.
//! It qualifies for one exactly because it has identity and no interaction contract:
//! nothing here is clicked, so nothing breaks if the file loads a beat late.

import { useEffect, useRef } from "react";
import { trace } from "./Animation";

export function Loading({ says = "lendo os contratos" }: { says?: string }) {
	const box = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const dots = box.current?.querySelectorAll("[data-dot]");
		if (!dots) return;
		const running = trace(dots);
		// Cancelled on unmount: a loading state still animating after the data arrived
		// is a leak with a heartbeat.
		return () => running.forEach(a => a?.cancel());
	}, []);

	return (
		<div ref={box} className="flex flex-col items-center gap-5">
			<svg width="132" height="40" viewBox="0 0 132 40" aria-hidden>
				<line x1="20" y1="20" x2="66" y2="20" stroke="var(--line)" strokeWidth="2" />
				<line x1="66" y1="20" x2="112" y2="20" stroke="var(--line)" strokeWidth="2" />
				{[20, 66, 112].map((x, i) => (
					<circle
						key={x}
						data-dot
						cx={x}
						cy="20"
						r="8"
						fill={i === 1 ? "var(--runs)" : "var(--draft)"}
						style={{ transformOrigin: `${x}px 20px` }}
					/>
				))}
			</svg>
			<p className="text-xs tracking-[0.16em] text-default-400 uppercase">{says}</p>
		</div>
	);
}
