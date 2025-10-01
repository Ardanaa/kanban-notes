import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SupabaseConfigAlert() {
  return (
    <Alert variant="destructive" className="max-w-xl">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Konfigurasi Supabase belum lengkap</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          Tambahkan template token Clerk bernama <code>supabase</code> atau isi
          variabel lingkungan <code>SUPABASE_SERVICE_ROLE_KEY</code> agar aplikasi
          dapat terhubung ke Supabase dengan hak akses yang sesuai.
        </p>
        <p>
          Setelah memperbarui konfigurasi, restart server pengembangan dan coba
          kembali.
        </p>
      </AlertDescription>
    </Alert>
  );
}
