'use client'

import { useSocket } from "@/context/SocketProvider";
import { useCallback, useEffect, useState } from "react"
import {useRouter} from "next/navigation"

interface UserProps{
   name : string
   email : string
   room : string
}


type MySocketType = {
  emit(event: string, data: any): void;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
};

export default function Home() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [email, setEmail] = useState('');

  const router = useRouter();


  const socket: MySocketType = useSocket() as MySocketType;
  const submitFormHandler = useCallback((e: any) => {
    e.preventDefault();
    socket.emit('room:join', {
      name,
      email,
      room
    })
  }, [name, room,email, socket]);
  

  const roomJoinHandler = useCallback((data : UserProps)=>{
    const {name , email, room} = data;   
      router.push(`/screen/${room}`)
  },[router])

  useEffect(()=>{
     socket.on('room:join',roomJoinHandler);
     return () =>{
      socket.off('room:join',roomJoinHandler)
     }
  },[socket, roomJoinHandler])

  return (
    <main className="flex min-h-screen flex-col items-center  justify-between p-24">
      <form onSubmit={submitFormHandler} className="grid place-items-center  md:w-1/4 gap-7">
        <svg xmlns="http://www.w3.org/2000/svg" fill="-client" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-32 h-32">
          <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <h1 className="text-3xl">Meet Muku </h1>
        <input
          className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          type="text"
          value={name}
          placeholder="Full Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          type="email"
          value={email}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          type="text" value={room}
          placeholder="Room"
          onChange={(e) => setRoom(e.target.value)}
        />

        <button className=" h-10 w-32 rounded-md border border-gray-300 hover:text-white hover:bg-red-500 transition-colors  bg-gray-200 px-3 py-2  text-gray-900 font-semibold  focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50" type="submit">Join</button>
      </form>
    </main>
  )
}
