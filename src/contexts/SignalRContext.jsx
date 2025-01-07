import store from '../store/index.js';
import { useDispatch, useSelector } from "react-redux";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { createContext, useContext, useState, useEffect, useRef } from "react";

import { getJwtFromCookie } from "../store/helpers/getJwtFromCookie.js";
import { setGroupList, updateUserInfoToGroupList } from "../store/Slices/Group/groupListSlice.js";
import { addNewUserToChatList, setInitialChatList, updateUserInfoToChatList } from "../store/Slices/chats/chatListSlice.js";
import { addMessageToGroup, addMessageToIndividual, addNewGroupChat, addNewIndividualChat, initializeChats } from "../store/Slices/chats/chatSlice.js";
import { handleEndCall, handleIncomingCall, handleOutgoingCall, resetCallState, setCallRecipientList, setCallStartedDate, setInitialCalls, setIsCallStarted, setIsCallStarting, updateCallRecipientList } from "../store/Slices/calls/callSlice.js";
import { constraints, createAndSendOffer, handleRemoteSDP, sendSdp } from "../services/webRtcService.js";

import { servers } from "../constants/StunTurnServers.js";
import { getUserIdFromToken } from "../helpers/getUserIdFromToken.js";
import { decryptMessage } from '../helpers/messageCryptoHelper.js';
import { useLocation } from 'react-router-dom';

const SignalRContext = createContext();

export const useSignalR = () => {
    const context = useContext(SignalRContext);

    if (!context) {
        throw new Error("useSignalR must be used within a SignalRProvider");
    }

    const { initializePeerConnection, chatConnection, notificationConnection, setLocalStream, handleAcceptCall, setRemoteStream, peerConnection, localStream, remoteStream, connectionStatus, callConnection, error, loading } = context;
    return { initializePeerConnection, chatConnection, notificationConnection, setLocalStream, handleAcceptCall, setRemoteStream, peerConnection, localStream, remoteStream, callConnection, connectionStatus, error, loading };
};

