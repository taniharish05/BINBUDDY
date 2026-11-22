// ==========================================
// BINBUDDY - MAIN JAVASCRIPT
// ==========================================

// Safe browser storage helpers
function loadData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        showToast("Browser storage is unavailable. Changes may not persist.");
    }
}

let reports = loadData("binbuddy_reports", []);
let completedChallenges = loadData("binbuddy_challenges", []);
let toastTimer;


// ==========================================
// NAVIGATION
// ==========================================

const pageNames = {
    home: "Overview",
    report: "Report Waste",
    complaints: "Track Complaints",
    scanner: "AI Waste Scanner",
    assistant: "AI Assistant",
    calculator: "Impact Calculator",
    reports: "Progress & Reports",
    community: "Community",
    quiz: "Waste Quiz",
    segregation: "Learn Segregation"
};


function showPage(pageName) {

    const target = document.getElementById("page-" + pageName);

    if (!target) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const breadcrumb = document.getElementById("breadcrumbPage");

    if (breadcrumb) {
        breadcrumb.textContent =
            pageNames[pageName] || "Overview";
    }

    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (pageName === "home") renderHome();
    if (pageName === "complaints") renderComplaints();
    if (pageName === "reports") renderAnalytics();
    if (pageName === "community") renderChallenges();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    refreshIcons();
}


function toggleSidebar() {

    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}


// Close the mobile sidebar if the user clicks outside it
document.addEventListener("click", function (event) {

    const sidebar = document.querySelector(".sidebar");
    const menuButton = document.querySelector(".mobile-menu");

    if (
        sidebar &&
        menuButton &&
        window.innerWidth <= 760 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        sidebar.classList.remove("open");
    }
});


// ==========================================
// ICONS, DATE AND TOAST
// ==========================================

function refreshIcons() {

    if (window.lucide) {
        window.lucide.createIcons();
    }
}


function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


function updateDate() {

    const dateElement = document.getElementById("todayDate");

    if (dateElement) {
        dateElement.textContent =
            new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
    }
}


// Escape user-entered text before displaying it as HTML
function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


function makeId() {

    return "BB-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36)
            .slice(2, 6)
            .toUpperCase();
}


function formatDate(value) {

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function statusClass(status) {

    if (status === "Resolved") {
        return "status-resolved";
    }

    if (status === "In Progress") {
        return "status-progress";
    }

    return "status-submitted";
}


function statusIcon(type) {

    if (type.toLowerCase().includes("bin")) {
        return "trash-2";
    }

    if (type.toLowerCase().includes("dump")) {
        return "alert-triangle";
    }

    if (type.toLowerCase().includes("street")) {
        return "map-pin";
    }

    return "recycle";
}


// ==========================================
// DASHBOARD OVERVIEW
// ==========================================

function renderHome() {

    const total = reports.length;

    const pending = reports.filter(
        report => report.status !== "Resolved"
    ).length;

    const resolved = reports.filter(
        report => report.status === "Resolved"
    ).length;

    const statReports = document.getElementById("statReports");
    const statPending = document.getElementById("statPending");
    const statResolved = document.getElementById("statResolved");
    const statTips = document.getElementById("statTips");
    const complaintCount = document.getElementById("complaintCount");

    if (statReports) statReports.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statResolved) statResolved.textContent = resolved;

    if (statTips) {
        statTips.textContent = completedChallenges.length;
    }

    if (complaintCount) {
        complaintCount.textContent = total;
    }

    const recent = reports.slice(0, 4);

    const recentContainer =
        document.getElementById("recentReports");

    if (!recentContainer) return;

    if (!recent.length) {

        recentContainer.innerHTML = `
            <div class="empty-state">
                <div style="font-size:30px;margin-bottom:8px">
                    🌱
                </div>

                <strong>No reports yet</strong>

                <p>
                    Your submitted waste issues will appear here.
                </p>

                <button
                    class="text-button"
                    onclick="showPage('report')"
                >
                    Create your first report →
                </button>
            </div>
        `;

    } else {

        recentContainer.innerHTML =
            recent.map(report => `
                <div class="report-row">

                    <div class="report-row-icon">
                        <i
                            data-lucide="${statusIcon(report.type)}"
                        ></i>
                    </div>

                    <div class="report-row-info">
                        <strong>
                            ${escapeHTML(report.type)}
                        </strong>

                        <small>
                            ${escapeHTML(report.id)}
                            ·
                            ${escapeHTML(report.location)}
                        </small>
                    </div>

                    <span
                        class="status-badge
                        ${statusClass(report.status)}"
                    >
                        ${escapeHTML(report.status)}
                    </span>

                </div>
            `).join("");
    }

    refreshIcons();
}


// ==========================================
// REPORT WASTE ISSUE
// ==========================================

const reportForm =
    document.getElementById("reportForm");


