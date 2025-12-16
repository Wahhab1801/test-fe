import { Backdrop } from "./Backdrop";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Backdrop className="flex items-center justify-center text-white">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 rounded-full border border-red-400/60 bg-red-500/20 text-2xl leading-[56px]">
          ⚠️
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Connection issue
          </p>
          <h2 className="text-xl font-semibold">Couldn&apos;t start session</h2>
        </div>
        <p className="text-sm text-slate-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Try again
          </button>
        )}
      </div>
    </Backdrop>
  );
}
