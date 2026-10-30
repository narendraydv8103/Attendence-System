import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
  }
  return socket;
};

export const joinLectureRoom = (lectureId: string) => {
  const s = getSocket();
  s.emit('join_lecture_room', lectureId);
};

export const leaveLectureRoom = (lectureId: string) => {
  const s = getSocket();
  s.emit('leave_lecture_room', lectureId);
};
