import { ReactNode } from "react";

type VisualizerCardProps = {
  title: string;
  children: ReactNode;
  accent: string;
  border: string;
  status?: string;
  action?: ReactNode;
};

export function VisualizerCard({
  title,
  children,
  accent,
  border,
  status,
  action,
}: VisualizerCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${border} bg-white/5 backdrop-blur`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-40`}
      />
      <div className="relative flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            <span>{title}</span>
            {status && (
              <p className="mt-1 text-[11px] normal-case tracking-normal text-white/80">
                {status}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        <div className="relative z-10 h-full min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
