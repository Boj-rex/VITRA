import type { Metadata } from "next";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { NotFoundView } from "@/components/error/NotFoundView";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for could not be found on Vitra.",
};

export default async function NotFound() {
  let isAuthenticated = false;
  try {
    const user = await getAuthenticatedUser();
    isAuthenticated = Boolean(user);
  } catch {
    isAuthenticated = false;
  }

  return <NotFoundView isAuthenticated={isAuthenticated} />;
}

