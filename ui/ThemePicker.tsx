"use client";

//! CHOOSING THE PALETTE. Eleven swatches, sorted by how cyberpunk they read, and each
//! one shows the three colours that actually carry meaning here — `runs`, `draft`,
//! `tool`. A picker that shows a name and a dot is a picker you have to click eleven
//! times to understand.
//!
//! HOVER SAYS WHAT IT IS. The one-line `feel` is the difference between "Aura" and
//! "Tokyo Night" for somebody who has never opened either, and both are on this list
//! precisely because they are close.

import { useState } from "react";
import { paletteOf, THEMES, THEME_NAMES, type ThemeName } from "./Themes";
import { lift, press } from "./Animation";

export function ThemePicker({
	value,
	onChange,
}: {
	value: string;
	onChange: (t: ThemeName) => void;
}) {
	const [open, setOpen] = useState(false);
	// `paletteOf`, never `THEMES[value]`: `value` comes from the URL, which is data from
	// outside — `#t=qualquer-coisa` is a string somebody can type, and indexing on it
	// crashed the panel (20/08). Unknown name falls back; it never throws.
	const current = paletteOf(value);
	// Sorted by the axis, not the alphabet: scrolling the list walks from neon to
	// nothing, which is the choice being made.
	const names = [...THEME_NAMES].sort((a, b) => THEMES[b].cyber - THEMES[a].cyber);

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				aria-expanded={open}
				onMouseEnter={e => lift(e.currentTarget, true)}
				onMouseLeave={e => lift(e.currentTarget, false)}
				onClick={e => {
					press(e.currentTarget);
					setOpen(o => !o);
				}}
				className="flex items-center gap-2 rounded-lg px-1 py-1 text-left"
			>
				<Swatch name={value} />
				<span className="text-xs" style={{ color: "var(--dim)" }}>
					{current.label}
				</span>
				<span className="ml-auto text-[10px]" style={{ color: "var(--dim)" }}>
					{open ? "▾" : "▸"}
				</span>
			</button>

			{open && (
				<div className="flex flex-col gap-0.5">
					{names.map(n => {
						const t = THEMES[n];
						const on = n === value;
						return (
							<button
								key={n}
								type="button"
								title={t.feel}
								aria-pressed={on}
								onClick={e => {
									press(e.currentTarget);
									onChange(n);
								}}
								style={{ background: on ? "var(--line)" : "transparent" }}
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left"
							>
								<Swatch name={n} />
								<span className="text-xs" style={{ color: on ? "var(--text)" : "var(--dim)" }}>
									{t.label}
								</span>
								{/* The rating as ink, not a number: marks read faster than "4.5" and
								    take the same room. The HALF is drawn hollow — rounding it away
								    put Tokyo Night (4.5) level with SynthWave (5), which is the one
								    distinction this column exists to make. */}
								<span className="ml-auto text-[10px] tracking-tight" style={{ color: "var(--dim)" }}>
									{"◆".repeat(Math.floor(t.cyber))}
									{t.cyber % 1 >= 0.5 ? "◈" : ""}
								</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

/** The three roles that carry meaning, in the theme's own colours. */
const Swatch = ({ name }: { name: string }) => {
	const t = paletteOf(name);
	return (
		<span
			style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 6, background: t.bg }}
		>
			{[t.runs, t.draft, t.tool].map(c => (
				<span key={c} style={{ width: 8, height: 8, borderRadius: 999, background: c }} />
			))}
		</span>
	);
};
