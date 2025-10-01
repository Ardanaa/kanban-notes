import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AiAction = "generate" | "summarize" | "suggest";

type Payload = {
  action: AiAction;
  title?: string;
  content?: string;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY belum dikonfigurasi" },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { error: "Payload tidak valid" },
      { status: 400 }
    );
  }

  if (!body.action) {
    return NextResponse.json(
      { error: "Tipe aksi AI wajib diisi" },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(body);

  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("AI error", error);
    return NextResponse.json(
      { error: "Gagal menjalankan permintaan AI" },
      { status: 500 }
    );
  }
}

function buildPrompt({ action, title, content }: Payload) {
  switch (action) {
    case "generate":
      return `Anda adalah asisten manajemen proyek. Buat konten deskripsi yang ringkas namun informatif untuk kartu Kanban dengan judul "${title ?? "(tanpa judul)"}". Sertakan konteks, tujuan, dan langkah singkat yang perlu diselesaikan.`;
    case "summarize":
      return `Ringkas catatan berikut menjadi poin-poin singkat dengan highlight utama:\n${content ?? "Tidak ada konten."}`;
    case "suggest":
      return `Pecah pekerjaan berikut menjadi daftar sub-tugas yang terurut dan dapat dieksekusi. Judul: "${title ?? "(tanpa judul)"}". Deskripsi tambahan: ${content ?? "tidak ada"}.`;
    default:
      return "";
  }
}


