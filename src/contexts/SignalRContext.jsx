import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from 'react-router-dom';
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

import { getJwtFromCookie } from "../store/helpers/getJwtFromCookie.js";
import { removeGroupList, setGroupList, updateGroupInformations, updateUserInfoToGroupList } from "../store/Slices/Group/groupListSlice.js";
import { addMessageToGroup, addMessageToIndividual, addNewGroupChat, addNewIndividualChat, initializeChats, addArchive, removeArchive, removeIndividualChat, removeGroupChat } from "../store/Slices/chats/chatSlice.js";
import { deleteCallHistory, handleEndCall, handleIncomingCall, handleOutgoingCall, resetCallState, setCallRecipientList, setCallStartedDate, setInitialCalls, setIsCallAcceptWaiting, setIsCallStarted, setIsCallStarting, setIsRingingIncoming, updateCallRecipientList } from "../store/Slices/calls/callSlice.js";
import { addNewUserToChatList, setInitialChatList, updateUserInfoToChatList } from "../store/Slices/chats/chatListSlice.js";
import { createAndSendOffer, handleRemoteSDP, sendSdp } from "../services/webRtcService.js";

import { servers } from "../constants/StunTurnServers.js";
import { getUserIdFromToken } from "../helpers/getUserIdFromToken.js";
import { decryptMessage } from '../helpers/messageCryptoHelper.js';

