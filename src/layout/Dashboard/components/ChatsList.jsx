import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import NewChatModal from "../../../components/Chats/Components/NewChat/NewChatModal";
import { useModal } from "../../../contexts/ModalContext";
import SearchInput from "./SearchInput";
import UserChatCard from "./UserChatCard";
import { getUserIdFromToken } from "../../../helpers/getUserIdFromToken";
import { lastMessageDateHelper } from "../../../helpers/dateHelper";
import NoChats from "../../../assets/NoChats.webp";

import "./style.scss";
import { useLocation } from "react-router-dom";
import { getChatId } from "../../../store/Slices/chats/chatSlice";

function ChatsList() {
    const { showModal, closeModal } = useModal();
    const { Individual } = useSelector((state) => state.chat); // Chat bilgileri
    const chatList = useSelector((state) => state.chatList.chatList); // Orijinal chatList
    const { token } = useSelector((state) => state.auth); // Kullanıcı token'ı
    const UserId = getUserIdFromToken(token);
    const [enhancedChatList, setEnhancedChatList] = useState([]);
    const chatState = useSelector(state => state.chat);

    const location = useLocation();

    useEffect(() => {
        const updatedChatList = Object.entries(chatList)
            .map(([receiverId, user]) => {
                const chatData = Individual.find(
                    (chat) =>
                        chat.participants.includes(receiverId) &&
                        chat.participants.includes(UserId)
                );

                const chatId = getChatId(chatState, UserId, receiverId);

                if (!chatData || !chatData.messages || chatData.messages.length === 0) {
                    return null;
                }

                // Eğer tüm mesajlar UserId için silinmişse, return etme
                const allMessagesDeleted = chatData?.messages.every(
                    (message) => message.deletedFor && Object.keys(message.deletedFor).length > 0 && message.deletedFor.hasOwnProperty(UserId)
                );
                if (allMessagesDeleted) {
                    return null;
                }

                const lastMessage = chatData?.messages[chatData?.messages.length - 1].content;

                const lastMessageForDeleted = chatData?.messages[chatData?.messages.length - 1];
                const isDeleted = lastMessageForDeleted?.deletedFor?.hasOwnProperty(UserId) ?? false;
                const lastMessageType = chatData?.messages[chatData?.messages.length - 1].type;

                const lastMessageDate =
                    chatData.messages.length > 0
                        ? lastMessageDateHelper(
                            Object.values(chatData.messages[chatData.messages.length - 1].status.sent)[0]
                        )
                        : "";

                const lastMessageDateForSort =
                    chatData.messages.length > 0
                        ? new Date(
                            Object.values(chatData.messages[chatData.messages.length - 1].status.sent)[0]
                        ).getTime()
                        : "";

                const isArchive = chatData.archivedFor?.hasOwnProperty(UserId);

                const isActiveChat = location.pathname.includes(chatId);

                const unReadMessage = !isActiveChat && chatData.messages.filter((message) => {
                    return (
                        !Object.keys(message.status.sent).includes(UserId) &&
                        !message.status.read?.[UserId]
                    );
                }).length;

                return {
                    receiverId,
                    image: user.profilePhoto,
                    status: user.lastConnectionDate === "0001-01-01T00:00:00",
                    name: user.displayName,
                    lastMessage,
                    lastMessageType,
                    lastMessageDate,
                    lastMessageDateForSort,
                    isArchive,
                    isDeleted,
                    unReadMessage
                };
            })
            .filter((chat) => chat !== null)
            .sort((a, b) => b.lastMessageDateForSort - a.lastMessageDateForSort);

        setEnhancedChatList(updatedChatList);
    }, [chatList, Individual, UserId, chatState]);


    const handleNewChat = () => {
        showModal(<NewChatModal closeModal={closeModal} />);
    };

    const nonArchivedChats = enhancedChatList.filter((chat) => !chat.isArchive);



    return (
        <div className="chat-list-box">
            <SearchInput placeholder={"Sohbetlerinizde aratın..."} />
            <div>
                <button onClick={handleNewChat} className="create-buttons">
                    Yeni Sohbet
                </button>
            </div>
            <div className="user-list">
                {nonArchivedChats.length > 0 ? (
                    nonArchivedChats.map((chat) => (
                        <UserChatCard
                            key={chat.receiverId}
                            receiverId={chat.receiverId}
                            image={chat.image}
                            status={chat.status}
                            name={chat.name}
                            lastMessage={chat.lastMessage}
                            lastMessageType={chat.lastMessageType}
                            lastMessageDate={chat.lastMessageDate}
                            isArchive={chat.isArchive}
                            unReadMessage={chat.unReadMessage}
                            isDeleted={chat.isDeleted}
                        />
                    ))
                ) : (
                    <div className="no-active-chats">
                        <img src={NoChats} alt="" />
                        <p>Aktif sohbet bulunmuyor...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatsList;
