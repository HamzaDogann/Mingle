// /hooks/useOutgoingCallLogic.js
import { useState, useEffect, useRef } from "react";

import CallSound from "../../../../../assets/sound/MingleCallSound.mp3"
import BusySound from "../../../../../assets/sound/MingleCallBusySound.mp3";

const CALL_TIMEOUT = 25000;
const BUSY_SOUND_DURATION = 4000;

export const useOutgoingCallLogic = ({ isCallStarting, isCallStarted, callConnection, callId, callStartedDate, onCleanupAndClose  }) => {
    const [callStatus, setCallStatus] = useState("Aranıyor...");
    const callAudioRef = useRef(null);
    const busyAudioRef = useRef(null);

    useEffect(() => {
        if (!isCallStarting || isCallStarted) return;

        setCallStatus("Aranıyor...");
        callAudioRef.current = new Audio(CallSound);
        callAudioRef.current.loop = true;
        callAudioRef.current.play();

        const callTimeoutId = setTimeout(() => {
            setCallStatus("Meşgul");

            if (callAudioRef.current) {
                callAudioRef.current.pause();
                callAudioRef.current.currentTime = 0;
            }

            busyAudioRef.current = new Audio(BusySound);
            busyAudioRef.current.play();

            const busyTimeoutId = setTimeout(() => {
                if (busyAudioRef.current) {
                    busyAudioRef.current.pause();
                    busyAudioRef.current.currentTime = 0;
                }
                // Call status 4: No Answer / Busy
                callConnection.invoke("EndCall", callId, 4, callStartedDate);
                onCleanupAndClose();
            }, BUSY_SOUND_DURATION);

            // Store busy timeout ID to clear it if needed
            busyAudioRef.current.timeoutId = busyTimeoutId;

        }, CALL_TIMEOUT);

        return () => {
            clearTimeout(callTimeoutId);
            if (callAudioRef.current) {
                callAudioRef.current.pause();
                callAudioRef.current.currentTime = 0;
            }
            if (busyAudioRef.current) {
                clearTimeout(busyAudioRef.current.timeoutId);
                busyAudioRef.current.pause();
                busyAudioRef.current.currentTime = 0;
            }
        };

    }, [isCallStarting, isCallStarted, callId, callStartedDate, callConnection, onCleanupAndClose]);

    const audioRefs = { callAudioRef, busyAudioRef };
    return { callStatus, audioRefs };
};