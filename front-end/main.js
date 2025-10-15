const content = document.getElementById("content");

async function loadPage(page) {
    try {
        const response = await fetch(`page/${page}.html`);
        if (!response.ok) throw new Error("Không tìm thấy file");
        const html = await response.text();
        content.innerHTML = html;
    } catch (error){
        content.innerHTML = "<h2>Trang không tồn tại</h2>";
    }
}
document.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
        const page = li.getAttribute("data-page");
        loadPage(page);
    })
})
loadPage("trangChu");