import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header/Header";
import Sidebar from "./Sidebar/Sidebar";
import Dashboard from "./Dashboard/Dashboard";
import "./style.scss";

const Layout = () => {
    const location = useLocation();
    const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 900);
    const [isActiveContent, setIsActiveContent] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsWideScreen(window.innerWidth >= 900);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const activeRoutes = ["/sohbetler", "/arsivler", "/aramalar", "/gruplar"];

        // Aktif rota kontrolü
        const isMatchingRoute = activeRoutes.some(route => {
            return location.pathname.startsWith(route) && location.pathname !== route && location.pathname !== `${route}/`;
        });

        setIsActiveContent(isMatchingRoute);
    }, [location.pathname]);

    return (
        <div className="layout-container">
            {isWideScreen || !isActiveContent ? <Header /> : null}

            <div className="main-content">
                <div className="outlet-content">
                    {isWideScreen ? (
                        <>
                            <Dashboard />
                            <Outlet />
                        </>
                    ) : (
                        isActiveContent
                            ? <Outlet />
                            : <Dashboard />
                    )}
                </div>
                <Sidebar />
            </div>
        </div>
    );
};

export default Layout;
