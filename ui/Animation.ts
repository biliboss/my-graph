"use client";

//! THE MOTION VOCABULARY — the second half of `Tokens.tsx`.
//!
//! `Tokens` names HOW LONG; this names HOW. A duration alone does not describe a
//! movement: 220ms linear and 220ms on a spring are different objects to the eye, and
//! a house that named its palette and its spacing and then wrote
//! `cubic-bezier(.4,0,.2,1)` inline has one theme and three accidents again.
//!
//! WEB ANIMATIONS API, NOT A LIBRARY. `element.animate()` is in every browser this
//! runs in, it composes with CSS transitions, and it returns a handle you can cancel —
//! which is the entire reason a panel that changes twice in 200ms does not end up
//! playing two entrances on top of each other. framer-motion is already a dependency
//! here and still loses: it wants to own the element, and cytoscape owns half of them.
//!
//! REDUCED MOTION IS CHECKED IN ONE PLACE — `play()`. Every verb below funnels through
//! it, so a new animation cannot forget: the accessibility rule is structural, not a
//! line somebody remembers to copy. It does not merely shorten the animation, it skips
//! to the end state, which is the difference between "fast" and "off".
//!
//! WHERE RIVE WOULD PLUG IN: `RIVE_SEAM` at the bottom. Nothing here imports Rive, and
//! that is deliberate — a `.riv` is authored in Rive's editor and there is none in this
//! repo, so the dependency would buy a blank canvas. The seam says exactly what to add
//! and where, and costs nothing until an artboard exists.

/** THE CURVES, named by what the movement IS.
 *
 *  `snap` overshoots slightly — it is for things answering YOU, where a little
 *  bounce reads as responsiveness. `glide` never overshoots: it is for things that
 *  moved because the app decided, where a bounce reads as noise. `settle` is the long
 *  one, for something arriving from off-screen and coming to rest. */
export const SPRING = {
	snap: "cubic-bezier(0.22, 1.4, 0.36, 1)",
	glide: "cubic-bezier(0.22, 0.61, 0.36, 1)",
	settle: "cubic-bezier(0.16, 1, 0.3, 1)",
	/** Leaving. Starts fast and stays fast — an exit that eases IN reads as lag. */
	exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const reducedMotion = () =>
	typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** THE ONLY PLACE THAT CALLS `animate()`.
 *
 *  Under reduced motion it applies the LAST keyframe and returns null: the element ends
 *  where the animation would have put it, without the journey. An implementation that
 *  merely set `duration: 0` would still fire a frame of the first keyframe, and a panel
 *  that flashes at its start position is worse than no animation at all. */
export function play(
	el: Element | null | undefined,
	keyframes: Keyframe[],
	options: KeyframeAnimationOptions,
): Animation | null {
	if (!el) return null;
	if (reducedMotion()) {
		Object.assign((el as HTMLElement).style, keyframes[keyframes.length - 1] as object);
		return null;
	}
	// `cancel` on the same element first: two entrances racing is how a panel ends up
	// half-transparent forever, because the loser's fill never gets overwritten.
	el.getAnimations().forEach(a => a.cancel());
	return el.animate(keyframes, { fill: "both", ...options });
}

// ─── THE PANEL ──────────────────────────────────────────────────────────────

/** WHICH WAY THE READER WENT. `in` is going deeper — overview → node → interface;
 *  `out` is coming back. The direction is the information: a panel that always slides
 *  the same way tells you something changed, and nothing about what. */
export type Direction = "in" | "out";

/** The lateral panel replacing its contents. Slides against the direction of travel,
 *  the way a page does under your thumb, and crossfades because the two contents are
 *  different heights and a pure slide would look like a jump. */
export const panelIn = (el: Element | null, dir: Direction = "in") =>
	play(
		el,
		[
			{ opacity: 0, transform: `translateX(${dir === "in" ? 18 : -18}px)` },
			{ opacity: 1, transform: "translateX(0)" },
		],
		{ duration: 260, easing: SPRING.settle },
	);

/** One row inside the panel, revealed after its siblings. Returns the animations so a
 *  caller can await the last one; `stagger` matches `MOTION.stagger` for the reason
 *  every token exists — two numbers for one idea drift apart. */
export const reveal = (els: ArrayLike<Element>, stagger = 40) =>
	Array.from(els).map((el, i) =>
		play(
			el,
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 220, delay: i * stagger, easing: SPRING.glide },
		),
	);

// ─── CONTROLS ───────────────────────────────────────────────────────────────

/** Hover on something clickable: rises 2px and casts a little more shadow.
 *
 *  TWO PIXELS, NOT SIX. The movement exists to say "this responds", and a control that
 *  jumps under the cursor makes the cursor chase it — the target moved while the user
 *  was aiming at it. `snap` is the curve because this one is answering the person. */