if (reportForm) {

    reportForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const type =
                document.getElementById("issueType")
                    .value.trim();

            const location =
                document.getElementById("issueLocation")
                    .value.trim();

            const description =
                document.getElementById("issueDescription")
                    .value.trim();

            const priority =
                document.getElementById("issuePriority")
                    .value;

            if (!type || !location || !description) {

                showToast(
                    "Please complete all required fields."
                );

                return;
            }

            const newReport = {
                id: makeId(),
                type,
                location,
                description,
                priority,
                status: "Submitted",
                createdAt: new Date().toISOString()
            };

            reports.unshift(newReport);

            saveData(
                "binbuddy_reports",
                reports
            );

            reportForm.reset();

            const preview =
                document.getElementById(
                    "issueImagePreview"
                );

            if (preview) {
                preview.innerHTML = "";
            }

            renderHome();
            renderComplaints();
            renderAnalytics();

            showToast(
                "Report submitted! Your ID is " +
                newReport.id
            );

            showPage("complaints");
        }
    );
}


// Optional image preview for a waste report
const issueImage =
    document.getElementById("issueImage");


if (issueImage) {

    issueImage.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            const preview =
                document.getElementById(
                    "issueImagePreview"
                );

            if (!preview) return;

            preview.innerHTML = "";

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                showToast(
                    "Please select an image file."
                );

                this.value = "";

                return;
            }

            if (file.size > 5 * 1024 * 1024) {

                showToast(
                    "Please choose an image smaller than 5 MB."
                );

                this.value = "";

                return;
            }

            const image =
                document.createElement("img");

            image.alt =
                "Waste issue photo preview";

            image.src =
                URL.createObjectURL(file);

            preview.appendChild(image);
        }
    );
}


// ==========================================
// TRACK COMPLAINTS
// ==========================================

