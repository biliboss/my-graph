"use client";

//! ONE HOVER, ONE PRESS, EVERYWHERE. A `<button>` and a chip and a back-link all
//! answer the cursor the same way, because a shell where three controls each invented
//! their own feedback is a shell that feels assembled rather than designed.
//!
//! IT WRAPS RATHER THAN REPLACES: `asChild`-style cloning would fight HeroUI, and the
//! span costs nothing. The element it wraps keeps its own styling; only the movement
//! comes from here.

import { useRef, type ReactNode } from "react";
import { lift, press } from "./Animation";

export function Pressable({
	children,
	onClick,
	className = "",
	title,
}: {
	children: ReactNode;
	onClick?: () => void;
	className?: string;
	title?: string;
}) {
	const el = useRef<HTMLSpanElement>(null);

	return (
		<span
			ref={el}
			title={title}
			className={`inline-block ${onClick ? "cursor-pointer" : ""} ${className}`}
			style={{ willChange: "transform" }}
			onMouseEnter={() => lift(el.current, true)}
			onMouseLeave={() => lift(el.current, false)}
			onClick={() => {
				press(el.current);
				onClick?.();
			}}
		>
			{children}
		</span>
	);
}
