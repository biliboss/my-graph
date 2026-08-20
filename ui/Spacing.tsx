"use client";

//! THE LAYOUT PRIMITIVES. Three of them, and no widget in this app writes a margin.
//!
//! RADIX'S LESSON, KEPT: `Section` offers a small, fixed set of vertical rhythms and
//! `Stack` only accepts a named gap. What you cannot express is the point — an
//! arbitrary `gap: 13px` has no name, so it has no reason, so nobody can defend it in
//! review. Constraining the vocabulary is what makes twenty screens look like one.
//!
//! DENSITY IS A CSS VARIABLE, NOT A PROP — and this is the change that made the
//! setting real. Every primitive USED to take `density`, defaulting to `"balanced"`,
//! and not one caller ever passed it: `<Stack gap="group">` in three panels, always
//! balanced, while the URL said `comfortable` and `densityStyle` wrote a `--density`
//! nobody read. A knob threaded by hand through every component is a knob that arrives
//! nowhere. Now the gap is `calc(16px * var(--density))`, the root sets the variable
//! once, and the whole panel breathes together.
//!
//! `AnimatedGroup` IS THE CHOREOGRAPHY HALF: children enter staggered, in DOM order,
//! and reduced-motion turns it into nothing at all. Fluent 2's rule — motion directs
//! attention, so a group that appears all at once has told the eye nothing.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DENSITY, MOTION, SPACE } from "./Tokens";
import type { Density } from "@/lib/viewer-state";

type Gap = keyof typeof SPACE;

/** The one expression every primitive here uses. `var(--density, 1)` falls back to
 *  balanced, so a subtree rendered outside the root still has correct spacing rather
 *  than none — a missing variable would collapse `calc()` to nothing at all. */
const scaled = (gap: Gap) => `calc(${SPACE[gap]}px * var(--density, 1))`;

export function Stack({
	gap = "normal",
	row = false,
	className = "",
	style,
	children,
}: {
	gap?: Gap;
	row?: boolean;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}) {
	return (
		<div
			className={`flex ${row ? "flex-row" : "flex-col"} ${className}`}
			style={{ gap: scaled(gap), ...style }}
		>
			{children}
		</div>
	);
}

/** A band of the panel: a quiet heading, then its content.
 *
 *  THE HEADING SITS CLOSER TO WHAT IT LABELS than the section sits to its neighbour —
 *  `related` inside, `group` outside. That difference IS the hierarchy; equal gaps
 *  above and below a title make the eye guess which side it belongs to. */
export function Section({
	title,
	children,
}: {
	title?: string;
	children: ReactNode;
}) {
	return (
		<section style={{ display: "flex", flexDirection: "column", gap: scaled("related") }}>
			{title && (
				<h2 className="text-[11px] uppercase tracking-[0.18em] text-default-400">{title}</h2>
			)}
			{children}
		</section>
	);
}

/** Children fade in one after another. `stagger` is 40ms because below that the eye
 *  reads it as a stutter and above it as a queue. */
export function AnimatedGroup({ children }: { children: ReactNode[] }) {
	const [shown, setShown] = useState(0);
	const reduced =
		typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

	useEffect(() => {
		if (reduced) return setShown(children.length);
		let i = 0;
		const t = setInterval(() => {
			i += 1;
			setShown(i);
			if (i >= children.length) clearInterval(t);
		}, MOTION.stagger);
		return () => clearInterval(t);
	}, [children.length, reduced]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: scaled("related") }}>
			{children.map((child, i) => (
				<div
					key={i}
					style={{
						opacity: i < shown ? 1 : 0,
						transform: i < shown ? "none" : "translateY(4px)",
						transition: `opacity ${MOTION.enter}ms ease, transform ${MOTION.enter}ms ease`,
					}}
				>
					{child}
				</div>
			))}
		</div>
	);
}

/** Applied once, on the element that wraps the panel: every gap below scales from this
 *  one number, so a density change is one multiplication rather than a second set of
 *  values — and rather than a prop threaded through five components. */
export const densityStyle = (density: Density): CSSProperties =>
	({ "--density": DENSITY[density] } as CSSProperties);
