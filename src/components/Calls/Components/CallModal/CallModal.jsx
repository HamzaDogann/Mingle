// /components/CallModal/CallModal.js
import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSignalR } from "../../../../contexts/SignalRContext";
import { ErrorAlert } from "../../../../helpers/customAlert";

// Custom Hooks
import { useCallTimer } from "./hooks/useCallTimer";
import { useOutgoingCallLogic } from "./hooks/useOutgoingCallLogic";
import { useTemporaryVideoStream } from "./hooks/useTemporaryVideoStream";
import { useVideoStreams } from "./hooks/useVideoStreams";
import { useCallActions } from "./hooks/useCallActions";

// Subcomponents
import { CallHeader } from "./subcomponents/CallHeader";
import { CallInfo } from "./subcomponents/CallInfo";
import { VideoFeeds } from "./subcomponents/VideoFeeds";
import { CallControls } from "./subcomponents/CallControls";

// Styles
import "./CallModal.scss";

function CallModal({ closeModal, isCameraCall }) {
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const { callConnection, localStream, remoteStream } = useSignalR();
    const { callerProfile, callId, isCallStarted, isRingingOutgoing, callStartedDate, isCallStarting } = useSelector((state) => state.call);

    const [isMicrophoneOn, setMicrophoneMode] = useState(true);
    const [isSpeakerOn, setSpeakerMode] = useState(true);

    const temporaryStream = useTemporaryVideoStream(isCameraCall, localStream);

    const cleanupAndClose = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (temporaryStream) {
            temporaryStream.getTracks().forEach(track => track.stop());
        }
        closeModal();
    }, [localStream, temporaryStream, closeModal]);

    const { callStatus: outgoingCallStatus, audioRefs } = useOutgoingCallLogic({
        isCallStarting, isCallStarted, callConnection, callId, callStartedDate,
        onCleanupAndClose: cleanupAndClose
    });

    const callDuration = useCallTimer(isCallStarted);

    useVideoStreams({ localVideoRef, remoteVideoRef, localStream, remoteStream, temporaryStream });

    const callStatus = isCallStarted ? callDuration : outgoingCallStatus;

    const { handleMicrophoneToggle, handleSpeakerToggle, handleEndCall } = useCallActions({
        isMicrophoneOn, setMicrophoneMode, isSpeakerOn, setSpeakerMode,
        localStream, callConnection, callId, callStartedDate, isCallStarted, isCallStarting,
        remoteVideoRef, audioRefs, onCleanupAndClose: cleanupAndClose, outgoingCallStatus
    });

    useEffect(() => {
        if (!isCallStarted && !isRingingOutgoing) {
            cleanupAndClose();
        }
    }, [isCallStarted, isRingingOutgoing, cleanupAndClose]);

    useEffect(() => {
        const validationErrorHandler = (data) => ErrorAlert(data.message);
        callConnection.on('ValidationError', validationErrorHandler);
        return () => callConnection.off('ValidationError', validationErrorHandler);
    }, [callConnection]);

    const modalClassName = `call-modal ${isCallStarted ? 'video-call-mode' : ''}`;

    return (
        <div className={modalClassName}>
            <CallHeader />

            {(!isCallStarted || (isCallStarted && !isCameraCall)) && (
                <CallInfo
                    profilePhoto={callerProfile?.profilePhoto}
                    displayName={callerProfile?.displayName}
                    status={callStatus}
                    isCameraCall={isCameraCall}
                />
            )}

            <VideoFeeds
                ref={{ local: localVideoRef, remote: remoteVideoRef }}
                isCameraCall={isCameraCall}
                isCallStarted={isCallStarted}
                callerProfile={callerProfile}
            />

            {isCallStarted && isCameraCall && (
                <p className="video-call-time-status">{callStatus}</p>
            )}

            <CallControls
                isSpeakerOn={isSpeakerOn}
                isMicrophoneOn={isMicrophoneOn}
                onToggleSpeaker={handleSpeakerToggle}
                onToggleMicrophone={handleMicrophoneToggle}
                onEndCall={handleEndCall}
            />
        </div>
    );
}

export default CallModal;