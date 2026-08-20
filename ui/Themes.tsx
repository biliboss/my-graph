"use client";

//! THE PALETTES — eleven of them, and the same eight roles in each.
//!
//! A THEME HERE IS NOT A LIST OF COLOURS, it is an assignment of the shell's ROLES to
//! one family's colours. `runs`, `draft`, `tool`, `outside` are what the graph means;
//! `#a6e22e` is what Monokai happens to call the first of them. Widgets ask for the
//! role, never the hex — which is why adding the twelfth theme is one entry here and
//! no edit anywhere else.
//!
//! WHY THESE ELEVEN: they are the families people already have in their editor, so the
//! window next to this one is not translating. Ranked by how CYBERPUNK they read,
//! which is a real axis and not a joke — a tool that looks like a game HUD is read as
//! a toy, and one that looks like nothing is read as a form. `cyber` is stored so the
//! picker can sort by it and so the choice is arguable instead of decorative.
//!
//! THE ROLES REACH CSS AS VARIABLES and cytoscape as values. The canvas is not the
//! DOM: it cannot inherit `var(--runs)`, so `GraphCanvas` reads the same record. One
//! source, two consumers — the alternative is a picture that disagrees with the panel
//! beside it.

export type ThemeName =
	| "monokai" | "monokai-pro" | "dracula" | "aura" | "tokyo-night"
	| "synthwave" | "cyberpunk" | "catppuccin" | "nord" | "darcula" | "github-dark";

export type Palette = {
	label: string;
	/** How cyberpunk it reads, 1–5. The axis the shell was chosen on. */
	cyber: number;
	/** One line, and it must distinguish this theme from its neighbour in the list. */
	feel: string;
	/** Behind everything. */
	bg: string;
	/** The panel, one step off the background. */
	panel: string;
	/** Borders, dividers, and the circles for paths outside the tree. */
	line: string;
	text: string;
	/** Text that is present but not the point. */
	dim: string;
	/** A system that documents code that RUNS. The theme's most affirmative colour. */
	runs: string;
	/** A draft: nothing implemented behind it. */
	draft: string;
	/** A `tools` system, wrapping a program this house does not own. */
	tool: string;
	/** Something wrong — a cycle, a check that failed. */
	danger: string;
};

/** Ordered by `cyber`, descending: the list IS the ranking, so a reader scrolling the
 *  picker is walking the axis rather than an alphabet. */
