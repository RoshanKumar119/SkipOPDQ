import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * One shared Socket.IO connection for the whole app.
 * In development Vite proxies /socket.io to the Express server.
 */
const SocketContext = createContext({ socket: null, connected: false });

// App-lifetime singleton: created once and never torn down by React re-mounts
// (avoids "WebSocket closed before the connection is established" in StrictMode).
let sharedSocket = null;
function getSocket() {
  if (!sharedSocket) sharedSocket = io({ transports: ['websocket', 'polling'] });
  return sharedSocket;
}

export function SocketProvider({ children }) {
  const [socket] = useState(getSocket);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

/**
 * Subscribe to server events while a component is mounted.
 * `join` / `leave` describe the room to (re)join on every (re)connect.
 * Handlers are kept in a ref so callers don't need to memoise them.
 */
function useRoom({ joinEvent, leaveEvent, payload, handlers, enabled = true }) {
  const { socket } = useSocket();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const key = JSON.stringify(payload || {});

  useEffect(() => {
    if (!socket || !enabled) return undefined;
    const data = JSON.parse(key);
    const join = () => socket.emit(joinEvent, data);
    const listeners = Object.keys(handlersRef.current).map((event) => {
      const fn = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, fn);
      return [event, fn];
    });

    if (socket.connected) join();
    socket.on('connect', join); // re-join after reconnect

    return () => {
      socket.emit(leaveEvent, data);
      socket.off('connect', join);
      listeners.forEach(([event, fn]) => socket.off(event, fn));
    };
  }, [socket, joinEvent, leaveEvent, key, enabled]);
}

/** Live updates for one doctor's queue: { 'queue:updated': fn, 'doctor:statusChanged': fn } */
export function useQueueRoom(doctorId, date, handlers) {
  useRoom({ joinEvent: 'queue:join', leaveEvent: 'queue:leave', payload: { doctorId, date }, handlers, enabled: !!doctorId });
}

/** Hospital-wide updates (all doctors) for dashboards and the doctor list. */
export function useHospitalRoom(handlers) {
  useRoom({ joinEvent: 'hospital:join', leaveEvent: 'hospital:leave', handlers });
}
