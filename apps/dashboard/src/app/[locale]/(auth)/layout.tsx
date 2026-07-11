/**
 * Auth routes — Nimbus clean background (light-first, dark adapts).
 * No glassmorphism, no Aurora orbs. Solid surfaces with subtle violet tint.
 */
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="relative z-[1] min-h-screen">{children}</div>
    </div>
  );
}
