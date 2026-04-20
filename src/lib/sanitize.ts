import DOMPurify from 'dompurify';

/**
 * AI 분석 결과(마크다운 텍스트)를 안전한 HTML로 변환
 * - XSS 방어: DOMPurify로 sanitize
 * - 마크다운 기본 변환: ##, **, - 리스트
 */
export function sanitizeAnalysis(raw: string): string {
  const html = raw
    .replace(/\n/g, '<br/>')
    .replace(/##\s*(.*?)(<br\/>)/g, '<h4 style="font-size:14px;font-weight:700;color:#1a1a1a;margin-top:16px;margin-bottom:8px">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a1a">$1</strong>')
    .replace(/- (.*?)(<br\/>)/g, '<div style="padding-left:12px;margin-bottom:4px">- $1</div>');

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h3', 'h4', 'strong', 'div', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['style', 'class'],
  });
}
