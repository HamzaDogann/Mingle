import { useEffect } from 'react'
import { useSignalR } from '../../contexts/SignalRContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useModal } from "../../contexts/ModalContext.jsx";

import { IoChatbubbleEllipses } from "react-icons/io5";
import { PiPhoneFill } from "react-icons/pi";
import { HiMiniVideoCamera } from "react-icons/hi2";

import CallModal from './Components/CallModal/CallModal.jsx'; 
import useScreenWidth from '../../hooks/useScreenWidth.js';
import WelcomeScreen from '../WelcomeScreen/WelcomeScreen'

import CallStatus from '../../shared/components/CallStatus/CallStatus.jsx';
import { getUserIdFromToken } from '../../helpers/getUserIdFromToken.js';
import { getChatId } from '../../store/Slices/chats/chatSlice.js';

import { formatDateToTR } from '../../helpers/dateHelper.js';
import { opacityEffect } from "../../shared/animations/animations.js"
import BackToMenuButton from '../../shared/components/BackToMenuButton/BackToMenuButton.jsx';

import "./style.scss";

import { motion } from 'framer-motion';
import { startCall } from '../../helpers/startCall.js';
import { defaultProfilePhoto } from '../../constants/DefaultProfilePhoto.js';

function Calls() {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { id } = useParams();
  const { showModal, closeModal } = useModal();
  const { callConnection } = useSignalR();
  const isSmallScreen = useScreenWidth(540);

  const { token } = useSelector(state => state.auth);
  const state = useSelector(state => state.chat);

  const userId = getUserIdFromToken(token);

  const { calls, callRecipientList, isInitialCallsReady, isRingingIncoming } = useSelector(state => state.call);

  const currentCall = calls.find(call => call.id === id);

  useEffect(() => {
    if (isInitialCallsReady && !currentCall) {
      navigate("/aramalar");
    }
  }, [isInitialCallsReady, currentCall, navigate]);

  if (!currentCall) {
    return <>{!id ? <div className="calls-general-box">
      <WelcomeScreen text="Kişisel aramalarınız uçtan uca şifrelidir" />
    </div> : null}</>;
  }

  const { participants, type, status, callDuration, createdDate } = currentCall;
  const recipientId = participants?.find(participant => participant !== userId);
  const participantInfo = callRecipientList?.find(recipient => recipient.id === recipientId);

  const { displayName, profilePhoto } = participantInfo || {};

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

  const handleGoIndividualChat = () => {
    const chatId = getChatId(state, userId, recipientId);
    const chatData = Object.values(state.Individual).find(chat => chat.id === chatId);
    const isArchived = chatData.archivedFor?.hasOwnProperty(userId);
    const destination = isArchived ? `/arsivler/${chatId}` : `/sohbetler/${chatId}`;
    navigate(destination);
  };

  return (
    <motion.div
      className="calls-general-box"
      variants={opacityEffect()}
      initial="initial"
      animate="animate"
      transition="transition"
    >
      {id &&
        <div className="call-info-bar-box">
          <div className='title-and-back-box'>
            <BackToMenuButton path={"aramalar"} />
            <h2>Arama Bilgisi</h2>
          </div>
          <div className="details-box">
            <div className="user-and-call-box">
              <div className="user-info">
                <img src={profilePhoto}
                  onError={(e) => e.currentTarget.src = defaultProfilePhoto}
                />
                <p>{displayName}</p>
              </div>
              <div className="call-options">
                <button onClick={handleGoIndividualChat}><IoChatbubbleEllipses />{isSmallScreen && <span>Mesaj</span>}</button>
                <button
                  disabled={isRingingIncoming}
                  style={{ opacity: isRingingIncoming ? "0.6" : "1" }}
                  onClick={handleVoiceCall}><PiPhoneFill />{isSmallScreen && <span>Sesli</span>}
                </button>

                <button
                  disabled={isRingingIncoming}
                  style={{ opacity: isRingingIncoming ? "0.6" : "1" }}
                  onClick={handleVideoCall}><HiMiniVideoCamera />{isSmallScreen && <span>Görüntülü</span>}
                </button>
              </div>
            </div>
            <div className="call-details">
              <span>{formatDateToTR(createdDate)}</span>
              <CallStatus status={status} type={type} userId={userId} participants={participants} callDuration={callDuration} createdDate={createdDate} />
            </div>
          </div>
        </div>
      }
    </motion.div>
  );
}

export default Calls;