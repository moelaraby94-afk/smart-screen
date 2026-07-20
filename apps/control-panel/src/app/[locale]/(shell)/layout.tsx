import { redirect } from 'next/navigation';
import { fetchAuthMeServer } from '@/lib/server-auth';
import { ControlPanelShell } from '@/components/control-panel-shell';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ShellLayout({ children, params }: Props) {
  const { locale } = await params;
  const auth = await fetchAuthMeServer();

  if (!auth.authenticated) {
    redirect(`/${locale}/login`);
  }

  if (!auth.isPlatformStaff) {
    redirect(`/${locale}/login?error=not_authorized`);
  }

  return (
    <ControlPanelShell locale={locale}>
      {children}
    </ControlPanelShell>
  );
}