function renderComplaints() {

    const searchElement =
        document.getElementById(
            "complaintSearch"
        );

    const filterElement =
        document.getElementById(
            "complaintFilter"
        );

    const search =
        (
            searchElement
                ? searchElement.value
                : ""
        ).toLowerCase();

    const filter =
        filterElement
            ? filterElement.value
            : "All";

    const filteredReports =
        reports.filter(report => {

            const searchable = [
                report.id,
                report.type,
                report.location,
                report.description
            ].join(" ").toLowerCase();

            const matchesSearch =
                searchable.includes(search);

            const matchesStatus =
                filter === "All" ||
                report.status === filter;

            return matchesSearch &&
                matchesStatus;
        });

    const container =
        document.getElementById(
            "complaintList"
        );

    if (!container) return;

    if (!filteredReports.length) {

        container.innerHTML = `
            <div class="empty-state">

                <div
                    style="
                        font-size:30px;
                        margin-bottom:8px
                    "
                >
                    📋
                </div>

                <strong>
                    No matching complaints
                </strong>

                <p>
                    Try another search or submit a new report.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML =
        filteredReports.map(report => `
            <article class="complaint-card">

                <div class="report-row-icon">
                    <i
                        data-lucide="${statusIcon(report.type)}"
                    ></i>
                </div>

                <div class="complaint-main">

                    <h3>
                        ${escapeHTML(report.type)}
                    </h3>

                    <p>
                        ${escapeHTML(report.description)}
                    </p>

                    <div class="complaint-meta">

                        <span>
                            ID:
                            ${escapeHTML(report.id)}
                        </span>

                        <span>
                            📍
                            ${escapeHTML(report.location)}
                        </span>

                        <span>
                            ${formatDate(report.createdAt)}
                        </span>

                        <span>
                            Urgency:
                            ${escapeHTML(
                                report.priority || "Normal"
                            )}
                        </span>

                    </div>

                </div>

                <div class="complaint-controls">

                    <span
                        class="status-badge
                        ${statusClass(report.status)}"
                    >
                        ${escapeHTML(report.status)}
                    </span>

                    <select
                        aria-label="Update demo status"
                        onchange="
                            updateReportStatus(
                                '${report.id}',
                                this.value
                            )
                        "
                    >
                        <option
                            value="Submitted"
                            ${
                                report.status === "Submitted"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Submitted
                        </option>

                        <option
                            value="In Progress"
                            ${
                                report.status === "In Progress"
                                    ? "selected"
                                    : ""
                            }
                        >
                            In Progress
                        </option>

                        <option
                            value="Resolved"
                            ${
                                report.status === "Resolved"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Resolved
                        </option>

                    </select>

                    <button
                        class="delete-button"
                        onclick="
                            deleteReport(
                                '${report.id}'
                            )
                        "
                    >
                        Delete
                    </button>

                </div>

            </article>
        `).join("");

    refreshIcons();
}


const complaintSearch =
    document.getElementById(
        "complaintSearch"
    );

if (complaintSearch) {
    complaintSearch.addEventListener(
        "input",
        renderComplaints
    );
}


const complaintFilter =
    document.getElementById(
        "complaintFilter"
    );

if (complaintFilter) {
    complaintFilter.addEventListener(
        "change",
        renderComplaints
    );
}


function updateReportStatus(id, status) {

    const report =
        reports.find(
            item => item.id === id
        );

    if (!report) return;

    report.status = status;

    saveData(
        "binbuddy_reports",
        reports
    );

    renderHome();
    renderComplaints();
    renderAnalytics();

    showToast(
        "Demo complaint status updated."
    );
}


function deleteReport(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this report from this browser?"
    );

    if (!confirmed) return;

    reports = reports.filter(
        report => report.id !== id
    );

    saveData(
        "binbuddy_reports",
        reports
    );

    renderHome();
    renderComplaints();
    renderAnalytics();

    showToast("Report deleted.");
}


// ==========================================
// AI WASTE SCANNER - REAL AI INTEGRATION
// ==========================================

const wasteImageInput =
    document.getElementById("wasteImage");


if (wasteImageInput) {

    wasteImageInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            const preview =
                document.getElementById(
                    "wasteImagePreview"
                );

            if (!preview) return;

            preview.innerHTML = "";

            if (!file) return;

            // Check if the selected file is an image
            if (!file.type.startsWith("image/")) {

                showToast(
                    "Please choose an image file."
                );

                this.value = "";

                return;
            }

            // Limit image size to 5 MB
            if (file.size > 5 * 1024 * 1024) {

                showToast(
                    "Please choose an image smaller than 5 MB."
                );

                this.value = "";

                return;
            }

            // Show image preview
            const image =
                document.createElement("img");

            image.src =
                URL.createObjectURL(file);

            image.alt =
                "Selected waste item";

            preview.appendChild(image);

            showToast(
                "Image selected! Click Scan Waste to classify it."
            );
        }
    );
}


// ==========================================
// SEND IMAGE TO FLASK AI BACKEND
// ==========================================

async function scanWaste() {

    const fileInput =
        document.getElementById(
            "wasteImage"
        );

    const resultContainer =
        document.getElementById(
            "classificationResult"
        );

    if (!fileInput || !resultContainer) {
        return;
    }

    const file =
        fileInput.files[0];

    // Check if an image was selected
    if (!file) {

        showToast(
            "Please select a waste image first."
        );

        return;
    }

    // Show loading message
    resultContainer.innerHTML = `
        <div class="scanner-loading">

            <div style="font-size:45px;">
                🤖
            </div>

            <h3>
                BinBuddy AI is analysing your waste...
            </h3>

            <p>
                Please wait a moment.
            </p>

        </div>
    `;

    try {

        // Create form data
        const formData =
            new FormData();

        formData.append(
            "image",
            file
        );

        // Send image to Flask backend
        const response =
            await fetch("/predict", {
                method: "POST",
                body: formData
            });

        // Get JSON response
        const data =
            await response.json();

        // Check for errors
        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to classify the image."
            );
        }

        // Get AI result
        const category =
            data.category ||
            "Unknown Waste";

        const confidence =
            data.confidence || 0;

        const emoji =
            data.emoji || "♻️";

        const disposal =
            data.disposal ||
            "Please follow your local waste disposal guidelines.";

        // Display AI result
        resultContainer.innerHTML = `

            <div class="empty-illustration">
                ${emoji}
            </div>

            <h3>
                AI Classification Result
            </h3>

            <span class="category-result">
                ${escapeHTML(category)}
            </span>

            <div class="sorting-details">

                <strong>
                    🤖 AI Confidence
                </strong>

                <p>
                    ${confidence}%
                </p>

                <strong>
                    ♻ Recommended Disposal
                </strong>

                <p>
                    ${escapeHTML(disposal)}
                </p>

            </div>
        `;

        showToast(
            "Waste classified successfully! 🌿"
        );

    } catch (error) {

        console.error(
            "Scanner error:",
            error
        );

        resultContainer.innerHTML = `

            <div class="empty-state">

                <div style="font-size:35px;">
                    ⚠️
                </div>

                <strong>
                    Scanner Error
                </strong>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

        showToast(
            "Unable to connect to the AI scanner."
        );
    }
}


// ==========================================
// BINBUDDY CHATBOT
// ==========================================

function getBotResponse(question) {

    const q =
        question.toLowerCase().trim();

    if (/^(hi|hello|hey|hii)\b/.test(q)) {

        return "Hi! 🌿 I'm BinBuddy. Ask me about recycling, waste segregation, composting, e-waste or reducing waste at home.";
    }

    if (
        q.includes("segregat") ||
        q.includes("separate waste") ||
        q.includes("separate garbage") ||
        q.includes("waste categories")
    ) {

        return "A useful starting point is to separate waste into:\n\n1. Wet or organic waste: food scraps and vegetable peels.\n2. Dry recyclables: clean paper, cardboard, accepted plastics and metals.\n3. Domestic hazardous waste: batteries, chemicals and certain lamps.\n4. E-waste: phones, chargers and electronic devices.";
    }

    if (
        q.includes("battery") ||
        q.includes("cell disposal")
    ) {

        return "Keep used batteries out of ordinary household waste. Store them safely and take them to an authorised battery collection point.";
    }

    if (
        q.includes("e-waste") ||
        q.includes("electronic") ||
        q.includes("old phone") ||
        q.includes("charger")
    ) {

        return "Old phones, chargers, computers and other electronics should go to an authorised e-waste collection centre or approved take-back programme.";
    }

    if (
        q.includes("plastic") ||
        q.includes("plastic bottle") ||
        q.includes("plastic bag")
    ) {

        return "Reduce single-use plastic by carrying a reusable bottle and bag. For recycling, empty containers and keep accepted items reasonably clean.";
    }

    if (
        q.includes("compost") ||
        q.includes("food scrap") ||
        q.includes("banana peel") ||
        q.includes("vegetable peel")
    ) {

        return "Composting can turn suitable fruit and vegetable scraps into useful soil material. Keep scraps separate and use a compost bin or service.";
    }

    if (q.includes("glass")) {

        return "Empty and rinse glass containers if your local service accepts them. Keep broken glass safely wrapped according to local rules.";
    }

    if (
        q.includes("paper") ||
        q.includes("cardboard")
    ) {

        return "Keep recyclable paper and cardboard dry and reasonably clean. Flatten boxes to save space.";
    }

    if (
        q.includes("reduce waste") ||
        q.includes("zero waste") ||
        q.includes("less waste") ||
        q.includes("sustainable")
    ) {

        return "Try these everyday habits:\n\n• Carry a reusable water bottle and shopping bag.\n• Plan meals to prevent food waste.\n• Reuse containers when safe.\n• Choose products with less packaging.\n• Repair or donate usable items.\n• Sort recyclables correctly.";
    }

    if (
        q.includes("bin full") ||
        q.includes("overflowing") ||
        q.includes("missed collection") ||
        q.includes("garbage not collected")
    ) {

        return "If a public bin is overflowing or a collection was missed, use BinBuddy's Report Waste page. Add the nearest landmark and describe the issue clearly.";
    }

    if (
        q.includes("report") ||
        q.includes("complaint") ||
        q.includes("track issue")
    ) {

        return "To record a waste issue, open Report Waste, select the issue type, enter a location and describe the problem. Submit the form to receive a report ID.";
    }

    if (
        q.includes("organic") ||
        q.includes("wet waste")
    ) {

        return "Wet waste commonly includes suitable food scraps and other biodegradable kitchen waste. Keep it separate from dry waste.";
    }

    if (
        q.includes("dry waste") ||
        q.includes("recycl")
    ) {

        return "Dry waste may include clean paper, cardboard, accepted plastics and metals. Keep recyclable items clean and dry.";
    }

    if (
        q.includes("hazard") ||
        q.includes("chemical") ||
        q.includes("paint") ||
        q.includes("pesticide")
    ) {

        return "Some household products such as chemicals, paints and pesticides need special disposal. Do not mix them with regular household waste.";
    }

    if (
        q.includes("iot") ||
        q.includes("sensor") ||
        q.includes("smart bin") ||
        q.includes("fill level")
    ) {

        return "A basic smart-bin setup can use an ultrasonic sensor connected to an ESP32 or ESP8266. BinBuddy currently shows a simulated fill level.";
    }

    if (
        q.includes("energy") ||
        q.includes("calculator") ||
        q.includes("footprint")
    ) {

        return "Open Impact Calculator and enter the estimated kilograms of waste you generate weekly to see your estimated waste totals.";
    }

    if (q.includes("thank")) {

        return "You're welcome! 🌱 Every useful habit helps. Ask me whenever you need guidance on waste sorting.";
    }

    return "I can help with household waste segregation, recycling, composting, e-waste, reducing waste and reporting waste issues. Try asking a specific question! 🌿";
}


function appendMessage(message, sender) {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;

    const row =
        document.createElement("div");

    row.className =
        "message " +
        (
            sender === "user"
                ? "user-message"
                : "bot-message"
        );

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        sender === "user"
            ? "You"
            : "♻";

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    const content =
        document.createElement("p");

    content.textContent = message;

    bubble.appendChild(content);

    row.appendChild(avatar);
    row.appendChild(bubble);

    container.appendChild(row);

    container.scrollTop =
        container.scrollHeight;
}


const chatForm =
    document.getElementById("chatForm");


if (chatForm) {

    chatForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const input =
                document.getElementById(
                    "chatInput"
                );

            const question =
                input.value.trim();

            if (!question) return;

            appendMessage(
                question,
                "user"
            );

            input.value = "";

            const answer =
                getBotResponse(question);

            setTimeout(() => {

                appendMessage(
                    answer,
                    "bot"
                );

            }, 250);
        }
    );
}


