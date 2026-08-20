"use client";

//! THE VOCABULARY OF THIS SHELL — the whole of it, in one file.
//!
//! COLOUR IS A THEME AND SO IS EVERYTHING ELSE. A house that names its palette
//! (Monokai) and then writes `margin-top: 37px` has one theme and three accidents.
//! Space, motion and position get names for exactly the reason colour did: a name can
//! be reused, argued with, and changed in one place.
//!
//! THE NAMES ARE RELATIONSHIPS, NOT SIZES. `tight` and `section` say what two things
//! ARE to each other; `12px` says what they measure today. Fluent 2 puts it best —
//! space communicates grouping and hierarchy — and that is why nothing here is called
//! `space-3`.
//!
//! THE RAMP IS RADIX'S: 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64. It is the
//! best-behaved general-purpose scale in use, and density scales the whole thing by
//! one factor instead of inventing a second set of numbers.
//!
//! WHY A FILE AND NOT A TAILWIND CONFIG: an agent writing a widget reads TypeScript,
//! not a config. A token it cannot import is a token it will re-derive as `gap-[13px]`.

import type { Density } from "@/lib/viewer-state";

/** Radix's ramp, in the only order that matters: how RELATED two things are.
 *
 *  THE MIDDLE OF THE RAMP MOVED UP one step each (20/08), after looking at the panel:
 *  the ramp is right, but this panel is a column of short blocks — a heading, four
 *  chips, a heading — and at the old values two unrelated blocks were 24px apart while
 *  a heading sat 12px from its own content. Too close to read as separate, too far to
 *  read as one. `tight` and `scene` did not move: those two were never the problem. */
export const SPACE = {
	/** Parts of one thing — an icon and its label. */
	tight: 8,
	/** Two things that answer the same question. */
	related: 16,
	/** The default gap inside a group. */
	normal: 24,
	/** Between groups that share a heading. */
	group: 32,
	/** Between sections of a panel. */
	section: 48,
	/** Between the panel and the world. */
	scene: 64,
} as const;

/** Density is ONE factor over the whole ramp — Radix's idea, and the reason it works:
 *  a second hand-written scale drifts from the first within a week.
 *
 *  THE ENDS WIDENED because they finally do something. While spacing was a prop nobody
 *  passed, the three settings only ever moved the graph layout, so 0.875 and 1.15 were
 *  the safe distance between three words in a picker. Now they move the panel too, and
 *  a setting worth clicking has to be visibly different from the one beside it. */
export const DENSITY: Record<Density, number> = {
	compact: 0.8,
	balanced: 1,
	comfortable: 1.25,
};

/** Motion named by INTENT, so nobody writes `0.27s`. Durations follow Fluent 2's
 *  ramp: what enters takes longer than what leaves, because an exit that lingers
 *  reads as lag. */
export const MOTION = {
	/** Hover, focus, a colour change. */
	micro: 120,
	/** Something arriving. */
	enter: 220,
	/** Something moving from one place to another. */
	move: 320,
	/** Something leaving. Always shorter than `enter`. */
	exit: 160,
	/** Delay between siblings in a group. Fluent calls it choreography: the eye is
	 *  told what to read first, and 40ms is the point where a stagger stops looking
	 *  like a stutter. */
	stagger: 40,
} as const;

/** Where a thing sits relative to another. Used for offsets and paddings, so a
 *  popover and a satellite ring do not each invent their own distance. */
export const POSITION = {
	inside: SPACE.normal,
	adjacent: SPACE.group,
	group: SPACE.section,
	scene: SPACE.scene,
} as const;

export const space = (key: keyof typeof SPACE, density: Density = "balanced") =>
	Math.round(SPACE[key] * DENSITY[density]);

export const ms = (key: keyof typeof MOTION) => MOTION[key];

/** For a `style` prop: `style={gap("group", density)}`. */
export const gap = (key: keyof typeof SPACE, density: Density = "balanced") => ({
	gap: `${space(key, density)}px`,
});
