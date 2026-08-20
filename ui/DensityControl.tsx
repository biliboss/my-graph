"use client";

//! Three densities, and the choice lives in the URL like everything else — a shell
//! that forgets how tight you like it is a shell you re-adjust every morning.
//!
//! HAND-ROLLED SEGMENTED CONTROL, not HeroUI's ButtonGroup: `variant="soft"` renders
//! the selected item as plain text on this build, so the control showed three words and
//! no state at all (measured 20/08). A picker whose current value is invisible is not a
//! picker.

import type { Density } from "@/lib/viewer-state";
import { MOTION } from "./Tokens";
import { lift, press } from "./Animation";

const OPTIONS: { key: Density; label: string }[] = [
	{ key: "compact", label: "Compacta" },
	{ key: "balanced", label: "Balanceada" },
	{ key: "comfortable", label: "Confortável" },
];

export function DensityControl({
	value,
	onChange,
}: {
	value: Density;
	onChange: (d: Density) => void;
}) {
	return (
		<div
			role="radiogroup"
			aria-label="Densidade"
			className="flex gap-0.5 rounded-lg bg-default-100/60 p-0.5"
		>
			{OPTIONS.map(o => {
				const on = value === o.key;
				return (
					<button
						key={o.key}
						type="button"
						role="radio"
						aria-checked={on}
						onMouseEnter={e => !on && lift(e.currentTarget, true)}
					onMouseLeave={e => !on && lift(e.currentTarget, false)}
					onClick={e => {
						// The SELECTED one does not lift on hover — it is already raised, and a
						// control that answers a cursor it has already answered reads as loose.
						press(e.currentTarget);
						onChange(o.key);
					}}
						// INLINE, not a utility class: HeroUI's stylesheet is imported after
						// Tailwind and its `button` reset paints every one of them transparent —
						// `bg-primary` computed to `rgba(0,0,0,0)` and the control looked like
						// three words again (measured 20/08).
						style={{
							transitionDuration: `${MOTION.micro}ms`,
							background: on ? "var(--runs)" : "transparent",
							color: on ? "var(--bg)" : undefined,
						}}
						className={[
							"flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
							on ? "" : "text-default-400 hover:text-default-500",
						].join(" ")}
					>
						{o.label}
					</button>
				);
			})}
		</div>
	);
}