function askSuggestion(question) {

    const chatInput =
        document.getElementById(
            "chatInput"
        );

    if (!chatInput || !chatForm) return;

    chatInput.value = question;

    chatForm.dispatchEvent(
        new Event(
            "submit",
            {
                cancelable: true
            }
        )
    );
}


function clearChat() {

    const container =
        document.getElementById(
            "chatMessages"
        );

    if (!container) return;

    container.innerHTML = `
        <div class="message bot-message">

            <div class="message-avatar">
                ♻
            </div>

            <div class="message-bubble">

                <strong>
                    Welcome back!
                </strong>

                <p>
                    What would you like to know about
                    waste management today?
                </p>

            </div>

        </div>
    `;

    showToast(
        "Conversation cleared."
    );
}


// ==========================================
// WASTE IMPACT CALCULATOR
// ==========================================

const wasteInputs = [
    {
        input: "organicWaste",
        output: "organicValue"
    },
    {
        input: "plasticWaste",
        output: "plasticValue"
    },
    {
        input: "paperWaste",
        output: "paperValue"
    },
    {
        input: "otherWaste",
        output: "otherValue"
    }
];


wasteInputs.forEach(item => {

    const input =
        document.getElementById(
            item.input
        );

    const output =
        document.getElementById(
            item.output
        );

    if (!input || !output) return;

    input.addEventListener(
        "input",
        function () {

            output.textContent =
                this.value;

            calculateImpact();
        }
    );
});


