// /components/CallModal/hooks/useVideoStreams.js
import { useEffect } from "react";

export const useVideoStreams = ({ localVideoRef, remoteVideoRef, localStream, remoteStream, temporaryStream }) => {
    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream || temporaryStream;
        }
    }, [localVideoRef, localStream, temporaryStream]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteVideoRef, remoteStream]);
};