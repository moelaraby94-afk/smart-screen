import Link from 'next/link';
import { Home } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-4xl font-bold tracking-tight text-foreground">404</p>
        <p className="text-lg font-semibold text-foreground">Page not found</p>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Home className="h-4 w-4" strokeWidth={1.8} />
        Back to home
      </Link>
    </div>
  );
}