const calculatorForm =
    document.getElementById(
        "calculatorForm"
    );


if (calculatorForm) {

    calculatorForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            calculateImpact();

            showToast(
                "Your waste estimate has been updated."
            );
        }
    );
}


function calculateImpact() {

    const organicElement =
        document.getElementById(
            "organicWaste"
        );

    if (!organicElement) return;

    const organic =
        Number(organicElement.value);

    const plastic =
        Number(
            document.getElementById(
                "plasticWaste"
            ).value
        );

    const paper =
        Number(
            document.getElementById(
                "paperWaste"
            ).value
        );

    const other =
        Number(
            document.getElementById(
                "otherWaste"
            ).value
        );

    const weekly =
        organic +
        plastic +
        paper +
        other;

    document.getElementById(
        "weeklyTotal"
    ).textContent =
        weekly.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 1
            }
        );

    document.getElementById(
        "monthlyTotal"
    ).textContent =
        (weekly * 4.345).toFixed(1) +
        " kg";

    document.getElementById(
        "yearlyTotal"
    ).textContent =
        (weekly * 52).toFixed(1) +
        " kg";

    document.getElementById(
        "reductionTotal"
    ).textContent =
        (weekly * 0.2).toFixed(1) +
        " kg/week";

    let insight;

    if (weekly === 0) {

        insight =
            "Your estimate is zero. Check that your quantities reflect your actual household waste.";

    } else if (
        organic >= plastic &&
        organic >= paper &&
        organic >= other
    ) {

        insight =
            "Food and garden waste is your largest category. Meal planning and composting may help reduce waste.";

    } else if (
        plastic >= paper &&
        plastic >= other
    ) {

        insight =
            "Plastic is your largest selected category. Consider reusable alternatives.";

    } else if (paper >= other) {

        insight =
            "Paper is a major part of your estimate. Reuse clean paper and keep cardboard dry.";

    } else {

        insight =
            "Mixed waste is your largest category. Sorting recyclables and special waste separately may help reduce it.";
    }

    document.getElementById(
        "calculatorInsight"
    ).textContent =
        insight;
}


// ==========================================
// PROGRESS AND REPORT EXPORT
// ==========================================

function renderAnalytics() {

    const total = reports.length;

    const submitted =
        reports.filter(
            r => r.status === "Submitted"
        ).length;

    const inProgress =
        reports.filter(
            r => r.status === "In Progress"
        ).length;

    const resolved =
        reports.filter(
            r => r.status === "Resolved"
        ).length;

    const reportTotal =
        document.getElementById(
            "reportTotal"
        );

    if (!reportTotal) return;

    reportTotal.textContent = total;

    document.getElementById(
        "reportSubmitted"
    ).textContent = submitted;

    document.getElementById(
        "reportInProgress"
    ).textContent = inProgress;

    document.getElementById(
        "reportResolved"
    ).textContent = resolved;

    const statuses = [
        {
            name: "Submitted",
            count: submitted
        },
        {
            name: "In Progress",
            count: inProgress
        },
        {
            name: "Resolved",
            count: resolved
        }
    ];

    const chart =
        document.getElementById(
            "statusChart"
        );

    if (!chart) return;

    chart.innerHTML =
        statuses.map(status => {

            const percent =
                total
                    ? (status.count / total) * 100
                    : 0;

            return `
                <div class="chart-row">

                    <span class="chart-label">
                        ${status.name}
                    </span>

                    <div class="chart-track">

                        <div
                            class="chart-bar"
                            style="
                                width:${percent}%
                            "
                        ></div>

                    </div>

                    <span class="chart-count">
                        ${status.count}
                    </span>

                </div>
            `;

        }).join("");
}


function exportReports() {

    if (!reports.length) {

        showToast(
            "There are no reports to export yet."
        );

        return;
    }

    const columns = [
        "Report ID",
        "Issue Type",
        "Location",
        "Description",
        "Priority",
        "Status",
        "Created Date"
    ];

    function csvCell(value) {

        let text =
            String(value ?? "");

        if (
            /^[\s]*[=+\-@]/.test(text)
        ) {
            text = "'" + text;
        }

        return '"' +
            text.replace(
                /"/g,
                '""'
            ) +
            '"';
    }

    const rows =
        reports.map(report => [
            report.id,
            report.type,
            report.location,
            report.description,
            report.priority || "Normal",
            report.status,
            formatDate(report.createdAt)
        ]);

    const csv =
        [columns, ...rows]
            .map(row =>
                row.map(csvCell).join(",")
            )
            .join("\r\n");

    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "binbuddy-reports.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast(
        "Your CSV report has been exported."
    );
}


// ==========================================
// COMMUNITY CHALLENGES
// ==========================================