export const lift = (el: Element | null, on: boolean) =>
	play(
		el,
		on
			? [
					{ transform: "translateY(0)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
					{ transform: "translateY(-2px)", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" },
				]
			: [
					{ transform: "translateY(-2px)", boxShadow: "0 4px 14px rgba(0,0,0,0.35)" },
					{ transform: "translateY(0)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
				],
		{ duration: on ? 140 : 100, easing: on ? SPRING.snap : SPRING.exit },
	);

/** Confirms a click landed, on the element that was clicked. Shorter than `lift` and
 *  scale-only: it is feedback, not a state change, and it must be over before the
 *  thing it triggered has finished. */
export const press = (el: Element | null) =>
	play(el, [{ transform: "scale(0.96)" }, { transform: "scale(1)" }], {
		duration: 160,
		easing: SPRING.snap,
	});

// ─── THE GRAPH ──────────────────────────────────────────────────────────────

/** A PULSE ON THE SELECTED NODE, drawn by cytoscape rather than the DOM.
 *
 *  The canvas is one element, so nothing above can touch a circle inside it — this
 *  takes the cytoscape node and animates its style through cytoscape's own queue.
 *  Kept HERE anyway, next to the other movements, because the alternative is the graph
 *  inventing a second motion vocabulary that drifts from this one.
 *
 *  Typed loosely on purpose: importing cytoscape's types here would make the motion
 *  vocabulary depend on the renderer, and the next surface that wants a pulse is not
 *  going to be a graph. */
export function pulse(node: {
	animate(o: unknown): unknown;
	style(k: string): unknown;
	length?: number;
	/** O core dono deste nó, quando houver — usado só pra saber se ainda existe. */
	cy?: () => { destroyed(): boolean };
}) {
	// O SEGUNDO TEMPO DESTE PULSO ACONTECE 180ms DEPOIS, e nesse intervalo cabe um hot
	// reload inteiro. Sem esta guarda, o `complete` anima contra um core destruído e
	// estoura de dentro da biblioteca (`Cannot read properties of null (reading
	// 'isHeadless')`, 20/08).
	const gone = () => node.cy?.()?.destroyed() ?? false;
	if (!node || reducedMotion() || gone()) return;
	const width = Number(node.style("width")) || 40;
	node.animate({
		style: { "border-width": 10, "border-color": "#a6e22e", "border-opacity": 0.35 },
		duration: 180,
		easing: "ease-out",
		complete: () => {
			if (gone()) return;
			node.animate({
				style: { "border-width": 2, "border-color": "#1d1e19", "border-opacity": 1 },
				duration: 420,
				easing: "ease-in-out",
			});
		},
	});
	return width;
}

// ─── LOADING ────────────────────────────────────────────────────────────────

/** THE WAIT, as a graph rather than a spinner: three dots that pass a pulse along a
 *  line, which is what this app is about. A generic spinner says "something is
 *  happening"; this says "edges are being read", and the first screen a stranger sees
 *  is the one that should say what the tool is.
 *
 *  Returns the animations so the caller can cancel them — a loading state that keeps
 *  animating after the data arrives is a leak with a heartbeat. */
export const trace = (dots: ArrayLike<Element>) =>
	Array.from(dots).map((el, i) =>
		play(
			el,
			[
				{ opacity: 0.25, transform: "scale(0.8)" },
				{ opacity: 1, transform: "scale(1.15)" },
				{ opacity: 0.25, transform: "scale(0.8)" },
			],
			{ duration: 1200, delay: i * 160, iterations: Infinity, easing: SPRING.glide },
		),
	);

// ─── RIVE_SEAM ──────────────────────────────────────────────────────────────
//
// WHAT IS MISSING AND WHY IT IS NOT HERE: Rive renders an ARTBOARD — a `.riv` file
// authored in Rive's editor, a binary nobody writes by hand. This repo has none, so
// installing `@rive-app/react-canvas` today would add ~200KB of runtime to render a
// blank canvas, and a component nobody can test.
//
// When an artboard exists, this is the whole change:
//
//   bun add @rive-app/react-canvas
//
//   // ui/RiveScene.tsx
//   "use client";
//   import { useRive } from "@rive-app/react-canvas";
//   export function RiveScene({ src, stateMachine = "State Machine 1" }) {
//     const { RiveComponent } = useRive({
//       src, stateMachines: stateMachine, autoplay: !reducedMotion(),
//     });
//     return <RiveComponent />;
//   }
//
// TWO RULES FOR WHOEVER ADDS IT, so the vocabulary above does not fork:
//
//   1. Rive replaces a SCENE, never a control. An artboard is the right tool for the
//      loading state or an empty state — something with its own identity and no
//      interaction contract. A hover on a button must stay `lift()`: 140ms of
//      transform costs nothing, and routing it through a state machine means a button
//      whose feedback depends on a network-loaded file.
//   2. `autoplay: !reducedMotion()` is not optional, and the artboard needs a static
//      first frame worth looking at — under reduced motion that frame IS the scene.

export const RIVE_SEAM = "ui/RiveScene.tsx — see the note above; needs a .riv first";
