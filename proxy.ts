import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { isMaliciousProbe, shouldEnforceHttps } from "@/lib/security/request-shield";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/create",
  "/upload",
  "/analysis",
  "/editor",
  "/my-cvs",
  "/settings",
  "/backoffice",
];

const SUPERUSER_PREFIXES = ["/backoffice", "/api/backoffice"];
const AUTH_PAGES = ["/login", "/register"];

const SUPERUSER_EMAILS = new Set([
  "bolajim@gmail.com",
  "dawodubolajim@gmail.com",
]);

function isSuperUserEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envSuper = process.env.SUPERUSER_EMAIL?.trim().toLowerCase();
  const envAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return (
    SUPERUSER_EMAILS.has(normalized) ||
    Boolean(envSuper && normalized === envSuper) ||
    Boolean(envAdmin && normalized === envAdmin)
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isSuperUserRoute(pathname: string): boolean {
  return SUPERUSER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function parseDevToken(token: string | undefined): {
  userId?: string;
  email?: string;
  role?: string;
  exp?: number;
} | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (json.exp && json.exp < Date.now()) return null;
    return json;
  } catch {
    return null;
  }
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.paystack.co\" \"https://checkout.paystack.com\")"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const forwardedProto = request.headers.get("x-forwarded-proto");

  // 1. Enforce HTTPS in production environments
  if (shouldEnforceHttps(forwardedProto, host, process.env.NODE_ENV)) {
    const secureUrl = new URL(`https://${host}${pathname}${search}`);
    return NextResponse.redirect(secureUrl, 308);
  }

  // 2. Terminate malicious vulnerability scanners & exploit probes immediately
  if (isMaliciousProbe(pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const clientIp = getClientIp(request.headers);

  // 3. API Rate Limiting Shields
  if (pathname.startsWith("/api/auth/")) {
    const rate = checkRateLimit(`auth:${clientIp}`, 15, 60);
    if (!rate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { ok: false, error: "Too many authentication requests. Please wait a moment and try again." },
          { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } }
        )
      );
    }
  } else if (pathname === "/api/contact" && request.method === "POST") {
    const rate = checkRateLimit(`contact:${clientIp}`, 5, 300);
    if (!rate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { ok: false, error: "Too many inquiries submitted. Please wait a few minutes before trying again." },
          { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } }
        )
      );
    }
  } else if (pathname === "/api/upload" && request.method === "POST") {
    const rate = checkRateLimit(`upload:${clientIp}`, 15, 600);
    if (!rate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { ok: false, error: "Upload rate limit reached. Please wait before uploading more documents." },
          { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } }
        )
      );
    }
  } else if (pathname === "/api/billing" && request.method === "POST") {
    const rate = checkRateLimit(`billing:${clientIp}`, 10, 300);
    if (!rate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { ok: false, error: "Checkout rate limit exceeded. Please wait a moment." },
          { status: 429, headers: { "Retry-After": String(rate.resetSeconds) } }
        )
      );
    }
  }

  // 4. CSRF / Origin Validation on Mutating API Endpoints
  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const isApiRoute = pathname.startsWith("/api/");
  const isWebhook = pathname.startsWith("/api/billing/webhook");

  if (isMutatingMethod && isApiRoute && !isWebhook) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const hostWithoutPort = host.split(":")[0]?.toLowerCase();
        const originHostWithoutPort = originUrl.hostname.toLowerCase();

        const isSameOrigin =
          originHostWithoutPort === hostWithoutPort ||
          originHostWithoutPort === "localhost" ||
          originHostWithoutPort === "127.0.0.1" ||
          originHostWithoutPort.endsWith(".trycloudflare.com") ||
          originHostWithoutPort.endsWith(".loca.lt");

        if (!isSameOrigin) {
          return applySecurityHeaders(
            NextResponse.json(
              { ok: false, error: "Cross-origin request blocked by security policy." },
              { status: 403 }
            )
          );
        }
      } catch {
        return applySecurityHeaders(
          NextResponse.json(
            { ok: false, error: "Malformed origin header." },
            { status: 400 }
          )
        );
      }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // 5. Supabase Mode Authentication Enforcement
  if (supabaseUrl && supabaseAnonKey && /^https?:\/\//i.test(supabaseUrl)) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Enforce superuser isolation on /backoffice & /api/backoffice
    if (isSuperUserRoute(pathname)) {
      if (!user) {
        if (pathname.startsWith("/api/")) {
          return applySecurityHeaders(
            NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return applySecurityHeaders(NextResponse.redirect(url));
      }

      const isSuper = isSuperUserEmail(user.email);
      if (!isSuper) {
        if (pathname.startsWith("/api/")) {
          return applySecurityHeaders(
            NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/404";
        return applySecurityHeaders(NextResponse.rewrite(url, { status: 404 }));
      }
    }

    if (isProtectedRoute(pathname) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }

    if (isAuthPage(pathname) && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return applySecurityHeaders(NextResponse.redirect(url));
    }

    return applySecurityHeaders(response);
  }

  // 6. Local Dev Mode Authentication Enforcement
  if (process.env.VITRA_ALLOW_LOCAL_DEV_MODE !== "false") {
    const devToken = request.cookies.get("vitra_dev_session")?.value;
    const session = parseDevToken(devToken);

    // Enforce superuser isolation on /backoffice & /api/backoffice
    if (isSuperUserRoute(pathname)) {
      if (!session || !session.userId) {
        if (pathname.startsWith("/api/")) {
          return applySecurityHeaders(
            NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return applySecurityHeaders(NextResponse.redirect(url));
      }

      const isSuper = isSuperUserEmail(session.email) || session.role === "admin";
      if (!isSuper) {
        if (pathname.startsWith("/api/")) {
          return applySecurityHeaders(
            NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/404";
        return applySecurityHeaders(NextResponse.rewrite(url, { status: 404 }));
      }
    }

    if (isProtectedRoute(pathname) && !session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