const challenges = [

    {
        day: "DAY 01",
        title: "Carry a reusable bottle",
        description:
            "Use a refillable bottle instead of buying a single-use bottle."
    },

    {
        day: "DAY 02",
        title: "Separate wet and dry waste",
        description:
            "Set aside food scraps separately from clean recyclables."
    },

    {
        day: "DAY 03",
        title: "Avoid unnecessary packaging",
        description:
            "Choose a reusable or lower-packaging option where practical."
    },

    {
        day: "DAY 04",
        title: "Reuse an everyday item",
        description:
            "Give a clean container, bag or other suitable item another use."
    },

    {
        day: "DAY 05",
        title: "Prevent food waste",
        description:
            "Plan a meal using food you already have at home."
    },

    {
        day: "DAY 06",
        title: "Find an e-waste collection point",
        description:
            "Learn where batteries and old electronics can be handed in safely."
    },

    {
        day: "DAY 07",
        title: "Share a green habit",
        description:
            "Encourage a friend or family member to try one useful waste-reduction habit."
    }
];


function renderChallenges() {

    const grid =
        document.getElementById(
            "challengeGrid"
        );

    if (!grid) return;

    grid.innerHTML =
        challenges.map(
            (challenge, index) => {

                const checked =
                    completedChallenges.includes(
                        index
                    );

                return `
                    <label
                        class="
                            challenge-card
                            ${checked ? "completed" : ""}
                        "
                    >

                        <input
                            class="challenge-check"
                            type="checkbox"
                            ${checked ? "checked" : ""}
                            onchange="
                                toggleChallenge(
                                    ${index},
                                    this.checked
                                )
                            "
                        >

                        <div>

                            <span class="challenge-day">
                                ${challenge.day}
                            </span>

                            <strong>
                                ${challenge.title}
                            </strong>

                            <p>
                                ${challenge.description}
                            </p>

                        </div>

                    </label>
                `;
            }
        ).join("");

    const completed =
        completedChallenges.length;

    const progress =
        document.getElementById(
            "challengeProgress"
        );

    if (progress) {

        progress.textContent =
            completed +
            " of " +
            challenges.length +
            " completed";
    }

    const statTips =
        document.getElementById(
            "statTips"
        );

    if (statTips) {
        statTips.textContent = completed;
    }
}


function toggleChallenge(
    index,
    checked
) {

    if (
        checked &&
        !completedChallenges.includes(index)
    ) {

        completedChallenges.push(index);
    }

    if (!checked) {

        completedChallenges =
            completedChallenges.filter(
                item => item !== index
            );
    }

    saveData(
        "binbuddy_challenges",
        completedChallenges
    );

    renderChallenges();
    renderHome();

    showToast(
        checked
            ? "Nice work! Green challenge completed."
            : "Challenge marked as incomplete."
    );
}


// ==========================================
// DAILY GREEN TIPS
// ==========================================

const dailyTips = [

    {
        category: "KITCHEN & COMPOSTING",
        emoji: "🥬",
        title: "Give food scraps a second life",
        text:
            "Keep fruit and vegetable scraps separate from dry recyclables. Compost them where possible."
    },

    {
        category: "SMART SHOPPING",
        emoji: "🛍️",
        title: "Bring your reusable bag",
        text:
            "Keep a reusable bag near your everyday essentials so you are ready when shopping."
    },

    {
        category: "RECYCLING",
        emoji: "📦",
        title: "Keep cardboard clean and dry",
        text:
            "Flatten clean cardboard boxes and keep them dry before recycling."
    },

    {
        category: "E-WASTE SAFETY",
        emoji: "🔋",
        title: "Never put batteries in regular bins",
        text:
            "Keep used batteries separate and take them to an authorised collection point."
    },

    {
        category: "EVERYDAY HABITS",
        emoji: "🥤",
        title: "Refill instead of replacing",
        text:
            "When practical, use a refillable water bottle and a reusable cup."
    },

    {
        category: "FOOD WASTE",
        emoji: "🥕",
        title: "Plan before you shop",
        text:
            "Check your fridge and plan meals before shopping to avoid food waste."
    }
];


let tipIndex =
    new Date().getDate() %
    dailyTips.length;


function displayTip() {

    const tip =
        dailyTips[tipIndex];

    const category =
        document.querySelector(
            ".tip-category"
        );

    const illustration =
        document.querySelector(
            ".tip-illustration"
        );

    const title =
        document.getElementById(
            "dailyTipTitle"
        );

    const text =
        document.getElementById(
            "dailyTipText"
        );

    if (category) {
        category.textContent =
            tip.category;
    }

    if (illustration) {
        illustration.textContent =
            tip.emoji;
    }

    if (title) {
        title.textContent =
            tip.title;
    }

    if (text) {
        text.textContent =
            tip.text;
    }
}


function nextTip() {

    tipIndex =
        (tipIndex + 1) %
        dailyTips.length;

    displayTip();
}


// ==========================================
// BASIC IoT SMART-BIN DEMONSTRATION
// ==========================================

// Simulates readings. No physical sensor is connected.

