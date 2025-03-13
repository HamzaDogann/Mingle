
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import ChatsList from "./components/ChatsList";
import CallsList from "./components/CallsList";
import ArchivesList from "./components/ArchivesList";
import GroupsList from "./components/GroupsList";

import { defaultProfilePhoto } from "../../constants/DefaultProfilePhoto"

import "./style.scss";

function Dashboard() {

    const location = useLocation();
    const { user } = useSelector(state => state.auth);

    const renderComponent = () => {
        const path = location.pathname;

        switch (true) {
            case path.includes("/sohbetler"):
            case path.includes("/anasayfa"):
                return <ChatsList />;
            case path.includes("/aramalar"):
                return <CallsList />;
            case path.includes("/arsivler"):
                return <ArchivesList />;
            case path.includes("/gruplar"):
                return <GroupsList />;
            default:
                return <p>Sonuç yok</p>;
        }
    };

    return (
        <>
            <div className="dashboard-container">
                <div className="user-info-box">
                    <img
                        src={user.profilePhoto || defaultProfilePhoto}
                        alt=""
                        onError={(e) => e.currentTarget.src = defaultProfilePhoto}
                    />
                    <p>{user.displayName}</p>
                </div>
                <div className="dynamic-list-box">{renderComponent()}</div>
            </div>

        </>
    )
}

export default Dashboard;
