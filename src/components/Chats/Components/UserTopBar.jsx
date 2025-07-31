import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useModal } from '../../../contexts/ModalContext';
import { useSignalR } from '../../../contexts/SignalRContext';
import useScreenWidth from '../../../hooks/useScreenWidth';

import { PiPhoneFill } from "react-icons/pi";
import { HiMiniVideoCamera } from "react-icons/hi2";
import { IoIosArrowDropleftCircle } from "react-icons/io";

import CallModal from '../../Calls/Components/CallModal/CallModal';
import { formatDateForLastConnectionDate } from '../../../helpers/dateHelper';
import BackToMenuButton from '../../../shared/components/BackToMenuButton/BackToMenuButton';
import { startCall } from '../../../helpers/startCall';
import { defaultProfilePhoto } from '../../../constants/DefaultProfilePhoto';

function UserTopBar({ isSidebarOpen, toggleSidebar, recipientProfile, recipientId }) {

    if (!recipientProfile) {
        return null;
    }

    const dispatch = useDispatch();
    const location = useLocation();

    const { callConnection } = useSignalR();
    const { isRingingIncoming } = useSelector((state) => state.call);
    const { showModal, closeModal } = useModal();
    const isSmallScreen = useScreenWidth(900);

    const status = recipientProfile.lastConnectionDate == "0001-01-01T00:00:00" ? 'online' : 'offline';
    const lastConnectionDate = recipientProfile.lastConnectionDate;


    const handleVoiceCall = () => {
        startCall(callConnection, recipientId, false, dispatch, () =>
            showModal(<CallModal closeModal={closeModal} isCameraCall={false} />)
        );
    };

    const handleVideoCall = () => {
        startCall(callConnection, recipientId, true, dispatch, () =>
            showModal(<CallModal closeModal={closeModal} isCameraCall={true} />)
        );
    };

    return (
        <div className={`user-top-bar ${isSidebarOpen ? 'close' : ''}`}>
            <div className="user-info">
                {isSmallScreen && (
                    <BackToMenuButton
                        path={location.pathname.includes("arsivler") ? "arsivler" : "sohbetler"}
                    />
                )}
                <div onClick={toggleSidebar} className="image-box">
                    <img src={recipientProfile.profilePhoto}
                        onError={(e) => e.currentTarget.src = defaultProfilePhoto}
                    />
                    <p className={`status ${status}`}></p>
                </div>
                <div onClick={toggleSidebar} className="name-and-status-box">
                    <p className="user-name">{recipientProfile.displayName}</p>

                    {status == "online" ?
                        <span>Çevrimiçi</span>
                        :
                        <span>{formatDateForLastConnectionDate(lastConnectionDate)}</span>
                    }
                </div>
            </div>

            <div className="top-bar-buttons">
                <div className='call-options'>
                    <button
                        disabled={isRingingIncoming}
                        style={{ opacity: isRingingIncoming ? "0.6" : "1" }}
                        onClick={() => handleVoiceCall()}><PiPhoneFill />
                    </button>

                    <button
                        disabled={isRingingIncoming}
                        style={{ opacity: isRingingIncoming ? "0.6" : "1" }}
                        onClick={() => handleVideoCall()}><HiMiniVideoCamera />
                    </button>
                </div>
                {!isSmallScreen &&
                    <IoIosArrowDropleftCircle
                        className="sidebar-toggle-buttons"
                        onClick={toggleSidebar}
                    />
                }
            </div>
        </div>
    )
}

export default UserTopBar