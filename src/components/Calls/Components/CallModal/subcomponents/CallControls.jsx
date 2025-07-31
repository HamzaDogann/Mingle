import { MdScreenShare } from "react-icons/md";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { HiMiniSpeakerWave, HiMiniSpeakerXMark } from "react-icons/hi2";
import { TbMicrophoneFilled, TbMicrophoneOff } from "react-icons/tb";
import { PiPhoneSlashFill } from "react-icons/pi";

export const CallControls = ({ isSpeakerOn, isMicrophoneOn, onToggleSpeaker, onToggleMicrophone, onEndCall }) => (
    <div className="call-option-buttons">
        <button className="disabled" title="Ekran Paylaşımı (yakında)">
            <MdScreenShare />
        </button>
        <button className="disabled" title="Kişi Ekle (yakında)">
            <PersonAddAlt1Icon />
        </button>
        <button onClick={onToggleSpeaker} title={isSpeakerOn ? "Hoparlörü Kapat" : "Hoparlörü Aç"}>
            {isSpeakerOn ? <HiMiniSpeakerWave /> : <HiMiniSpeakerXMark />}
        </button>
        <button onClick={onToggleMicrophone} title={isMicrophoneOn ? "Mikrofonu Kapat" : "Mikrofonu Aç"}>
            {isMicrophoneOn ? <TbMicrophoneFilled /> : <TbMicrophoneOff />}
        </button>
        <button onClick={onEndCall} className="end-call" title="Aramayı Sonlandır">
            <PiPhoneSlashFill />
        </button>
    </div>
);