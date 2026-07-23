import { create } from "zustand";

type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

interface CallState {
  status: CallStatus;
  peerId: string | null;
  type: "audio" | "video" | null;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setStatus: (status: CallStatus) => void;
  setPeerId: (id: string | null) => void;
  setType: (type: "audio" | "video" | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: "idle",
  peerId: null,
  type: null,
  peerConnection: null,
  localStream: null,
  remoteStream: null,

  setStatus: (status) => set({ status }),
  setPeerId: (peerId) => set({ peerId }),
  setType: (type) => set({ type }),
  setPeerConnection: (peerConnection) => set({ peerConnection }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),

  reset: () =>
    set({
      status: "idle",
      peerId: null,
      type: null,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
    }),
}));
