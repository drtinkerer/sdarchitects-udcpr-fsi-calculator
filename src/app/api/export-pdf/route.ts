import { NextRequest, NextResponse } from 'next/server';
import { ProjectFormData, ZoneType } from '@/lib/types/udcpr';
import { ROAD_WIDTH_MAP } from '@/lib/udcpr/constants';

const ZONE_LABELS: Record<ZoneType, string> = {
  regular: 'Regular Zone',
  tod: 'TOD Zone (Metro Corridor)',
  cbd: 'CBD Zone (Commercial Core)',
};

const DEFAULT_N8N_WEBHOOK_URL =
  'https://n8n.pi5.cloudpoet.in/webhook/sdarchitects-zoning-export';

export async function POST(req: NextRequest) {
  try {
    const formData = (await req.json()) as Partial<ProjectFormData>;

    if (!formData.clientName?.trim() || !formData.projectName?.trim()) {
      return NextResponse.json(
        { error: 'Client Name and Project Name are required before generating a PDF.' },
        { status: 400 }
      );
    }

    const roadInfo = formData.roadWidthCode ? ROAD_WIDTH_MAP[formData.roadWidthCode] : undefined;
    const sendToTelegram = formData.sendToTelegram !== false;
    const outputMode = sendToTelegram ? 'both' : 'web';
    const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';

    const payload = {
      date: formData.date ?? new Date().toISOString().slice(0, 10),
      clientName: formData.clientName.trim(),
      projectName: formData.projectName.trim(),
      plotArea712: Number(formData.plotArea712) || 0,
      plotAreaSite: Number(formData.plotAreaSite) || 0,
      roadWidening: Number(formData.roadWidening) || 0,
      dpReservation: Number(formData.dpReservationArea) || 0,
      roadWidth: roadInfo?.tag ?? '12m',
      projectType: formData.projectType ?? 'residential',
      greenRating: formData.greenFsiType ?? 'none',
      loading: formData.saleableLoadingPct ?? 15,
      zone: formData.zone ? ZONE_LABELS[formData.zone] : ZONE_LABELS.regular,
      outputMode,
      telegramChatId,
    };

    const webhookUrl = process.env.N8N_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK_URL;
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await n8nRes.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: `Unexpected response from n8n (${n8nRes.status}): ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    if (!n8nRes.ok || !data.success) {
      return NextResponse.json(
        { error: (data.message as string) || (data.error as string) || `n8n webhook failed (${n8nRes.status})` },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to trigger n8n workflow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
