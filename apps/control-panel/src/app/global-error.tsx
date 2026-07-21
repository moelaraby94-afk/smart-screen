'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h2>SSR Error</h2>
          <p><strong>Message:</strong> {error.message}</p>
          <p><strong>Digest:</strong> {error.digest}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{error.stack}</pre>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