export const THEMES: Record<ThemeName, Palette> = {
	synthwave: {
		label: "SynthWave '84", cyber: 5, feel: "arcade neon — Blade Runner com fita cassete",
		bg: "#241b2f", panel: "#262335", line: "#495495", text: "#f4eee4", dim: "#848bbd",
		runs: "#72f1b8", draft: "#ff7edb", tool: "#36f9f6", danger: "#fe4450",
	},
	cyberpunk: {
		label: "Cyberpunk", cyber: 5, feel: "amarelo/ciano agressivo — HUD de jogo assumido",
		bg: "#0b0c10", panel: "#101116", line: "#2a2d3a", text: "#e6f1ff", dim: "#6b7280",
		runs: "#00ff9f", draft: "#fcee0a", tool: "#00f0ff", danger: "#ff003c",
	},
	aura: {
		label: "Aura", cyber: 5, feel: "cyberpunk de PRODUTO — preto profundo, roxo vivo",
		bg: "#15141b", panel: "#1c1b22", line: "#3b334a", text: "#edecee", dim: "#6d6d6d",
		runs: "#61ffca", draft: "#a277ff", tool: "#82e2ff", danger: "#ff6767",
	},
	"tokyo-night": {
		label: "Tokyo Night", cyber: 4.5, feel: "cidade japonesa à noite — o mais polido dos futuristas",
		bg: "#1a1b26", panel: "#16161e", line: "#292e42", text: "#c0caf5", dim: "#565f89",
		runs: "#9ece6a", draft: "#bb9af7", tool: "#7dcfff", danger: "#f7768e",
	},
	dracula: {
		label: "Dracula", cyber: 4, feel: "hacker clássico — roxo, rosa e ciano",
		bg: "#282a36", panel: "#21222c", line: "#44475a", text: "#f8f8f2", dim: "#6272a4",
		runs: "#50fa7b", draft: "#bd93f9", tool: "#8be9fd", danger: "#ff5555",
	},
	"monokai-pro": {
		label: "Monokai Pro", cyber: 3.5, feel: "o Monokai editorial — neon domado",
		bg: "#221f22", panel: "#2d2a2e", line: "#403e41", text: "#fcfcfa", dim: "#727072",
		runs: "#a9dc76", draft: "#ab9df2", tool: "#78dce8", danger: "#ff6188",
	},
	monokai: {
		label: "Monokai", cyber: 3.5, feel: "o clássico do editor — verde ácido e magenta",
		bg: "#1d1e19", panel: "#26271f", line: "#3b3d33", text: "#f8f8f2", dim: "#75715e",
		runs: "#a6e22e", draft: "#ae81ff", tool: "#66d9ef", danger: "#f92672",
	},
	catppuccin: {
		label: "Catppuccin Mocha", cyber: 3, feel: "futurista aconchegante — pastel, não neon",
		bg: "#1e1e2e", panel: "#181825", line: "#313244", text: "#cdd6f4", dim: "#6c7086",
		runs: "#a6e3a1", draft: "#cba6f7", tool: "#89dceb", danger: "#f38ba8",
	},
	nord: {
		label: "Nord", cyber: 2, feel: "sci-fi escandinavo — frio e contido",
		bg: "#2e3440", panel: "#3b4252", line: "#4c566a", text: "#eceff4", dim: "#7b8394",
		runs: "#a3be8c", draft: "#b48ead", tool: "#88c0d0", danger: "#bf616a",
	},
	darcula: {
		label: "Darcula", cyber: 2, feel: "IDE profissional — nada de neon",
		bg: "#2b2b2b", panel: "#313335", line: "#4b4b4b", text: "#a9b7c6", dim: "#808080",
		runs: "#6a8759", draft: "#cc7832", tool: "#6897bb", danger: "#cf5b56",
	},
	"github-dark": {
		label: "GitHub Dark", cyber: 1, feel: "ferramenta de dev limpa — zero cyberpunk",
		bg: "#0d1117", panel: "#161b22", line: "#30363d", text: "#c9d1d9", dim: "#8b949e",
		runs: "#3fb950", draft: "#bc8cff", tool: "#58a6ff", danger: "#f85149",
	},
};

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];

export const paletteOf = (name: string): Palette => THEMES[name as ThemeName] ?? THEMES.monokai;

/** EVERY ROLE AS A CSS VARIABLE, applied once on the element that wraps the app.
 *
 *  HeroUI's own tokens are re-pointed at the same values in the same pass — otherwise
 *  a card keeps Monokai's surface while the text beside it turns Tokyo Night, and the
 *  panel looks broken rather than themed. */
export const themeStyle = (name: string): React.CSSProperties => {
	const p = paletteOf(name);
	return {
		"--bg": p.bg, "--panel": p.panel, "--line": p.line, "--text": p.text, "--dim": p.dim,
		"--runs": p.runs, "--draft": p.draft, "--tool": p.tool, "--danger": p.danger,
		"--color-background": p.bg,
		"--color-content1": p.panel,
		"--color-foreground": p.text,
		"--color-primary": p.runs,
		"--color-primary-foreground": p.bg,
		"--color-secondary": p.draft,
		"--color-danger": p.danger,
		"--color-default-100": p.panel,
		"--color-default-200": p.line,
		"--color-default-400": p.dim,
		"--color-default-500": p.text,
		background: p.bg,
		color: p.text,
	} as React.CSSProperties;
};
