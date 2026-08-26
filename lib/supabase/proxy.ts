import { createServerClient } from "@supabase/ssr";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

function getAccessTokenFromCookies(
  request: NextRequest
): string | null {
  const cookies =
    request.cookies
      .getAll()
      .filter((cookie) =>
        cookie.name.includes(
          "-auth-token"
        )
      )
      .sort((a, b) =>
        a.name.localeCompare(
          b.name
        )
      );

  if (!cookies.length) {
    return null;
  }

  try {
    const raw =
      cookies
        .map(
          (cookie) =>
            cookie.value
        )
        .join("");

    const parsed =
      JSON.parse(raw);

    let accessToken: unknown =
      parsed?.access_token;

    // بعض إصدارات SSR تخزن البيانات
    // على شكل array/chunks.
    if (
      !accessToken &&
      Array.isArray(parsed)
    ) {
      accessToken =
        parsed.find(
          (value) =>
            typeof value ===
              "string" &&
            value.startsWith(
              "eyJ"
            )
        );
    }

    return typeof accessToken ===
      "string"
      ? accessToken
      : null;
  } catch {
    return null;
  }
}

function tokenNeedsRefresh(
  accessToken: string | null
): boolean {
  if (!accessToken) {
    return false;
  }

  try {
    const parts =
      accessToken.split(".");

    if (parts.length !== 3) {
      return true;
    }

    const payload =
      JSON.parse(
        Buffer.from(
          parts[1],
          "base64url"
        ).toString(
          "utf8"
        )
      );

    const exp =
      Number(
        payload?.exp
      );

    if (
      !Number.isFinite(
        exp
      )
    ) {
      return true;
    }

    const now =
      Math.floor(
        Date.now() /
          1000
      );

    // لا نلمس الجلسة إلا إذا
    // بقي أقل من دقيقتين على انتهاء التوكن.
    return (
      exp - now <
      120
    );
  } catch {
    return true;
  }
}

export async function updateSession(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                request.cookies.set(
                  name,
                  value
                );

                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  const accessToken =
    getAccessTokenFromCookies(
      request
    );

  // الجلسة غير موجودة:
  // لا نحاول refresh من الـProxy.
  if (!accessToken) {
    return supabaseResponse;
  }

  // طالما الـtoken ما زال صالحًا
  // لأكثر من دقيقتين، لا نلمس Auth.
  if (
    !tokenNeedsRefresh(
      accessToken
    )
  ) {
    return supabaseResponse;
  }

  // فقط عندما يكون التوكن قريبًا
  // من الانتهاء، نسمح لـSupabase
  // بتحديث الجلسة والكوكيز.
  try {
    await supabase.auth.getClaims();
  } catch (error) {
    console.error(
      "SUPABASE PROXY AUTH REFRESH ERROR:",
      error
    );
  }

  return supabaseResponse;
}