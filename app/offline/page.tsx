"use client";

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">✈️</div>
      <h1 className="font-heading text-3xl font-bold mb-2">You&apos;re offline</h1>
      <p className="text-text-secondary mb-6 max-w-xs">
        It looks like you&apos;ve lost your connection. Check your internet and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
      >
        Try Again
      </button>
    </main>
  );
}
