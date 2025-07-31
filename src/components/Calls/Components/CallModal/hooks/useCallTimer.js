// /hooks/useCallTimer.js
import { useState, useEffect } from "react";
import { formatTime } from "../../../../../helpers/formatCallTime";

export const useCallTimer = (isCallStarted) => {
    const [callDuration, setCallDuration] = useState("Bağlandı");

    useEffect(() => {
        let timerInterval;
        if (isCallStarted) {
            let elapsedTime = 0;
            timerInterval = setInterval(() => {
                elapsedTime += 1;
                setCallDuration(formatTime(elapsedTime));
            }, 1000);
        }

        return () => {
            clearInterval(timerInterval);
        };
    }, [isCallStarted]);

    return callDuration;
};