import React, { useEffect, useRef, useState } from "react";
import { useSignalR } from "../../../contexts/SignalRContext";
import { HiPlus } from "react-icons/hi";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import { LuFileUp } from "react-icons/lu";
import { LuImage } from "react-icons/lu";
import { BiSolidMicrophone } from "react-icons/bi";
import { LuFileVideo } from "react-icons/lu";
import { SiGooglegemini } from "react-icons/si";


import { useModal } from "../../../contexts/ModalContext";
import ImageModal from "../ImageModal/ImageModal";
import { useLocation } from "react-router-dom";
import { encryptMessage } from "../../../helpers/messageCryptoHelper";
import SoundRecordModal from "../SoundRecordModal/SoundRecordModal";
import "./style.scss";
import { convertFileToBase64 } from "../../../store/helpers/convertFileToBase64";
import { ErrorAlert, SuccessAlert } from "../../../helpers/customAlert";
import PreLoader from "../PreLoader/PreLoader";
import { AIModal } from "../AIModal/AIModal";

function MessageInputBar({ chatId }) {
    const location = useLocation();
    const { chatConnection } = useSignalR();
    const [isLoading, setIsLoading] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isShowFileMenu, setShowFileMenu] = useState(false);
    const emojiPickerRef = useRef(null);

    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const AIButtonRef = useRef(null);

    const { showModal, closeModal } = useModal();
    const [message, setMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);


    const fileImageInputRef = useRef(null);
    const fileVideoInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const fileMenuRef = useRef(null);
    const addFileButtonRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            // Eğer tıklanan eleman fileMenuRef veya buttonRef içinde değilse menüyü kapat
            if (
                fileMenuRef.current &&
                !fileMenuRef.current.contains(event.target) &&
                addFileButtonRef.current &&
                !addFileButtonRef.current.contains(event.target)
            ) {
                setShowFileMenu(false);
            }
        }

        // Document'a tıklama dinleyicisi ekle
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Component unmount olduğunda dinleyiciyi temizle
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [message, selectedFile]);


    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker((prev) => !prev);
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
    };

    const handleFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleImageSelect = () => {
        fileImageInputRef.current.click();
    };

    const handleVideoSelect = () => {
        fileVideoInputRef.current.click();
    }

    const handleSoundRecord = () => {
        showModal(<SoundRecordModal closeModal={closeModal} chatId={chatId} />);
    }

    const handleVideoFileChange = async (e) => {
        const file = e.target.files[0];
        let chatType = '';
        if (location.pathname.includes('sohbetler') || location.pathname.includes('arsivler')) {
            chatType = 'Individual';
        } else if (location.pathname.includes('gruplar')) {
            chatType = 'Group';
        }

        if (file) {
            try {
                setIsLoading(true);
                const base64String = await convertFileToBase64(file);
                // Videoyu göndermek için chatConnection.invoke çağrısı
                await chatConnection.invoke("SendMessage", chatType, chatId, {
                    ContentType: 2,
                    content: base64String,
                });

                setIsLoading(false);
                SuccessAlert("Video gönderildi");
            } catch {
                ErrorAlert("Video gönderilemedi");
            }
        } else {
            ErrorAlert("Dosya seçilmedi");
        }
    };

    const handleImageFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            showModal(<ImageModal closeModal={closeModal} image={file} chatId={chatId} />);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        let chatType = '';

        // Chat türünü belirle
        if (location.pathname.includes('sohbetler') || location.pathname.includes('arsivler')) {
            chatType = 'Individual';
        } else if (location.pathname.includes('gruplar')) {
            chatType = 'Group';
        }

        if (file) {
            try {
                setIsLoading(true);
                // Dosyayı base64'e dönüştür
                const base64String = await convertFileToBase64(file);
                // Dosyayı göndermek için chatConnection.invoke çağrısı
                await chatConnection.invoke("SendMessage", chatType, chatId, {
                    ContentType: 4, // 4: Belge, ses veya farklı türdeki dosya
                    content: base64String,
                });

                setIsLoading(false);
                SuccessAlert("Dosya gönderildi");
            } catch {
                setIsLoading(false);
                ErrorAlert("Dosya gönderilemedi");
            }
        } else {
            ErrorAlert("Dosya seçilmedi");
        }
    };

    const handleSendMessage = async () => {
        setMessage("");
        if (!message && !selectedFile) {
            console.error("Boş bir mesaj gönderilemez.");
            return;
        }

        // ContentType'ı belirleme
        let contentType;
        if (message) {
            contentType = 0; // Text
        } else if (selectedFile) {
            contentType = 1; // File
        }

        // DTO'yu oluşturma
        const sendMessageDto = {
            ContentType: contentType,
            Content: message || null,
        };

        let chatType = '';

        // Check the pathname and determine the chat type
        if (location.pathname.includes('sohbetler') || location.pathname.includes('arsivler')) {
            chatType = 'Individual'; // If "sohbetler" or "arsivler" is in the pathname, chatType = Individual
        } else if (location.pathname.includes('gruplar')) {
            chatType = 'Group'; // If "gruplar" is in the pathname, chatType = Group
        }
        try {
            const encryptedMessage = encryptMessage(message, chatId);
            await chatConnection.invoke("SendMessage", chatType, chatId, {
                ...sendMessageDto,
                content: encryptedMessage,
            });

            setSelectedFile(null);
        } catch (error) {
            console.error("Mesaj gönderme hatası:", error);
        }
    };

    return (
        <div className="message-input-bar">
            <div className="input-box">
                <div className="add-file-box" >
                    <button ref={addFileButtonRef} className="add-file-button" onClick={() => setShowFileMenu(!isShowFileMenu)}>
                        <HiPlus />
                    </button>

                    {isShowFileMenu &&
                        <div className="file-menu" ref={fileMenuRef}>
                            <button onClick={handleFileSelect}><LuFileUp /></button>
                            <button onClick={handleImageSelect}><LuImage /></button>
                            <button onClick={handleSoundRecord}><BiSolidMicrophone /></button>
                            <button onClick={handleVideoSelect}><LuFileVideo /></button>
                        </div>
                    }

                    <input
                        type="file"
                        accept="image/png"
                        ref={fileImageInputRef}
                        style={{ display: "none" }}
                        onChange={handleImageFileChange}
                    />

                    <input
                        type="file"
                        accept="video/*"
                        ref={fileVideoInputRef}
                        style={{ display: "none" }}
                        onChange={handleVideoFileChange}
                    />
                    <input
                        type="file"
                        accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.zip,.rar,.7z,.txt,.mp3,.wav,.ogg"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />

                </div>

                <input
                    type="text"
                    placeholder="Bir mesaj yazın"
                    value={message}
                    onChange={handleInputChange}
                />

                <div className="ai-emoji-send-buttons">
                    <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} buttonRef={AIButtonRef} />

                    <button ref={AIButtonRef} onClick={() => setIsAIModalOpen(!isAIModalOpen)} className="ai-button">
                        <SiGooglegemini />
                    </button>

                    <button className="add-emoji-button" onClick={toggleEmojiPicker}>
                        <MdOutlineEmojiEmotions />
                    </button>

                    {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="emoji-picker">
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}
                    <button onClick={handleSendMessage} className="send-message-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 27 27" fill="none">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M3.82724 7.50691C3.53474 4.88116 6.23812 2.95291 8.62649 4.08466L22.0635 10.4499C24.6375 11.6683 24.6375 15.3313 22.0635 16.5497L8.62649 22.916C6.23812 24.0478 3.53587 22.1195 3.82724 19.4938L4.36724 14.6248H13.5C13.7984 14.6248 14.0845 14.5063 14.2955 14.2953C14.5065 14.0843 14.625 13.7982 14.625 13.4998C14.625 13.2014 14.5065 12.9153 14.2955 12.7043C14.0845 12.4933 13.7984 12.3748 13.5 12.3748H4.36837L3.82724 7.50691Z"
                                fill="white"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            {isLoading && <PreLoader />}
        </div>
    );
}

export default MessageInputBar;
