interface LoadingRingProps {
  message?: string;
}

export function LoadingRing({ message }: LoadingRingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="relative w-16 h-16">
          <div
            className="absolute w-full h-full rounded-full border-2 border-border border-r-primary border-b-primary animate-spin"
            style={{ animationDuration: "3s" }}
          ></div>

          <div
            className="absolute w-full h-full rounded-full border-2 border-border border-t-primary animate-spin"
            style={{ animationDuration: "2s", animationDirection: "reverse" }}
          ></div>
        </div>

        <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-primary/5 animate-pulse rounded-full blur-sm"></div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
