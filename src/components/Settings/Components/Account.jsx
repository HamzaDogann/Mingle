import { useState } from "react";
import { TbEdit } from "react-icons/tb";
import { FaCheck } from "react-icons/fa";
import userImage from "../../../assets/users/hamza.png";

function Account() {

  const email = "hamzadogan20@gmail.com"
  const [username, setUserName] = useState("Hamza Doğan");
  const [phone, setPhoneName] = useState("0546 893 44 13");
  const [biography, setBiography] = useState("Sert kayalar gibi dimdik ve serin, Bükülmeyen bir irade, çelikten kalkan, Ne rüzgâr devirebilir, ne de fırtına, Ayaktayım daima, yıldızları saran");

  // Durumlar: her input için edit modunu kontrol et
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingBiography, setIsEditingBiography] = useState(false);

  // Değişiklikleri kaydetmek için fonksiyonlar
  const handleUsernameChange = () => {
    setIsEditingUsername(!isEditingUsername);
  };

  const handlePhoneChange = () => {
    setIsEditingPhone(!isEditingPhone);
  };

  const handleBiographyChange = () => {
    setIsEditingBiography(!isEditingBiography);
  };

  return (
    <div className="account-box">
      <h3>Hesap</h3>
      <div className="image-box">
        <img src={userImage} alt="User Profile Image" />
        <button className="edit-btn">
          <TbEdit />
        </button>
      </div>
      <div className="name-box">
        {isEditingUsername ? (
          <input
            onChange={(e) => setUserName(e.target.value)}
            value={username}
            type="text"
            placeholder="Ad soyad giriniz..."
          />
        ) : (
          <p>{username}</p>
        )}
        <button className="edit-btn" onClick={handleUsernameChange}>
          {isEditingUsername ? <FaCheck /> : <TbEdit />}
        </button>
      </div>

      <div className="email-and-phone-box">
        <div className="email-box">
          <p>Email</p>
          <span>{email}</span>
        </div>
        <div className="phone-box">
          <p>Telefon</p>
          <div className="phone-edit-box">
            {isEditingPhone ? (
              <input
                onChange={(e) => setPhoneName(e.target.value)}
                value={phone}
                type="text"
                placeholder="Telefon numarası giriniz..."
              />
            ) : (
              <p>{phone}</p>
            )}
            <button className="edit-btn" onClick={handlePhoneChange}>
              {isEditingPhone ? <FaCheck /> : <TbEdit />}
            </button>
          </div>
        </div>
        <div className="biography-box">
          <div className="biograpy-edit-box">
            <p>Biyografi</p>
            <button className="edit-btn" onClick={handleBiographyChange}>
              {isEditingBiography ? <FaCheck /> : <TbEdit />}
            </button>
          </div>
          {!isEditingBiography && 
          <span>{biography}</span>
          }
          {isEditingBiography && (
            <input
              onChange={(e) => setBiography(e.target.value)}
              value={biography}
              type="text"
              placeholder="Biyografi giriniz..."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Account;
