import { useSelector } from "react-redux";
import { useState } from "react";
import SearchInput from "./SearchInput";
import "./style.scss";
import UserCallCard from "./UserCallCard";
import { getUserIdFromToken } from "../../../helpers/getUserIdFromToken";
import NoActiveData from "../../../shared/components/NoActiveData/NoActiveData";

function CallsList() {
  const { token } = useSelector(state => state.auth);
  const { callRecipientList, calls } = useSelector(state => state.call);
  const userId = getUserIdFromToken(token);

  const [searchTerm, setSearchTerm] = useState("");

  // Calls listesi işleniyor
  const processedCalls = calls.map(call => {
    const otherParticipantId = call.participants.find(participant => participant !== userId);
    const recipientInfo = callRecipientList.find(recipient => recipient.id === otherParticipantId);
    const isOutgoingCall = call.participants[0] === userId;

    return {
      id: call.id,
      name: recipientInfo?.displayName || "Unknown",
      image: recipientInfo?.profilePhoto || "",
      status: recipientInfo?.lastConnectionDate || "offline",
      callStatus: call.status,
      callType: call.type,
      callDuration: call.callDuration,
      createdDate: new Date(call.createdDate),
      isOutgoingCall
    };
  });

  // Çağrıları tarihe göre sırala (En güncelden eskiye)
  const sortedCalls = processedCalls.sort((a, b) => b.createdDate - a.createdDate);

  // Arama terimine göre filtreleme yap
  const filteredCalls = sortedCalls.filter(call =>
    call.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="call-list-box">
      <SearchInput
        placeholder={"Aratın veya yeni arama başlatın"}
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <div className="list-flex">
        <div className="user-list">
          {filteredCalls.length > 0 ? (
            filteredCalls.map(callInfo => (
              <UserCallCard
                key={callInfo.id}
                callId={callInfo.id}
                image={callInfo.image}
                status={callInfo.status}
                callType={callInfo.callType}
                name={callInfo.name}
                callStatus={callInfo.callStatus}
                createdDate={callInfo.createdDate}
                isOutgoingCall={callInfo.isOutgoingCall}
              />
            ))
          ) : (
            <NoActiveData text={searchTerm ? "Eşleşen arama bulunamadı" : "Arama geçmişiniz bulunmamaktadır."} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CallsList;
