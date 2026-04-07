import { NextResponse } from 'next/server';
import { getAnthropicClient, CONCEPT_MODEL } from '@/lib/llm/anthropic-client';
import { buildConceptPrompt, extractJson } from '@/lib/llm/concept-prompt';
import type { WizardSelection } from '@/types/concept';

export const runtime = 'nodejs';

interface RequestBody {
  selection: WizardSelection;
  excludeTexts?: string[];
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[recommend-concept] ANTHROPIC_API_KEY missing');
    return NextResponse.json(
      { error: 'AI 추천을 사용하려면 ANTHROPIC_API_KEY 설정이 필요합니다.' },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch (err) {
    console.error('[recommend-concept] invalid JSON body', err);
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  if (!body?.selection) {
    return NextResponse.json({ error: 'selection이 필요합니다.' }, { status: 400 });
  }

  const { system, user } = buildConceptPrompt(body.selection, body.excludeTexts ?? []);

  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: CONCEPT_MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const textBlock = msg.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      console.error('[recommend-concept] no text block in response', msg);
      return NextResponse.json(
        { error: 'LLM 응답에 텍스트가 없습니다.' },
        { status: 502 }
      );
    }

    const json = extractJson(textBlock.text);
    return NextResponse.json(json);
  } catch (err) {
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[recommend-concept] LLM call failed', { err, stack });
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `AI 추천 실패: ${err.message}`
            : 'AI 추천 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
