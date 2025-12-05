/**
 * WebSocket client for real-time optimization updates
 */

export interface WSOptimizationMessage {
  iter?: number;
  best_fitness?: number;
  done?: boolean;
  routes?: number[][];
  runtime?: number;
}

export interface WSConfig {
  url: string;
  onMessage: (data: WSOptimizationMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Create and manage a WebSocket connection for optimization
 * @param config - WebSocket configuration
 * @returns WebSocket instance
 */
export function createOptimizationWebSocket(config: WSConfig): WebSocket {
  const ws = new WebSocket(config.url);

  ws.onopen = () => {
    console.log('WebSocket connection established');
    if (config.onOpen) {
      config.onOpen();
    }
  };

  ws.onmessage = (event) => {
    try {
      const data: WSOptimizationMessage = JSON.parse(event.data);
      config.onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (config.onError) {
      config.onError(error);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    if (config.onClose) {
      config.onClose();
    }
  };

  return ws;
}

/**
 * Send optimization request through WebSocket
 * @param ws - WebSocket instance
 * @param payload - Optimization request payload
 */
export function sendOptimizationRequest(ws: WebSocket, payload: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  } else {
    console.error('WebSocket is not open. Ready state:', ws.readyState);
  }
}

/**
 * Close WebSocket connection gracefully
 * @param ws - WebSocket instance
 */
export function closeWebSocket(ws: WebSocket): void {
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }
}
