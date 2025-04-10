import { useState } from "react";
import { useSignalR } from "../../../contexts/SignalRContext";
import { useLocation } from "react-router-dom";

import { FaImages } from "react-icons/fa6";
import CloseModalButton from "../../../contexts/components/CloseModalButton";
import PreLoader from "../PreLoader/PreLoader";

import { ErrorAlert } from "../../../helpers/customAlert";
import "./style.scss";

function ImageModal({ image, closeModal, chatId }) {

    const { chatConnection } = useSignalR();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);

    const handleSendImage = async () => {
        let chatType = '';
        if (location.pathname.includes('sohbetler') || location.pathname.includes('arsivler')) {
            chatType = 'Individual';
        } else if (location.pathname.includes('gruplar')) {
            chatType = 'Group';
        }

        try {
            setIsLoading(true);

            const reader = new FileReader();
            reader.readAsDataURL(image);
            reader.onloadend = async () => {
                const base64Image = reader.result;
                const base64String = base64Image.split(',')[1];

                await chatConnection.invoke("SendMessage", chatType, chatId, {
                    ContentType: 1,
                    content: base64String,
                });

                setIsLoading(false);
                closeModal();
            };
        } catch (error) {
            ErrorAlert("Bir hata meydana geldi");
            setIsLoading(false);
        }
    };

    return (
        <div className="image-modal-box">
            <CloseModalButton closeModal={closeModal} />
            <div className="title-box">
                <FaImages />
                <p>Seçilen Resim</p>
            </div>
            <img src={URL.createObjectURL(image)} alt="Uploaded preview" />
            <button onClick={handleSendImage} className="send-image-btn">Gönder</button>

            {isLoading && <PreLoader />}
        </div>
    );
}

export default ImageModal;