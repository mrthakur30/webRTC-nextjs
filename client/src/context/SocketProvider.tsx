'use client'
import React, { createContext, useContext, useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);


export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = (props) => {
  const  socket = useMemo(() => io('https://webrtc-backend-ja48.onrender.com'),[]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
