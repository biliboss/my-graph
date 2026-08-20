"use client";

//! ONE SWITCH, USED BY ALL OF THEM. It started as `ExternalsToggle`, and the second
//! toggle would have copied its markup — including the two inline-style fixes it
//! carries, which is exactly how a shell ends up with two switches that disagree by a
//! pixel.
//!
//! SIZES AND COLOURS INLINE, on purpose: `w-7 h-4` measured 1200×0 in this app —
//! Tailwind is not emitting those utilities for these files — and HeroUI's stylesheet
//! loads after Tailwind and paints every `background` transparent. A class here is a
//! wish; a style is a size.

import { press } from "./Animation";
import { MOTION } from "./Tokens";

export function Toggle({
	value,
	onChange,
	children,
}: {
	value: boolean;
	onChange: (on: boolean) => void;
	/** The label. A switch with no sentence beside it is a switch you flip to find out. */
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={value}
			onClick={e => {
				press(e.currentTarget.querySelector("span"));
				onChange(!value);
			}}
			className="group flex items-center gap-2.5 rounded-lg px-1 py-1 text-left"
		>
			<span
				style={{
					display: "block",
					width: 28, height: 16, borderRadius: 999, flexShrink: 0, position: "relative",
					background: value ? "var(--runs)" : "var(--line)",
					transitionDuration: `${MOTION.micro}ms`,
				}}
				className="transition-colors"
			>
				<span
					style={{
						position: "absolute", top: 2, left: value ? 14 : 2,
						width: 12, height: 12, borderRadius: 999, background: "var(--bg)",
						transition: `left ${MOTION.micro}ms`,
					}}
				/>
			</span>
			<span className="text-xs" style={{ color: "var(--dim)" }}>
				{children}
			</span>
		</button>
	);
}
