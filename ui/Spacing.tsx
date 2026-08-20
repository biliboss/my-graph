"use client";

//! THE LAYOUT PRIMITIVES. Three of them, and no widget in this app writes a margin.
//!
//! RADIX'S LESSON, KEPT: `Section` offers a small, fixed set of vertical rhythms and
//! `Stack` only accepts a named gap. What you cannot express is the point — an
//! arbitrary `gap: 13px` has no name, so it has no reason, so nobody can defend it in
//! review. Constraining the vocabulary is what makes twenty screens look like one.
//!
//! `AnimatedGroup` IS THE CHOREOGRAPHY HALF: children enter staggered, in DOM order,
//! and reduced-motion turns it into nothing at all. Fluent 2's rule — motion directs
//! attention, so a group that appears all at once has told the eye nothing.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DENSITY, MOTION, SPACE, space } from "./Tokens";
import type { Density } from "@/lib/viewer-state";

type Gap = keyof typeof SPACE;

export function Stack({
	gap = "normal",
	density = "balanced",
	row = false,
	className = "",
	style,
	children,
}: {
	gap?: Gap;
	density?: Density;
	row?: boolean;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
}) {
	return (
		<div
			className={`flex ${row ? "flex-row" : "flex-col"} ${className}`}
			style={{ gap: space(gap, density), ...style }}
		>
			{children}
		</div>
	);
}

/** A band of the panel. Padding comes from the density, never from the caller — a
 *  section that takes its own padding is a section that will disagree with its
 *  neighbour. */
export function Section({
	title,
	density = "balanced",
	children,
}: {
	title?: string;
	density?: Density;
	children: ReactNode;
}) {
	return (
		<section style={{ display: "flex", flexDirection: "column", gap: space("related", density) }}>
			{title && (
				<h2 className="text-[11px] uppercase tracking-[0.16em] text-default-400">{title}</h2>
			)}
			{children}
		</section>
	);
}

/** Children fade in one after another. `stagger` is 40ms because below that the eye
 *  reads it as a stutter and above it as a queue. */
export function AnimatedGroup({
	children,
	density = "balanced",
}: {
	children: ReactNode[];
	density?: Density;
}) {
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
		<div style={{ display: "flex", flexDirection: "column", gap: space("related", density) }}>
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

/** Applied once on `<body>`: every token below scales from this one number, so a
 *  density change is one multiplication rather than a second set of values. */
export const densityStyle = (density: Density): CSSProperties =>
	({ "--density": DENSITY[density] } as CSSProperties);
