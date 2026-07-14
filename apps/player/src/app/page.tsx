import { PlayerRuntime } from '@/components/player-runtime';

export default function Home() {
  const kioskSecret = process.env.PLAYER_HEARTBEAT_SECRET?.trim() || '';
  return <PlayerRuntime kioskSecret={kioskSecret} />;
}
