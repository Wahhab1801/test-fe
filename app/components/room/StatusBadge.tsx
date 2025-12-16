import { Tone } from "@/app/types/ui";

type StatusBadgeProps = {
  label: string;
  value: string;
  description?: string;
  tone?: Tone;
};

const toneStyles: Record<Tone, string> = {
  default: "border-white/20 bg-white/5 text-slate-100",
  success: "border-emerald-400/50 bg-emerald-500/10 text-emerald-100",
  warn: "border-amber-400/50 bg-amber-500/10 text-amber-100",
  error: "border-rose-400/50 bg-rose-500/10 text-rose-100",
};

export function StatusBadge({
  label,
  value,
  description,
  tone = "default",
}: StatusBadgeProps) {
  return (
    <div
      className={`flex min-w-[140px] flex-col gap-1 rounded-xl border px-3 py-2 text-sm backdrop-blur ${toneStyles[tone]}`}
    >
      <span className="text-[11px] uppercase tracking-[0.2em] text-white/70">
        {label}
      </span>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{value}</span>
        {description && (
          <span className="truncate text-xs text-white/70">{description}</span>
        )}
      </div>
    </div>
  );
}
