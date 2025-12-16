import { ReactNode } from "react";

type BackdropProps = {
  children: ReactNode;
  className?: string;
};

export function Backdrop({ children, className = "" }: BackdropProps) {
  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 ${className}`}
    >
      <BackdropLayers />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function BackdropLayers() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-emerald-900/30" />
      <div className="absolute -left-32 -top-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
    </>
  );
}
