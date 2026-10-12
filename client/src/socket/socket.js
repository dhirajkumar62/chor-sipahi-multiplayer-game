import { io } from 'socket.io-client';
let socket;
export function connectSocket(){ if(!socket) socket=io(import.meta.env.VITE_SOCKET_URL||'http://localhost:5000',{auth:{token:localStorage.getItem('token')},reconnection:true,reconnectionAttempts:8}); return socket; }
export function getSocket(){ return socket; }