function simulateSensor() {

    const fill =
        Math.floor(
            Math.random() * 101
        );

    const sensorPercent =
        document.getElementById(
            "sensorPercent"
        );

    const sensorProgress =
        document.getElementById(
            "sensorProgress"
        );

    const sensorStatus =
        document.getElementById(
            "sensorStatusText"
        );

    if (!sensorPercent ||
        !sensorProgress ||
        !sensorStatus) {
        return;
    }

    sensorPercent.textContent =
        fill + "%";

    sensorProgress.style.width =
        fill + "%";

    let status;

    if (fill >= 85) {

        status =
            "High fill level — collection may be needed";

    } else if (fill >= 60) {

        status =
            "Bin is getting full";

    } else if (fill >= 30) {

        status =
            "Moderate fill level";

    } else {

        status =
            "Bin has plenty of space";
    }

    sensorStatus.textContent =
        status;

    if (fill >= 85) {

        sensorProgress.style.background =
            "#d66e5e";

    } else if (fill >= 60) {

        sensorProgress.style.background =
            "#d9a452";

    } else {

        sensorProgress.style.background =
            "linear-gradient(90deg,#82ad70,#3c7b4b)";
    }

    showToast(
        "Demo sensor reading refreshed: " +
        fill +
        "%."
    );
}


// ==========================================
// BINBUDDY QUIZ - 14 QUESTIONS / 2 PAGES
// ==========================================

