// /components/CallModal/hooks/useCallActions.js
import { useCallback } from "react";

export const useCallActions = ({
    // State ve Setters
    isMicrophoneOn,
    setMicrophoneMode,
    isSpeakerOn,
    setSpeakerMode,
    // Redux/Context Data
    localStream,
    callConnection,
    callId,
    callStartedDate,
    isCallStarted,
    isCallStarting,
    // Ref'ler ve Props
    remoteVideoRef,
    temporaryStream,
    audioRefs,
    onCleanupAndClose,
    // Diğer state'ler
    outgoingCallStatus,
}) => {
    const handleMicrophoneToggle = useCallback(() => {
        const nextState = !isMicrophoneOn;
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
        setMicrophoneMode(nextState);
    }, [isMicrophoneOn, localStream, setMicrophoneMode]);

    const handleSpeakerToggle = useCallback(() => {
        const nextState = !isSpeakerOn;
        if (remoteVideoRef.current) {
            remoteVideoRef.current.muted = !nextState;
        }

        Object.values(audioRefs).forEach(ref => {
            if (ref.current) ref.current.volume = nextState ? 1 : 0;
        });
        setSpeakerMode(nextState);
    }, [isSpeakerOn, remoteVideoRef, audioRefs, setSpeakerMode]);

  
  const handleEndCall = useCallback(() => {
        // 1. Sunucuya aramayı bitirme isteği gönder
        if (isCallStarted) {
            callConnection.invoke("EndCall", callId, 1, callStartedDate);
        } else if (isCallStarting) {
            const endReason = outgoingCallStatus === "Meşgul" ? 4 : 3;
            callConnection.invoke("EndCall", callId, endReason, callStartedDate);
        }

        onCleanupAndClose();

    }, [
        // Tüm bağımlılıkları ekleyin
        isCallStarted, isCallStarting, callConnection, callId, callStartedDate,
        outgoingCallStatus, onCleanupAndClose, localStream, temporaryStream
    ]);


    return {
        handleMicrophoneToggle,
        handleSpeakerToggle,
        handleEndCall,
    };
};