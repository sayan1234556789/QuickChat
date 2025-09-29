import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import toast from "react-hot-toast";

const VideoCall = () => {
  const { socket, authUser } = useContext(AuthContext);
  const { call, setCall } = useContext(ChatContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isInCall, setIsInCall] = useState(false);

  // Start local media
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error("Camera/Mic access denied");
      throw err;
    }
  };

  // Create peer connection
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },  //stun google free
      ]

    });

    // Local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Remote tracks
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate && call?.targetId) {
        socket.emit("ice-candidate", {
          targetId: call.targetId || call.from,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  // Handle outgoing call
  const startCall = async () => {
    if (!call?.targetId) return;
    await startLocalStream();
    peerConnectionRef.current = createPeerConnection();

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    socket.emit("call-user", { targetId: call.targetId, offer });
    setIsInCall(true);
  };

  // Handle incoming call (accept)
  const acceptCall = async () => {
    await startLocalStream();
    peerConnectionRef.current = createPeerConnection();

    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(call.offer)
    );
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    socket.emit("answer-call", { targetId: call.from, answer });
    setIsInCall(true);
  };

  // Decline call
  const declineCall = () => {
    socket.emit("end-call", { targetId: call.from });
    endCall();
  };

  // End call (cleanup)
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setCall(null);
    setIsInCall(false);
  };

  // Handle signaling events
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", ({ from, offer }) => {
      setCall({ type: "incoming", from, offer });
    });

    socket.on("call-accepted", async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerConnectionRef.current?.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    socket.on("call-ended", () => {
      endCall();
      toast("Call ended");
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [socket, call]);

  // Auto-start outgoing call
  useEffect(() => {
    if (call?.type === "outgoing") {
      startCall();
    }
  }, [call]);

  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
      <div className="bg-gray-900 p-4 rounded-xl flex flex-col gap-4 items-center">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-40 h-32 bg-black rounded-md"
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-80 h-60 bg-black rounded-md"
        ></video>

        {!isInCall && call.type === "incoming" ? (
          <div className="flex gap-4">
            <button
              onClick={acceptCall}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Accept
            </button>
            <button
              onClick={declineCall}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Decline
            </button>
          </div>
        ) : (
          <button
            onClick={endCall}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
