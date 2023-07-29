
const updatePopupContent = async () => {
    const tab = await chrome.tabs.query(
        {active: true, currentWindow: true}
    ).then((tabs) => tabs[0]);

    const titleElement = document.getElementById("title");
    const urlElement = document.getElementById("url");

    if (titleElement && urlElement) {
        titleElement.textContent = tab?.title || "";
        urlElement.textContent = tab?.url || "";

        // ここで保存用サーバから新着情報を取得して表示する処理を実装してください。
    }
};

updatePopupContent();
