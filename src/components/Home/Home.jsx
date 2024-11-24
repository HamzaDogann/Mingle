import LaptopImage from "../../assets/images/Home/MingleLaptop.png";
import "./style.scss";


function Home() {
  return (
    <div className='home-general-box'>
      <div className="laptop-banner-box">
        <img src={LaptopImage} alt="Mingle" />
      </div>
      <div className="informations-box">
        <h2>Windows için Mingle’ı indirin</h2>
        <p>Mingle ile anında bağlanın; sohbet edin, gruplara katılın
          mesafeleri sesli aramalarla kaldırın!</p>
        <button>Microsoft Store’dan indir</button>
      </div>
      <div className="e2e-info-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.3v3.5c0 .6-.6 1.2-1.3 1.2H9.2c-.6 0-1.2-.6-1.2-1.3v-3.5c0-.6.6-1.2 1.2-1.2V9.5C9.2 8.1 10.6 7 12 7m0 1.2c-.8 0-1.5.5-1.5 1.3V11h3V9.5c0-.8-.7-1.3-1.5-1.3" /></svg>
        <p>Kişisel sohbetleriniz uçtan uca şifrelidir</p>
      </div>
    </div>
  )
}

export default Home