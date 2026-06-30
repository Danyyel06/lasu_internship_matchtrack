import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  latestNotification: any | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  latestNotification: null
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Use ws:// for unencrypted local dev
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/stream?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'missed_pulse' || data.type === 'notification') {
          setLatestNotification(data.notification || data);
          setToastVisible(true);
          
          // Auto hide toast after 6 seconds
          setTimeout(() => {
            setToastVisible(false);
          }, 6000);
        }
      } catch (e) {
        console.error('Failed to parse websocket message', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, latestNotification }}>
      {children}
      
      {/* Global Toast Notification */}
      {toastVisible && latestNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce-short">
          <div className="bg-white border-l-4 border-red-500 rounded-r-lg shadow-xl p-4 max-w-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <span className="text-red-500 text-xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Urgent Alert</h4>
                  <p className="text-sm text-neutral-600 mt-1">{latestNotification.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setToastVisible(false)}
                className="text-neutral-400 hover:text-neutral-600 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </WebSocketContext.Provider>
  );
}
