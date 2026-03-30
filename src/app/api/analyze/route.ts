import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { branches, records, curriculum } = await req.json();

    const prompt = `당신은 프랜차이즈 교육 분석 전문가입니다. 선비칼국수 프랜차이즈의 가맹점 교육 데이터를 분석해주세요.

## 커리큘럼 (8단계)
${curriculum.map((s: { id: number; label: string }) => `${s.id}. ${s.label}`).join('\n')}

## 지점별 교육 데이터
${branches.map((b: { name: string; owner_name: string }) => {
  const branchRecords = records.filter((r: { branch_id: string; step: number; passed: boolean; score: number | null; sv_comment: string; owner_comment: string }) => r.branch_id === b.name);
  return `### ${b.name} (점주: ${b.owner_name})
${branchRecords.length > 0 ? branchRecords.map((r: { step: number; passed: boolean; score: number | null; sv_comment: string; owner_comment: string }) =>
  `- ${r.step}단계: ${r.passed ? '이수' : '미이수'} ${r.score ? `(${r.score}점)` : ''} ${r.sv_comment ? `SV: ${r.sv_comment}` : ''} ${r.owner_comment ? `점주: ${r.owner_comment}` : ''}`
).join('\n') : '기록 없음'}`;
}).join('\n\n')}

## 분석 요청
위 데이터를 바탕으로 다음을 분석해주세요:

1. **교육 난이도 분석**: 점주들이 가장 어려워하는 단계와 가장 쉬운 단계를 점수/미이수율 기반으로 분석
2. **키워드 분석**: SV 코멘트와 점주 코멘트에서 반복되는 키워드/패턴 추출
3. **강화 필요 교육**: 심화 교육이 필요한 단계와 이유
4. **간소화 가능 교육**: 간소화해도 되는 단계와 이유
5. **종합 제안**: 커리큘럼 개선을 위한 구체적인 제안 3가지

한국어로 답변해주세요. 마크다운 형식으로 작성하되, 실용적이고 구체적으로 작성해주세요.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === 'text' ? content.text : '';

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error('AI 분석 오류:', error);
    return NextResponse.json({ error: 'AI 분석에 실패했습니다.' }, { status: 500 });
  }
}
