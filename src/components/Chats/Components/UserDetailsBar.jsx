import React from 'react'
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { PiPhoneFill } from "react-icons/pi";
import { HiMiniVideoCamera } from "react-icons/hi2";
import { useModal } from '../../../contexts/ModalContext';
import CallModal from '../../Calls/Components/CallModal';
import { formatDateForLastConnectionDate } from '../../../helpers/dateHelper';
import { useSignalR } from '../../../contexts/SignalRContext';
import { setIsCallStarting } from '../../../store/Slices/calls/callSlice';
import { useDispatch } from 'react-redux';

function UserDetailsBar({ isSidebarOpen, toggleSidebar, recipientProfile, recipientId }) {

    if (!recipientProfile) {
        return null;
    }
    console.log("recipientProfile", recipientProfile)

    const { callConnection } = useSignalR();
    const dispatch = useDispatch();
    const status = recipientProfile.lastConnectionDate == "0001-01-01T00:00:00" ? 'online' : 'offline';
    const lastConnectionDate = recipientProfile.lastConnectionDate;


    const { showModal, closeModal } = useModal();
    const handleVoiceCall = () => {
        showModal(<CallModal closeModal={closeModal} />);
    }

    const handleVideoCall = async () => {
        if (callConnection) {
            try {
                await callConnection.invoke("StartCall", recipientId, 1);
                dispatch(setIsCallStarting(true));
                showModal(<CallModal closeModal={closeModal} />);
            } catch (error) {
                console.error("Error starting video call:", error);
            }
        }
    }

    return (
        <div className={`user-details-sidebar ${isSidebarOpen ? "open" : ""}`}>
            {isSidebarOpen &&
                <>
                    <IoIosArrowDroprightCircle
                        className="sidebar-toggle-buttons"
                        onClick={toggleSidebar}
                    />

                    <div className='sidebar-content-box'>
                        <div className='user-info-box'>
                            <img src={recipientProfile.profilePhoto} alt={`profile`} />
                            <p>{recipientProfile.displayName}</p>
                            <span>{recipientProfile.email}</span>
                        </div>
                        {status == "online" ?
                            <div className='status'>
                                <p className='circle'></p>
                                <p>Çevrimiçi</p>
                            </div>
                            :
                            <div className='status-2'>
                                <p>Son Görülme</p>
                                <span>{formatDateForLastConnectionDate(lastConnectionDate)}</span>
                            </div>
                        }

                        <div className='biography'>
                            <strong>Biyografi</strong>
                            <div className='line'></div>
                            <p>{recipientProfile.biography}</p>
                        </div>
                        <div className='call-buttons'>
                            <div className='button-box'>
                                <button onClick={handleVoiceCall}><PiPhoneFill /> </button>
                                <p>Sesli Ara</p>
                            </div>
                            <div className='button-box'>
                                <button onClick={handleVideoCall}><HiMiniVideoCamera /></button>
                                <p>Görüntülü Ara</p>
                            </div>
                        </div>
                    </div>
                </>
            }
        </div>
    )
}

export default UserDetailsBar