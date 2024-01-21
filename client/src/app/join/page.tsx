"use client"
import { useSocket } from "@/context/SocketProvider";
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type MySocketType = {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};


export default function JoinRoom() {
  const router = useRouter();
  const socket: MySocketType = useSocket() as MySocketType;
  const [roomId, setRoomId] = useState('');

  const joinRoom =() => {
    socket.emit('room:join', {roomId});
  };

  const roomJoinedHandler = useCallback((data : any) => {
    const {roomId} = data;
    router.push(`screen/${roomId}`)
  }, [router]);

  useEffect(() => {
    socket.on('room:joined', roomJoinedHandler);
    return () => {
      socket.off('room:joined', roomJoinedHandler);
    }
  }, [roomJoinedHandler, socket])

  return (
    <main className="flex polka min-h-screen flex-col items-center justify-between p-24">
      <div className="grid place-items-center  md:w-1/4 gap-7">
        <svg xmlns="http://www.w3.org/2000/svg" fill="#7175c3" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-32 h-32">
          <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <h1 className="text-2xl text-blue-200">Enter Room Id</h1>
        <div className="flex gap-6 my-12">

          <input
            type="text"
            className="outline-none text-black focus:outline-none px-3 rounded-md"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setRoomId(e.target.value) }}
            value={roomId}
            maxLength={10}
            placeholder="Enter..."
          />

          <button
            className=" h-10 w-32 rounded-md border border-gray-300 hover:text-white hover:bg-gray-800 transition-colors  bg-gray-200 px-3 py-2  text-gray-900 font-semibold  focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={joinRoom}
          >
            Join
          </button>

        </div>
      </div>
    </main>
  );
}
