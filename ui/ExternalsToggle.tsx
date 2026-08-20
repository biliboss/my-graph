"use client";

//! THE DASHED SATELLITES — `src/…`, the paths an interface only CITES in a comment.
//! Off by default: 13 grey circles around 9 real ones is a picture of the extractor,
//! not of the architecture. On when the question is "where does this land".

import { MOTION } from "./Tokens";

export function ExternalsToggle({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (on: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={value}
			onClick={() => onChange(!value)}
			className="group flex items-center gap-2.5 rounded-lg px-1 py-1 text-left"
		>
			<span
				// Inline colours for the same reason DensityControl uses them: HeroUI's
				// reset is imported after Tailwind and wins on background.
				// SIZES INLINE, like the colours: `w-7 h-4` measured 1200×0 in the browser —
				// Tailwind is not emitting those utilities for this file, so a class here is
				// a wish, not a size (measured 20/08).
				style={{
					display: "block",
					width: 28, height: 16, borderRadius: 999, flexShrink: 0, position: "relative",
					background: value ? "#a6e22e" : "#3b3d33",
					transitionDuration: `${MOTION.micro}ms`,
				}}
				className="transition-colors"
			>
				<span
					style={{
						position: "absolute", top: 2, left: value ? 14 : 2,
						width: 12, height: 12, borderRadius: 999, background: "#1d1e19",
						transition: `left ${MOTION.micro}ms`,
					}}
				/>
			</span>
			<span className="text-xs text-default-400 group-hover:text-default-500">
				caminhos <code className="font-mono">src/</code> (tracejado)
			</span>
		</button>
	);
}
