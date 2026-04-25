'use client';

type NetworkWarningBannerProps = {
  message: string;
};

export function NetworkWarningBanner({ message }: NetworkWarningBannerProps) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
      {message}
    </div>
  );
}
