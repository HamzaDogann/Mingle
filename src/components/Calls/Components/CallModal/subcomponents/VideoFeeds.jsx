// /components/CallModal/subcomponents/VideoFeeds.js
import { forwardRef } from 'react';

const VideoFeeds = forwardRef(({ isCameraCall, isCallStarted, callerProfile }, ref) => {
    const { local, remote } = ref;

    return (
        <div className={`camera-bar ${!isCameraCall ? 'only-voice-call' : ''}`}>
            {isCallStarted && (
                <div className="other-camera-box">
                    <video ref={remote} autoPlay></video>
                    <div className="user-info">
                        <img src={callerProfile?.profilePhoto} alt="" />
                        <p>{callerProfile?.displayName}</p>
                    </div>
                </div>
            )}

            <div className={`device-camera-box ${isCallStarted ? 'remote-connected' : ''}`}>
                {isCameraCall && (
                    <video playsInline ref={local} autoPlay muted></video>
                )}
            </div>
        </div>
    );
});

export { VideoFeeds };