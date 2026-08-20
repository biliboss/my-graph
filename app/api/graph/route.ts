import { NextResponse } from "next/server";
import { extract } from "@/lib/extract";

/** Rebuilt per request: reading twelve files takes milliseconds, and a watcher would
 *  be a second source of truth about whether the page is stale. */
export const dynamic = "force-dynamic";

export function GET() {
	return NextResponse.json(extract(), { headers: { "cache-control": "no-store" } });
}
