import Link from "next/link";
import { ArrowUpRight, History, LayoutGrid, Layers, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardSummary as DashboardSummaryData } from "@/server/board-service";

const numberFormatter = new Intl.NumberFormat("id-ID");

type Metric = {
  label: string;
  value: number;
  icon: LucideIcon;
};

type Props = {
  summary: DashboardSummaryData;
};

function MetricCard({ icon: Icon, label, value }: Metric) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-semibold">{numberFormatter.format(value)}</span>
      </CardContent>
    </Card>
  );
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Tidak diketahui";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Tidak diketahui";
  }

  return parsed.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function DashboardSummary({ summary }: Props) {
  const metrics: Metric[] = [
    { label: "Total Board", value: summary.totalBoards, icon: LayoutGrid },
    { label: "Total Kolom", value: summary.totalColumns, icon: Layers },
    { label: "Total Kartu", value: summary.totalCards, icon: StickyNote },
  ];

  const latestTimestamp = summary.latestBoard
    ? formatDateTime(summary.latestBoard.createdAt)
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
      <Card className="md:col-span-1 lg:col-span-1">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktivitas Terbaru</CardTitle>
            {summary.latestBoard ? (
              <>
                <p className="text-base font-semibold leading-tight">{summary.latestBoard.name}</p>
                <CardDescription>
                  {/* {summary.latestBoard.updatedAt && summary.latestBoard.updatedAt !== summary.latestBoard.createdAt
                    ? `Diperbarui ${latestTimestamp}`
                    : `Dibuat ${latestTimestamp}`} */}
                    {`Dibuat ${latestTimestamp}`}
                </CardDescription>
              </>
            ) : (
              <CardDescription>Mulai buat board untuk melihat ringkasan aktivitas.</CardDescription>
            )}
          </div>
          <History className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        {summary.latestBoard ? (
          <CardContent className="pt-0">
            <Link
              href={`/boards/${summary.latestBoard.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Buka board
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

export function DashboardSummarySkeleton() {
  const skeletonCards = [0, 1, 2, 3];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {skeletonCards.map((index) => (
        <Card key={index} className={index === 3 ? "md:col-span-1 lg:col-span-1" : undefined}>
          <CardHeader className="space-y-4 pb-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
