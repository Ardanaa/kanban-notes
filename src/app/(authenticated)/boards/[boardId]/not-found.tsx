import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BoardNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Board tidak ditemukan</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Board yang Anda cari mungkin telah dihapus atau Anda tidak memiliki akses
        ke dalamnya.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke dashboard</Link>
      </Button>
    </div>
  );
}
