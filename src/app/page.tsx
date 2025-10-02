import Link from "next/link";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ArrowRight, KanbanSquare, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-neutral-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">Kanban Notes</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm">Masuk</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" /> Produktivitas dengan Kanban & AI
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Kelola catatan proyek dan tugas Anda dengan tampilan Kanban modern.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Kanban Notes memadukan Supabase, Clerk, dan Vercel AI SDK untuk
              menghadirkan pengalaman mencatat yang real-time, aman, dan dibantu AI.
              Susun board, atur kolom, dan gerakkan kartu dengan drag-and-drop yang mulus.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SignedIn>
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Buka dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg">
                    Coba sekarang <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/guest">Continue as guest</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border bg-white/70 p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900/70">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Contoh board</span>
                <span>Tim Project</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "To Do", count: 3, color: "bg-sky-100" },
                  { name: "In Progress", count: 2, color: "bg-amber-100" },
                  { name: "Done", count: 5, color: "bg-emerald-100" },
                ].map((column) => (
                  <div
                    key={column.name}
                    className={`rounded-xl border border-transparent ${column.color} p-3 text-sm dark:bg-white/5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{column.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {column.count} kartu
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <p>• Riset kebutuhan</p>
                      <p>• Susun backlog</p>
                      <p>• Review desain</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Board & Kolom"
            description="Susun proyek dalam board dengan kolom yang fleksibel. Gunakan drag-and-drop untuk mengatur ulang struktur kerja sesuai kebutuhan tim."
          />
          <FeatureCard
            title="Kartu kaya konten"
            description="Setiap kartu mendukung deskripsi lengkap dan pembaruan cepat. Gunakan AI untuk menulis, merangkum, atau memecah tugas besar."
          />
          <FeatureCard
            title="Kolaborasi Aman"
            description="Clerk menjaga autentikasi pengguna, sementara Supabase menyimpan data dengan RLS agar hanya pemilik board yang dapat mengaksesnya."
          >
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> Terintegrasi dengan Clerk & Supabase
            </div>
          </FeatureCard>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Alur kerja terpadu</h2>
            <p className="text-muted-foreground">
              Mulai dari landing page, pengguna diarahkan untuk login melalui Clerk.
              Setelah itu, dashboard menampilkan semua board. Setiap board memuat
              kolom, kartu, serta dukungan drag-and-drop yang langsung tersinkronisasi
              ke database Supabase.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
              <li>Tambah board, kolom, dan kartu dengan satu klik.</li>
              <li>Reorder kolom atau kartu, bahkan pindahkan kartu antar kolom.</li>
              <li>Gunakan AI untuk mendapatkan deskripsi, ringkasan, dan saran tugas.</li>
            </ul>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Teknologi utama</CardTitle>
              <CardDescription>Stack yang mendukung performa dan skalabilitas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Next.js App Router</span>
                <p>Mengelola UI responsif dengan server actions dan streaming data.</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Supabase + Clerk</span>
                <p>Autentikasi aman dengan RLS untuk setiap board, kolom, dan kartu.</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Vercel AI SDK</span>
                <p>Asisten AI kontekstual langsung dari dialog kartu.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

function FeatureCard({ title, description, children }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

