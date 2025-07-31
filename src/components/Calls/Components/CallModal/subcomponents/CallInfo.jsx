// /components/CallModal/subcomponents/CallInfo.js
import { defaultProfilePhoto } from "../../../../../constants/DefaultProfilePhoto";

export const CallInfo = ({ profilePhoto, displayName, status, isCameraCall }) => (
    <div className={`user-and-call-time-box ${isCameraCall ? "cameraCall" : ""}`}>
        <img
            src={profilePhoto || defaultProfilePhoto}
            onError={(e) => e.currentTarget.src = defaultProfilePhoto}
            alt="Profile"
        />
        <p>{displayName}</p>
        <span>{status}</span>
    </div>
);