import store from '../store/index.js';
import { ErrorAlert } from "../helpers/customAlert.js";
import PreLoader from "../shared/components/PreLoader/PreLoader.jsx";


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

    const BASE_URL = import.meta.env.VITE_APP_BASE_API_URL;

    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [notificationConnection, setNotificationConnection] = useState(null);
    const [chatConnection, setChatConnection] = useState(null);
    const [callConnection, setCallConnection] = useState(null);

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const { callId } = useSelector(state => state.call);
    const { Individual, Group } = useSelector(state => state.chat);
    const { token, user } = useSelector(state => state.auth);
    const userId = getUserIdFromToken(token);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const callIdRef = useRef(callId);
    const peerConnection = useRef(null);

    const [pendingRequests, setPendingRequests] = useState(new Set());

    const initializePeerConnection = async (callType) => {
        try {
            const pc = new RTCPeerConnection(servers);

            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                },
                video: callType === 1 ? {
                    facingMode: "user",
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 45, max: 60 },
                } : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            peerConnection.current = pc;
        } catch { }
    };

    if (peerConnection.current) {
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                callConnection.invoke("SendIceCandidate", callIdRef.current, event.candidate);
            }
        };

        peerConnection.current.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            dispatch(setIsCallStarted(true));
            dispatch(setIsCallStarting(false));

            callConnection.invoke("AcceptCall", callId);

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
            .withUrl(`${BASE_URL}hub/Chat`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        const notificationConnection = new HubConnectionBuilder()
            .withUrl(`${BASE_URL}hub/Notification`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        const callConnection = new HubConnectionBuilder()
            .withUrl(`${BASE_URL}hub/Call`, {
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


                chatConnection.invoke("Initial")

                chatConnection.off("ReceiveInitialChats");
                chatConnection.on("ReceiveInitialChats", (data) => {
                    store.dispatch(initializeChats(data));
                });

                chatConnection.off("ReceiveInitialRecipientChatProfiles");
                chatConnection.on("ReceiveInitialRecipientChatProfiles", (data) => {
                    dispatch(setInitialChatList(data));
                });

                chatConnection.off("ReceiveInitialGroupProfiles");
                chatConnection.on("ReceiveInitialGroupProfiles", (data) => {
                    dispatch(setGroupList(data));
                });


                chatConnection.off("ReceiveGetMessages");
                chatConnection.on("ReceiveGetMessages", (data) => {
                    if (data.Individual) {
                        Object.entries(data.Individual).forEach(([chatId, messages]) => {
                            Object.entries(messages).forEach(([messageId, messageData]) => {
                                let decryptedContent = messageData.content;
                                if (messageData.type === 0 && decryptedContent && decryptedContent !== "Bu mesaj silindi.") {
                                    decryptedContent = decryptMessage(messageData.content, chatId);
                                }

                                store.dispatch(
                                    addMessageToIndividual({
                                        chatId,
                                        messageId,
                                        messageData: { ...messageData, content: decryptedContent },
                                        userId
                                    })
                                );
                            });
                        });
                    }

                    if (data.Group) {
                        Object.entries(data.Group).forEach(([chatId, messages]) => {
                            Object.entries(messages).forEach(([messageId, messageData]) => {
                                let decryptedContent = messageData.content;

                                if (messageData.type === 0 && decryptedContent && decryptedContent !== "Bu mesaj silindi.") {
                                    decryptedContent = decryptMessage(messageData.content, chatId);
                                }

                                store.dispatch(
                                    addMessageToGroup({
                                        chatId,
                                        messageId,
                                        messageData: { ...messageData, content: decryptedContent },
                                        userId
                                    })
                                );
                            });
                        });
                    }
                });

                chatConnection.off("ReceiveRecipientProfiles");
                chatConnection.on("ReceiveRecipientProfiles", (data) => {
                    dispatch(addNewUserToChatList(data));
                });

                chatConnection.off("ReceiveCreateChat");
                chatConnection.on("ReceiveCreateChat", (data) => {
                    if (data.Individual) {
                        const individualData = data.Individual;
                        const chatId = Object.keys(individualData)[0];

                        if (chatId) {
                            const chatData = individualData[chatId];
                            dispatch(addNewIndividualChat({ chatId, chatData }));
                        }
                    } else if (data.Group) {
                        const groupData = data.Group;
                        const groupId = Object.keys(groupData)[0];

                        if (groupId) {
                            const groupChatData = groupData[groupId];

                            if (groupChatData.messages && Object.keys(groupChatData.messages).length > 0) {
                                groupChatData.messages = Object.entries(groupChatData.messages)
                                    .map(([messageId, msg]) => {
                                        let decryptedContent = msg.content;
                                        if (msg.type === 0 && decryptedContent && decryptedContent !== "Bu mesaj silindi.") {
                                            decryptedContent = decryptMessage(msg.content, groupId);
                                        }
                                        return {
                                            id: messageId,
                                            ...msg,
                                            content: decryptedContent,
                                            sentDate: new Date(msg.status.sent?.[Object.keys(msg.status.sent)[0]])
                                        };
                                    })
                                    .sort((a, b) => a.sentDate - b.sentDate)
                                    .map(({ sentDate, ...msg }) => msg);
                            }

                            dispatch(addNewGroupChat({ chatId: groupId, chatData: groupChatData }));
                        }
                    }
                });

                chatConnection.off("ReceiveArchiveChat");
                chatConnection.on("ReceiveArchiveChat", (data) => {
                    dispatch(addArchive(data));
                });

                chatConnection.off("ReceiveUnarchiveChat");
                chatConnection.on("ReceiveUnarchiveChat", (data) => {
                    dispatch(removeArchive(data));
                });

                chatConnection.off("ReceiveClearChat");
                chatConnection.on("ReceiveClearChat", (data) => {
                    dispatch(removeIndividualChat(data));
                });

                //! =========== NOTIFICATION CONNECTION ===========

                notificationConnection.invoke("Initial");

                notificationConnection.off("ReceiveRecipientProfiles");
                notificationConnection.on("ReceiveRecipientProfiles", (data) => {
                    dispatch(updateUserInfoToChatList(data));
                    dispatch(updateUserInfoToGroupList(data));
                    dispatch(updateCallRecipientList(data));
                });

                notificationConnection.off("ReceiveNewGroupProfiles");
                notificationConnection.on("ReceiveNewGroupProfiles", (data) => {
                    dispatch(setGroupList(data));
                    const groupId = Object.keys(data)[0];

                    if (groupId) {
                        if (chatConnection.state === "Connected") {
                            chatConnection.invoke("CreateChat", "Group", groupId)
                        }
                        else {
                            chatConnection.onclose(() => {
                                chatConnection.start()
                                    .then(() => {
                                        chatConnection.invoke("CreateChat", "Group", groupId)
                                    })
                                    .catch(() => { });
                            });
                        }
                    }
                });

                notificationConnection.off("ReceiveGroupProfiles");
                notificationConnection.on("ReceiveGroupProfiles", (data) => {
                    const groupId = Object.keys(data)[0];
                    const groupData = data[groupId];

                    const userParticipant = groupData.participants[userId];

                    if (userParticipant && userParticipant.role === 2) {
                        dispatch(removeGroupChat(groupId));
                        dispatch(removeGroupList(groupId));
                        navigate("/gruplar");
                        return;
                    }

                    const currentGroupList = store.getState().groupList;
                    if (Object.hasOwn(currentGroupList.groupList, groupId)) {
                        dispatch(updateGroupInformations(data));
                    } else {
                        dispatch(updateGroupInformations(data));
                        chatConnection.invoke("CreateChat", "Group", groupId);
                    }
                });

                //! ===========  CALL CONNECTION ===========

                callConnection.invoke("Initial");

                callConnection.off("ReceiveInitialCalls");
                callConnection.on('ReceiveInitialCalls', async (data) => {
                    dispatch(setInitialCalls(data));
                });

                callConnection.off("ReceiveInitialCallRecipientProfiles");
                callConnection.on('ReceiveInitialCallRecipientProfiles', async (data) => {
                    dispatch(setCallRecipientList(data));
                });


                callConnection.off("ReceiveIncomingCall");
                callConnection.on('ReceiveIncomingCall', async (data) => {
                    const callType = data.callType;
                    handleIncomingCall(data, dispatch, userId);
                    initializePeerConnection(callType);
                });


                callConnection.off("ReceiveOutgoingCall");
                callConnection.on('ReceiveOutgoingCall', async (data) => {
                    handleOutgoingCall(data, dispatch, userId);
                });

                callConnection.off("ReceiveEndCall");
                callConnection.on('ReceiveEndCall', (data) => {
                    handleEndCall(data.call, dispatch);
                    const otherDataKey = Object.keys(data).find(key => key !== 'call');
                    if (otherDataKey) {
                        const otherDataObject = data[otherDataKey];
                        if (otherDataObject) {
                            const formattedData = {
                                [otherDataKey]: {
                                    id: otherDataKey,
                                    ...otherDataObject
                                }
                            };
                            dispatch(updateCallRecipientList(formattedData));
                        }
                    }
                    if (peerConnection.current) {
                        peerConnection.current.getSenders().forEach(sender => {
                            if (sender.track) {
                                sender.track.stop();
                            }
                        });
                        peerConnection.current.close();
                        peerConnection.current = null;
                    }

                    setLocalStream(null);
                    setRemoteStream(null);
                });

                callConnection.off("ReceiveDeleteCall");
                callConnection.on('ReceiveDeleteCall', (data) => {
                    dispatch(deleteCallHistory(data));
                });

                callConnection.off("ReceiveIceCandidate");
                callConnection.on('ReceiveIceCandidate', async (data) => {
                    peerConnection.current.addIceCandidate(new RTCIceCandidate(data));
                });


                callConnection.off("ReceiveSdp");
                callConnection.on('ReceiveSdp', async (data) => {
                    try {
                        if (data.sdp.type === "offer") {
                            await initializePeerConnection(data.callType);

                            await handleRemoteSDP(data.sdp, peerConnection.current);
                            const answer = await peerConnection.current.createAnswer();
                            await peerConnection.current.setLocalDescription(answer);

                            await sendSdp(callIdRef.current, answer, callConnection);
                        } else if (data.sdp.type === "answer") {
                            await handleRemoteSDP(data.sdp, peerConnection.current);
                        }
                    } catch { }
                });

                callConnection.off("ReceiveAcceptCall");
                callConnection.on('ReceiveAcceptCall', async (data) => {
                    if (store.getState().call.isCallStarted) {
                        return;
                    }
                    dispatch(setIsRingingIncoming(false));
                });

                //! ==== CONNECTION ERRORS =====

                chatConnection.on('Error', () => {
                    ErrorAlert(data.message);
                });

                notificationConnection.on('Error', () => {
                    ErrorAlert(data.message);
                });

                callConnection.on('ValidationError', () => { });

            })
            .catch((err) => {
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

        return () => {
            if (chatConnection) chatConnection.stop();
            if (notificationConnection) notificationConnection.stop();
            if (callConnection) callConnection.stop();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        if (chatConnection && (Individual?.length > 0 || Group?.length > 0)) {
            deliverMessages();
        }
    }, [chatConnection, Individual, Group, location, pendingRequests]);

    //! ====== METHODS ======

    const handleAcceptCall = async () => {
        try {
            if (peerConnection)
                dispatch(setIsCallAcceptWaiting(true));
            createAndSendOffer(callIdRef.current, callConnection, peerConnection);
        } catch { }
    };

    const addPendingRequest = (messageId) => {
        setPendingRequests((prev) => new Set(prev).add(messageId));
    };

    const removePendingRequest = (messageId) => {
        setPendingRequests((prev) => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
        });
    };

    const deliverMessages = async () => {
        try {
            const chatIdFromLocation = window.location.pathname.includes("sohbetler") || window.location.pathname.includes("arsivler")
                ? window.location.pathname.split('/')[2]
                : null;
            const groupIdFromLocation = window.location.pathname.includes("gruplar")
                ? window.location.pathname.split('/')[2]
                : null;

            const individualPromises = Individual.flatMap(chat =>
                chat?.messages
                    .filter(message => {
                        const isSent = message.status.sent && Object.keys(message.status.sent).includes(userId);
                        const isDelivered = message.status.delivered && Object.keys(message.status.delivered).includes(userId);

                        return !isSent && !isDelivered && !pendingRequests.has(message.id);
                    })
                    .map(async message => {
                        addPendingRequest(message.id);
                        try {
                            await chatConnection.invoke("DeliverMessage", "Individual", chat.id, message.id);
                        } finally {
                            removePendingRequest(message.id);
                        }
                    })
            );

            const individualReadPromises = chatIdFromLocation
                ? Individual.flatMap(chat => {
                    if (chat.id === chatIdFromLocation) {
                        return chat.messages
                            .filter(message => {
                                const isDelivered = message.status.delivered && Object.keys(message.status.delivered).includes(userId);
                                const isRead = message.status.read && Object.keys(message.status.read).includes(userId);
                                const isSentByUser = message.status.sent && Object.keys(message.status.sent).includes(userId);

                                return isDelivered && !isRead && !isSentByUser;
                            })
                            .map(async message => {
                                if (!pendingRequests.has(message.id)) {
                                    addPendingRequest(message.id);
                                    try {
                                        await chatConnection.invoke("ReadMessage", "Individual", chat.id, message.id);
                                    } finally {
                                        removePendingRequest(message.id);
                                    }
                                }
                            });
                    }
                    return [];
                })
                : [];

            const groupPromises = Group.flatMap(chat =>
                chat.messages
                    .filter(message => {
                        const isSent = message.status.sent && Object.keys(message.status.sent).includes(userId);
                        const isDelivered = message.status.delivered && Object.keys(message.status.delivered).includes(userId);
                        return !(isSent || isDelivered) && !pendingRequests.has(message.id);
                    })
                    .map(async message => {
                        addPendingRequest(message.id);
                        try {
                            await chatConnection.invoke("DeliverMessage", "Group", chat.id, message.id);
                        } finally {
                            removePendingRequest(message.id);
                        }
                    })
            );

            const groupReadPromises = groupIdFromLocation
                ? Group.flatMap(chat => {
                    if (chat.id === groupIdFromLocation) {
                        return chat.messages
                            .filter(message => {
                                const isRead = message.status.read && Object.keys(message.status.read).includes(userId);
                                const isSentByUser = message.status.sent && Object.keys(message.status.sent).includes(userId);
                                return !isRead && !isSentByUser && !pendingRequests.has(message.id);
                            })
                            .map(async message => {
                                addPendingRequest(message.id);
                                try {
                                    await chatConnection.invoke("ReadMessage", "Group", chat.id, message.id);
                                } finally {
                                    removePendingRequest(message.id);
                                }
                            });
                    }
                    return [];
                })
                : [];

            await Promise.all([...individualPromises, ...individualReadPromises, ...groupPromises, ...groupReadPromises]);

        } catch { }
    };


    if (loading) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "var(--app-height)",
                    background: user.userSettings.theme === "Dark" ? "#141414" : "#ffffff",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <PreLoader />
            </div>
        );
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