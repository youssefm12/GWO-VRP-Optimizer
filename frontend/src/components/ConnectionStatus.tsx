import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { checkHealth } from '../api/backendService';

interface ConnectionStatusProps {
  onStatusChange?: (connected: boolean) => void;
}

export function ConnectionStatus({ onStatusChange }: ConnectionStatusProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const isHealthy = await checkHealth();
      setConnected(isHealthy);
      onStatusChange?.(isHealthy);
    } catch {
      setConnected(false);
      onStatusChange?.(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
        connected === null
          ? 'bg-slate-100 text-slate-500'
          : connected
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
      onClick={checkConnection}
      title="Click to refresh connection status"
    >
      {checking ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : connected ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>
        {connected === null
          ? 'Checking...'
          : connected
          ? 'Backend Connected'
          : 'Backend Offline'}
      </span>
    </div>
  );
}
