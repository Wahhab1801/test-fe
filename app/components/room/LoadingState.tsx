import { Backdrop } from "./Backdrop";

export function LoadingState() {
  return (
    <Backdrop className="flex items-center justify-center text-white">
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Preparing room
          </p>
        </div>
      </div>
    </Backdrop>
  );
}
