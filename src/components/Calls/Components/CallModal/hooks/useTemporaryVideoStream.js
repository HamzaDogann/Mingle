// /hooks/useTemporaryVideoStream.js
import { useState, useEffect } from "react";

export const useTemporaryVideoStream = (isCameraCall, localStream) => {
    const [temporaryStream, setTemporaryStream] = useState(null);

    useEffect(() => {
        const getTemporaryStream = async () => {
            if (isCameraCall && !localStream && !temporaryStream) {
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    setTemporaryStream(tempStream);
                } catch (err) {
                    console.error("Could not get temporary video stream:", err);
                }
            }
        };

        getTemporaryStream();

        return () => {
            if (temporaryStream) {
                temporaryStream.getTracks().forEach((track) => track.stop());
                setTemporaryStream(null);
            }
        };
    }, [isCameraCall, localStream]);

    return temporaryStream;
};