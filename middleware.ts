import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error("Middleware error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return new NextResponse(message, { status: 500 });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