export const SignalRProvider = ({ children }) => {

    const dispatch = useDispatch();
    const location = useLocation();
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [chatConnection, setChatConnection] = useState(null);
    const [notificationConnection, setNotificationConnection] = useState(null);
    const [callConnection, setCallConnection] = useState(null);
    const { callId } = useSelector(state => state.call);

    const { Individual, Group } = useSelector(state => state.chat);
    const { token } = useSelector(state => state.auth);
    const userId = getUserIdFromToken(token);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const callIdRef = useRef(callId);
    const peerConnection = useRef(null);

    const initializePeerConnection = async () => {
        try {
            const pc = new RTCPeerConnection(servers);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            peerConnection.current = pc;
        } catch (error) {
            console.error("Kamera veya mikrofon erişiminde hata:", error);
        }
    };

    if (peerConnection.current) {
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("ICE Candidate oluşturuldu:", event.candidate);
                callConnection.invoke("SendIceCandidate", callIdRef.current, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            dispatch(setIsCallStarted(true));
            dispatch(setIsCallStarting(false));

            const currentDate = new Date().toISOString();
            dispatch(setCallStartedDate(currentDate));
        };

        peerConnection.current.oniceconnectionstatechange = () => {
            const state = peerConnection.current.iceConnectionState;

            if (state === "failed" || state === "closed") {
                dispatch(resetCallState())
                if (peerConnection.current) {
                    peerConnection.current.getSenders().forEach((sender) => {
                        if (sender.track) {
                            sender.track.stop();
                        }
                    });
                    peerConnection.current.close();
                    peerConnection.current = null;
                    setLocalStream(null);
                    setRemoteStream(null);
                }
            }
        };
    }

    useEffect(() => {
        callIdRef.current = callId;
    }, [callId]);


    useEffect(() => {
        const token = getJwtFromCookie();

        const chatConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7042/ChatHub", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        const notificationConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7042/NotificationHub", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        const callConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7042/CallHub", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        setConnectionStatus("connecting");

        Promise.all([chatConnection.start(), notificationConnection.start(), callConnection.start()])
            .then(() => {

                setConnectionStatus("connected");
                setLoading(false);

                //! ===========  CHAT CONNECTION ===========

                //Initial Group / Individual Chats 
                chatConnection.on("ReceiveInitialChats", (data) => {
                    store.dispatch(initializeChats(data));
                });

                chatConnection.on("ReceiveInitialGroupProfiles", (data) => {
                    dispatch(setGroupList(data));
                });

                chatConnection.on("ReceiveGetMessages", (data) => {
                    if (data.Individual) {
                        Object.entries(data.Individual).forEach(([chatId, messages]) => {
                            Object.entries(messages).forEach(([messageId, messageData]) => {
                                const decryptedContent = decryptMessage(messageData.content, chatId);
                                store.dispatch(
                                    addMessageToIndividual({
                                        chatId,
                                        messageId,
                                        messageData: { ...messageData, content: decryptedContent },
                                    })
                                );
                            });
                        });
                    }

                    if (data.Group) {
                        Object.entries(data.Group).forEach(([chatId, messages]) => {
                            Object.entries(messages).forEach(([messageId, messageData]) => {
                                const decryptedContent = decryptMessage(messageData.content, chatId);
                                store.dispatch(
                                    addMessageToGroup({
                                        chatId,
                                        messageId,
                                        messageData: { ...messageData, content: decryptedContent },
                                    })
                                );
                            });
                        });
                    }
                });

                chatConnection.on("ReceiveInitialRecipientChatProfiles", (data) => {
                    dispatch(setInitialChatList(data));
                });

                chatConnection.on("ReceiveRecipientProfiles", (data) => {
                    dispatch(addNewUserToChatList(data));
                });

                chatConnection.on("ReceiveCreateChat", (data) => {
                    console.log("Yeni grup chat oluşturuldu:", data);
                    if (data.Individual) {
                        const individualData = data.Individual;
                        const chatId = Object.keys(individualData)[0];
                        if (chatId) {
                            const chatData = individualData[chatId];
                            dispatch(addNewIndividualChat({ chatId, chatData }));
                        } else {
                            console.error("Chat ID alınamadı:", data);
                        }
                    } else if (data.Group) {
                        console.log("Buraya giriyor mu");
                        const groupData = data.Group;
                        const groupId = Object.keys(groupData)[0];

                        if (groupId) {
                            const groupChatData = groupData[groupId];
                            dispatch(addNewGroupChat({ chatId: groupId, chatData: groupChatData }));
                        } else {
                            console.error("Group ID alınamadı:", data);
                        }
                    } else {
                        console.error("Bilinmeyen chat türü:", data);
                    }
                });

                //! =========== NOTIFICATION CONNECTION ===========

                notificationConnection.on("ReceiveRecipientProfiles", (data) => {
                    console.log("notificationConnection güncelleme verisi : ", data);
                    dispatch(updateUserInfoToChatList(data));
                    dispatch(updateUserInfoToGroupList(data));
                    dispatch(updateCallRecipientList(data));

                });

                notificationConnection.on("ReceiveNewGroupProfiles", (data) => {
                    console.log("NotificationHub'dan gelen grup profilleri:", data);

                    dispatch(setGroupList(data));
                    // Gelen data'nın key'ini almak için Object.keys() kullanılıyor
                    const groupId = Object.keys(data)[0];
                    console.log("Group ID:", groupId);

                    if (groupId) {
                        // ChatConnection'un bağlı olduğundan emin olarak işlem yapıyoruz
                        if (chatConnection.state === "Connected") {
                            chatConnection.invoke("CreateChat", "Group", groupId)
                                .then(() => {
                                    console.log(`Grup başarıyla gönderildi: ${groupId}`);
                                })
                                .catch((err) => {
                                    console.error("Grup gönderimi sırasında hata:", err);
                                });
                        } else {
                            console.error("ChatConnection şu anda bağlı değil, işlem gerçekleştirilemedi.");
                            // Bağlantı durumunu beklemek için event-based bir çözüm eklenebilir
                            chatConnection.onclose(() => {
                                console.log("ChatConnection yeniden bağlanıyor...");
                                chatConnection.start()
                                    .then(() => {
                                        console.log("ChatConnection yeniden bağlandı.");
                                        chatConnection.invoke("CreateChat", "Group", groupId)
                                            .then(() => {
                                                console.log(`Grup başarıyla gönderildi: ${groupId}`);
                                            })
                                            .catch((err) => {
                                                console.error("Grup gönderimi sırasında hata:", err);
                                            });
                                    })
                                    .catch((err) => {
                                        console.error("ChatConnection yeniden bağlanırken hata oluştu:", err);
                                    });
                            });
                        }
                    } else {
                        console.error("Grup ID alınamadı.");
                    }
                });

                notificationConnection.on("ReceiveGroupProfiles", (data) => {
                    console.log("NotificationHub'dan gelen grup profilleri:", data);

                }); // Grup profilleri güncellendiğinde, yapılacak işlem

                //! =========== CALL CONNECTION ===========

                // Arama bağlantısındaki dinleyiciler

                //! ===========  CALL CONNECTION ===========


                callConnection.on('ReceiveInitialCalls', async (data) => {
                    dispatch(setInitialCalls(data));
                });
                callConnection.on('ReceiveInitialCallRecipientProfiles', async (data) => {
                    dispatch(setCallRecipientList(data));
                });

                callConnection.on('ReceiveIncomingCall', async (data) => {

                    await handleIncomingCall(data, dispatch);
                    initializePeerConnection(); // PeerConnection'u bekle

                });

                callConnection.on('ReceiveOutgoingCall', async (data) => {
                    console.log("Data geldi mi", data);
                    handleOutgoingCall(data, dispatch);
                });

                callConnection.on('ReceiveEndCall', (data) => {
                    handleEndCall(data.call, dispatch);
                    console.log("end call data", data);

                    const otherDataKey = Object.keys(data).filter(key => key !== 'call')[0];
                    const otherDataObject = data[otherDataKey];

                    if (otherDataObject) {
                        dispatch(updateCallRecipientList(otherDataObject));
                    }

                    if (peerConnection.current) {
                        peerConnection.current.getSenders().forEach((sender) => {
                            if (sender.track) {
                                sender.track.stop();
                            }
                        });
                        peerConnection.current.close();
                        peerConnection.current = null;
                        setLocalStream(null);
                        setRemoteStream(null);
                    }
                });

                callConnection.on('ReceiveIceCandidate', async (data) => {
                    peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
                });

                callConnection.on('ReceiveSdp', async (data) => {
                    try {
                        if (data.type === "offer") {
                            await initializePeerConnection();

                            console.log("Offer işlemleri başlatılıyor...");
                            await handleRemoteSDP(data, peerConnection.current);
                            const answer = await peerConnection.current.createAnswer();
                            await peerConnection.current.setLocalDescription(answer);

                            await sendSdp(callIdRef.current, answer, callConnection);
                        } else if (data.type === "answer") {
                            console.log("peerConnection burada var mı??? = ", peerConnection.current);

                            await handleRemoteSDP(data, peerConnection.current);
                        } else {
                            console.error("Bilinmeyen SDP türü:", data.type);
                        }
                    } catch (error) {
                        console.error("Remote SDP işlenirken hata:", error);
                    }
                });
            })
            .catch((err) => {
                console.error("Hub bağlantı hatası:", err);
                setConnectionStatus("failed");
                setError(err);
                setLoading(false);
            });

        setChatConnection(chatConnection);
        setNotificationConnection(notificationConnection);
        setCallConnection(callConnection);

        const handleBeforeUnload = () => {
            if (chatConnection) chatConnection.stop();
            if (notificationConnection) notificationConnection.stop();
            if (callConnection) callConnection.stop();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup
        return () => {
            if (chatConnection) chatConnection.stop();
            if (notificationConnection) notificationConnection.stop();
            if (callConnection) callConnection.stop();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        if (chatConnection && (Individual?.length > 0 || Group?.length > 0)) {
            console.log("GİRDİ!!");
            deliverMessages();
            console.log(location);
        }
    }, [chatConnection, Individual, Group, location]);

    //! ====== METHODS ======

    const handleAcceptCall = async () => {
        try {
            if (peerConnection)
                createAndSendOffer(callIdRef.current, callConnection, peerConnection);

        } catch (error) {
            console.log("Call accept failed:", error);
        }
    };

    const deliverMessages = async () => {
        try {

            console.log("GİRDİ Mİ?");
            const chatIdFromLocation = window.location.pathname.includes("sohbetler")
                ? window.location.pathname.split('/')[2]
                : null;
            console.log(chatIdFromLocation);
            const groupIdFromLocation = window.location.pathname.includes("gruplar")
                ? window.location.pathname.split('/')[2]
                : null;

            // Individual mesajlarını filtrele ve gönder
            const individualPromises = Individual.flatMap(chat => {
                return chat.messages
                    .filter(message => {
                        const isSent = message.status.sent && Object.keys(message.status.sent).includes(userId);
                        const isDelivered = message.status.delivered && Object.keys(message.status.delivered).includes(userId);
                        return !(isSent || isDelivered);
                    })
                    .map(message =>
                        chatConnection.invoke("DeliverMessage", "Individual", chat.id, message.id)
                    );
            });

            // Aktif chatId için okuma kontrolü ve işlem (Individual)
            const individualReadPromises = chatIdFromLocation
                ? Individual.flatMap(chat => {
                    if (chat.id === chatIdFromLocation) {
                        console.log("GİRDİ Mİ ?");
                        return chat.messages
                            .filter(message => {
                                const isRead = message.status.read && Object.keys(message.status.read).includes(userId);
                                const isSentByUser = message.status.sent && Object.keys(message.status.sent).includes(userId);
                                return !isRead && !isSentByUser;
                            })
                            .map(message =>

                                chatConnection.invoke("ReadMessage", "Individual", chat.id, message.id)
                            );
                    }
                    return [];
                })
                : [];

            // Group mesajlarını filtrele ve gönder
            const groupPromises = Group.flatMap(chat =>
                chat.messages
                    .filter(message => {
                        const isSent = message.status.sent && Object.keys(message.status.sent).includes(userId);
                        const isDelivered = message.status.delivered && Object.keys(message.status.delivered).includes(userId);
                        return !(isSent || isDelivered);
                    })
                    .map(message =>
                        chatConnection.invoke("DeliverMessage", "Group", chat.id, message.id)
                    )
            );

            // Aktif groupId için okuma kontrolü ve işlem (Group)
            const groupReadPromises = groupIdFromLocation
                ? Group.flatMap(chat => {
                    if (chat.id === groupIdFromLocation) {
                        return chat.messages
                            .filter(message => {
                                const isRead = message.status.read && Object.keys(message.status.read).includes(userId);
                                const isSentByUser = message.status.sent && Object.keys(message.status.sent).includes(userId);
                                return !isRead && !isSentByUser;
                            })
                            .map(message =>
                                chatConnection.invoke("ReadMessage", "Group", chat.id, message.id)
                            );
                    }
                    return [];
                })
                : [];

            // Tüm mesajları gönder
            await Promise.all([...individualPromises, ...individualReadPromises, ...groupPromises, ...groupReadPromises]);

            console.log("All messages processed successfully.");
        } catch (err) {
            console.error("Error processing messages:", err);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <SignalRContext.Provider
            value={{
                chatConnection, notificationConnection, callConnection, connectionStatus, error, loading,
                setLocalStream,
                setRemoteStream,
                localStream,
                remoteStream,
                peerConnection,
                initializePeerConnection,
                handleAcceptCall
            }}
        >
            {children}
        </SignalRContext.Provider>
    );
};
