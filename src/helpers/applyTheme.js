export const applyTheme = (theme) => {
    const root = document.documentElement;

    root.removeAttribute("data-theme");

    setTimeout(() => {
        if (theme === "Dark") {
            root.setAttribute("data-theme", "dark");
        } else {
            root.setAttribute("data-theme", "light");
        }
    }, 10);
};


export const setUserProfileTheme = (userProfile) => {
    if (!userProfile) return userProfile;

    const themeEnum = userProfile?.userSettings?.theme;
    let theme = "DefaultSystemMode"; // Varsayılan değer

    // Enum değerine göre tema ataması
    if (themeEnum === 1) {
        theme = "Light";
    } else if (themeEnum === 2) {
        theme = "Dark";
    }

    // userProfile'ı güncelleme
    const updatedUserProfile = {
        ...userProfile,
        userSettings: {
            ...userProfile.userSettings,
            theme, // Yeni theme değeri
        }
    };

    // Temayı uygulama
    if (theme === "DefaultSystemMode" || theme === "Light") {
        applyTheme("Light");
    } else if (theme === "Dark") {
        applyTheme("Dark");
    }

    return updatedUserProfile;
};