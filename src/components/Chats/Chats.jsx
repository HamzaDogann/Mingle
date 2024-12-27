import { useState, useEffect } from "react";
import WelcomeScreen from "../WelcomeScreen/WelcomeScreen";

import UserTopBar from "./Components/UserTopBar";
import UserMessageBar from "./Components/UserMessageBar";
import MessageInputBar from "../../shared/components/MessageInputBar/MessageInputBar";
import "../layout.scss";
import UserDetailsBar from "./Components/UserDetailsBar";
import { useLocation, useParams } from "react-router-dom";
import { useSignalR } from "../../contexts/SignalRContext";

function Chats() {
  const { id } = useParams(); // URL'den ID'yi al
  const { chatConnection } = useSignalR(); // SignalR bağlantısını al
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState(null); // Profil bilgilerini tut

  const location = useLocation();
  console.log(location.pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    if (chatConnection && id) {
      // Backend'deki RecipientProfile metodunu çağır
      chatConnection
        .invoke("RecipientProfile", id)
        .then(() => {
          console.log("Profil bilgisi başarıyla talep edildi");
        })
        .catch((error) => {
          console.error("Profil bilgisi alınırken hata:", error);
        });

      // Profil bilgisini dinle
      const handleProfile = (profile) => {
        setRecipientProfile(profile);
      };

      chatConnection.on("ReceiveRecipientProfile", handleProfile);

      // Cleanup
      return () => {
        chatConnection.off("ReceiveRecipientProfile", handleProfile);
      };
    }
  }, [chatConnection, id]);

  return (
    <>
      <div className="chat-general-box">
        {!id && (
          <WelcomeScreen text={"Kişisel sohbetleriniz uçtan uca şifrelidir"} />
        )}

        {id && (
          <>
            <UserTopBar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              recipientProfile={recipientProfile} // Profili üst bileşene geçir
            />
            <UserMessageBar groupedMessages={{}} ChatId={id} /> {/* Örnek veriyi gruplama */}
            <MessageInputBar chatId={id} />
          </>
        )}
      </div>
      {id && (
        <UserDetailsBar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          recipientProfile={recipientProfile} // Sidebar için profil bilgisi
        />
      )}
    </>
  );
}

export default Chats;
