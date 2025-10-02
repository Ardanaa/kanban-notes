import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/boards(.*)",
  "/profile(.*)",
]);

const isGuestRoute = createRouteMatcher(["/guest(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isGuestRoute(req)) {
    return;
  }

  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

