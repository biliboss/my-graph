"use client";

//! HeroUI 3 DROPPED `HeroUIProvider` — the theme is CSS now (`@heroui/react/styles.css`
//! plus the `@theme` block in `globals.css`), and the only providers left are opt-in
//! (`RouterProvider`, `ToastProvider`). Kept as a seam so the day one is needed there
//! is a place for it that is not `layout.tsx`.

export function Providers({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
