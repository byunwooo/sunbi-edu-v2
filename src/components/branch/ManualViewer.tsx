"use client";
import { MANUAL_CONTENT } from "@/lib/manual-content";

type Props = {
  stepId: number;
};

export default function ManualViewer({ stepId }: Props) {
  const manual = MANUAL_CONTENT.find(m => m.stepId === stepId);
  if (!manual) return null;

  return (
    <div className="mt-2 p-4 rounded-xl border" style={{ background: "rgba(139,26,26,0.02)", borderColor: "rgba(139,26,26,0.15)" }}>
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--primary)" }}>{manual.overview}</p>
      {manual.sections.map(section => (
        <div key={section.checklistId} className="mb-3 last:mb-0">
          <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text)" }}>{section.title}</p>
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-[inherit]">
            {section.content.split('\n').map((line, li) => {
              const isImportant = line.includes('\u2605');
              const isGarnish = line.trimStart().startsWith('\uace0\uba85:');
              const displayLine = line.replace(/\u2605/g, '');
              return (
                <span key={li} style={{
                  color: isImportant ? "var(--danger)" : isGarnish ? "#b45309" : "var(--text-secondary)",
                  fontWeight: isImportant ? 700 : isGarnish ? 600 : 400,
                  fontSize: isGarnish ? "10px" : undefined,
                }}>
                  {isImportant && '\u26a0 '}{displayLine}{'\n'}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
