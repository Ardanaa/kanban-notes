import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white/80 backdrop-blur dark:bg-neutral-900/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Kanban Notes
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/boards"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Semua Board
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
