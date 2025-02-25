export const groupMessagesByDate = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groupedMessagesByDate = messages.reduce((acc, message) => {
        const sentDate = Object.values(message?.status?.sent)[0];
        const date = sentDate ? sentDate.split("T")[0] : "Geçersiz Tarih";

        const formattedDate =
            date !== "Geçersiz Tarih" ? date.split("-").reverse().join(".") : date;

        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        let groupLabel;
        if (date === today) {
            groupLabel = "Bugün";
        } else if (date === yesterday) {
            groupLabel = "Dün";
        } else {
            groupLabel = formattedDate;
        }

        if (!acc[groupLabel]) acc[groupLabel] = [];
        acc[groupLabel].push({ id: message.id, ...message });

        return acc;
    }, {});

    return Object.entries(groupedMessagesByDate).filter(([_, messages]) => messages.length > 0);
};