function showQuizPage2() {

    document.getElementById(
        "quizPage1"
    ).style.display = "none";

    document.getElementById(
        "quizPage2"
    ).style.display = "block";

    document.getElementById(
        "quizPageText"
    ).textContent =
        "Page 2 of 2 • Questions 8–14";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showQuizPage1() {

    document.getElementById(
        "quizPage2"
    ).style.display = "none";

    document.getElementById(
        "quizPage1"
    ).style.display = "block";

    document.getElementById(
        "quizPageText"
    ).textContent =
        "Page 1 of 2 • Questions 1–7";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function submitQuiz() {

    let score = 0;

    const totalQuestions = 14;

    // Check all answers
    for (
        let i = 1;
        i <= totalQuestions;
        i++
    ) {

        const selected =
            document.querySelector(
                `input[name="q${i}"]:checked`
            );

        if (
            selected &&
            selected.value === "1"
        ) {
            score++;
        }
    }

    // Hide quiz pages
    document.getElementById(
        "quizPage1"
    ).style.display = "none";

    document.getElementById(
        "quizPage2"
    ).style.display = "none";

    // Show result
    document.getElementById(
        "quizResult"
    ).style.display = "block";

    document.getElementById(
        "quizPageText"
    ).textContent =
        "Quiz Completed";

    document.getElementById(
        "quizScore"
    ).textContent = score;

    document.getElementById(
        "finalQuizScore"
    ).textContent = score;

    let message;

    if (score === 14) {

        message =
            "🌟 Perfect score! You are a true BinBuddy waste management expert!";

    } else if (score >= 10) {

        message =
            "🌿 Excellent work! You have great knowledge about waste management.";

    } else if (score >= 7) {

        message =
            "♻️ Good job! Keep learning and practising sustainable habits.";

    } else {

        message =
            "🌱 Good try! Explore BinBuddy and take the quiz again to improve your score.";
    }

    document.getElementById(
        "quizResultMessage"
    ).textContent =
        message;

    showToast(
        "Quiz completed! Your score is " +
        score +
        " out of 14."
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function restartQuiz() {

    // Clear all selected answers
    const answers =
        document.querySelectorAll(
            '.quiz-page input[type="radio"]'
        );

    answers.forEach(answer => {
        answer.checked = false;
    });

    // Reset score
    document.getElementById(
        "quizScore"
    ).textContent = "0";

    // Hide result and page 2
    document.getElementById(
        "quizResult"
    ).style.display = "none";

    document.getElementById(
        "quizPage2"
    ).style.display = "none";

    // Show page 1
    document.getElementById(
        "quizPage1"
    ).style.display = "block";

    document.getElementById(
        "quizPageText"
    ).textContent =
        "Page 1 of 2 • Questions 1–7";

    showToast(
        "Quiz restarted. Good luck! 🌿"
    );
}


// ==========================================
// LIVE LOCATION INTEGRATION
// ==========================================

function getUserLocation() {

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );

    const locationInput =
        document.getElementById(
            "issueLocation"
        );

    // Check if the browser supports location
    if (!navigator.geolocation) {

        if (locationStatus) {

            locationStatus.textContent =
                "Geolocation is not supported by your browser.";
        }

        return;
    }

    // Show message while location is being fetched
    if (locationStatus) {

        locationStatus.textContent =
            "📍 Getting your current location...";
    }

    navigator.geolocation.getCurrentPosition(

        // SUCCESS
        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            // Store coordinates
            const latitudeInput =
                document.getElementById(
                    "latitude"
                );

            const longitudeInput =
                document.getElementById(
                    "longitude"
                );

            if (latitudeInput) {
                latitudeInput.value =
                    latitude;
            }

            if (longitudeInput) {
                longitudeInput.value =
                    longitude;
            }

            // Show coordinates in location field
            if (locationInput) {

                locationInput.value =
                    `Current Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }

            if (locationStatus) {

                locationStatus.textContent =
                    "✓ Live location added successfully!";
            }
        },


        // ERROR
        function (error) {

            let message =
                "Unable to get your location.";

            if (error.code === 1) {

                message =
                    "Location permission was denied. Please allow location access.";

            } else if (error.code === 2) {

                message =
                    "Location information is unavailable.";

            } else if (error.code === 3) {

                message =
                    "Location request timed out. Please try again.";
            }

            if (locationStatus) {

                locationStatus.textContent =
                    message;
            }
        },


        // LOCATION SETTINGS
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


// ==========================================
// INITIALIZE DASHBOARD
// ==========================================

function initializeDashboard() {

    updateDate();
    displayTip();
    renderHome();
    renderComplaints();
    renderAnalytics();
    renderChallenges();
    calculateImpact();
    refreshIcons();
}


initializeDashboard();
// ==========================================
// AI IMAGE CLASSIFICATION - FLASK CONNECTION
// ==========================================
async function scanWasteImage() {
    const imageInput = document.getElementById("wasteImage");
    const resultBox = document.getElementById("classificationResult");

    // Check whether an image was selected
    if (!imageInput.files || imageInput.files.length === 0) {
        resultBox.innerHTML = `
            <div class="empty-illustration">⚠️</div>
            <h3>Please select an image first</h3>
            <p>Choose a waste item image and then click Scan Waste with AI.</p>
        `;
        return;
    }

    // Show loading message
    resultBox.innerHTML = `
        <div class="empty-illustration">🤖</div>
        <h3>BinBuddy AI is scanning...</h3>
        <p>Please wait while we identify and classify your waste item.</p>
    `;

    // Prepare the image to send to Flask
    const formData = new FormData();
    formData.append("image", imageInput.files[0]);

    try {
        const response = await fetch("/predict", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // Check for an error from Flask
        if (!response.ok || data.error) {
            throw new Error(data.error || "Unable to scan the image.");
        }

        // Display the AI prediction AND waste segregation result
        resultBox.innerHTML = `
            <div class="classification-icon">${data.icon || "♻️"}</div>

            <h3>AI Scan Complete!</h3>

            <div class="result-item">
                <strong>🤖 Detected Item:</strong>
                <span>${data.item}</span>
            </div>

            <div class="result-item">
                <strong>♻️ Waste Category:</strong>
                <span>${data.category || "Other / General Waste"}</span>
            </div>

            <div class="result-item">
                <strong>🗑️ Recommended Disposal:</strong>
                <span>${data.bin || "Check local disposal guidelines"}</span>
            </div>

            <div class="result-item">
                <strong>📊 AI Confidence:</strong>
                <span>${data.confidence}%</span>
            </div>
        `;

    } catch (error) {
        resultBox.innerHTML = `
            <div class="empty-illustration">❌</div>
            <h3>Scanning failed</h3>
            <p>${error.message}</p>
        `;
    }
}
// ==========================================
// AI WASTE SCANNER
// ==========================================

// Preview the selected image
document.addEventListener("DOMContentLoaded", function () {

    const wasteImage = document.getElementById("wasteImage");

    if (wasteImage) {
        wasteImage.addEventListener("change", function () {

            const file = this.files[0];
            const preview = document.getElementById("wasteImagePreview");

            if (!file) return;

            // Show the selected image
            const reader = new FileReader();

            reader.onload = function (event) {
                preview.innerHTML = `
                    <img src="${event.target.result}" 
                         alt="Selected waste image"
                         style="max-width: 100%; max-height: 250px; border-radius: 12px; margin-top: 20px;">
                `;
            };

            reader.readAsDataURL(file);
        });
    }

});
function classifyWaste(item) {

    const resultBox = document.getElementById("classificationResult");

    const categories = {
        "Plastic bottle": {
            type: "Dry Waste ♻️",
            advice: "Place clean and empty plastic bottles in the dry waste or recycling bin."
        },
        "Banana peel": {
            type: "Wet / Organic Waste 🍌",
            advice: "Place it in the wet waste bin or compost it."
        },
        "Paper": {
            type: "Dry Waste 📄",
            advice: "Keep paper clean and dry for recycling."
        },
        "Battery": {
            type: "Hazardous Waste 🔋",
            advice: "Do not put batteries in regular bins. Use an authorised collection point."
        },
        "Glass jar": {
            type: "Dry Waste 🫙",
            advice: "Clean the glass jar and place it in the appropriate recycling collection."
        },
        "Food leftovers": {
            type: "Wet / Organic Waste 🥗",
            advice: "Place food waste in the wet waste bin or compost it."
        },
        "Aluminium can": {
            type: "Dry Waste 🥫",
            advice: "Clean the can before placing it in dry waste for recycling."
        },
        "Old phone": {
            type: "E-Waste 📱",
            advice: "Take old electronic devices to an authorised e-waste collection centre."
        }
    };

    const result = categories[item];

    if (result) {
        resultBox.innerHTML = `
            <div class="empty-illustration">♻️</div>
            <h3>${item}</h3>
            <p><strong>Category: ${result.type}</strong></p>
            <p>${result.advice}</p>
        `;
    }
}