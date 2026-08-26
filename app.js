/* =====================================
   QUIZFORGE APPLICATION
===================================== */


/* =====================================
   STATE
===================================== */

let currentQuiz =
    createBlankQuiz();

let playingQuiz = null;

let currentQuestion = 0;

let score = 0;

let localQuizzes = [];

let user = {

    loggedIn: false,

    email: "",

    username: "Guest",

    coins: 100,

    badges: [],

    skins: ["default"],

    selectedSkin: "default"

};



/* =====================================
   STARTUP
===================================== */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUser();

        loadLocalQuizzes();

        renderLibrary();

        renderMyQuizzes();

        renderShop();

        renderBadges();

        renderAuth();

        updateCoins();

        checkSharedQuiz();

    }
);



/* =====================================
   NAVIGATION
===================================== */

function navigate(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            section =>
                section.classList.remove(
                    "active"
                )
        );


    const target =
        document.getElementById(page);


    if (!target) return;


    target.classList.add("active");


    if (page === "library") {

        renderLibrary();

    }


    if (page === "myquizzes") {

        renderMyQuizzes();

    }


    if (page === "host") {

        renderHostList();

    }


    if (page === "shop") {

        renderShop();

    }


    if (page === "badges") {

        renderBadges();

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



/* =====================================
   NEW QUIZ
===================================== */

function newQuiz() {

    /*
        IMPORTANT:

        This ALWAYS creates a fresh,
        completely blank quiz.

        It NEVER loads the previous quiz.
    */

    currentQuiz =
        createBlankQuiz();


    document.getElementById(
        "quizTitle"
    ).value = "";


    document.getElementById(
        "quizDescription"
    ).value = "";


    document.getElementById(
        "quizCategory"
    ).value = "Other";


    document.getElementById(
        "quizDifficulty"
    ).value = "Medium";


    document.getElementById(
        "questionList"
    ).innerHTML = "";


    updateQuestionCount();


    navigate("create");

}



/* =====================================
   QUESTIONS
===================================== */

function addQuestion(data = null) {

    const list =
        document.getElementById(
            "questionList"
        );


    const number =
        list.children.length + 1;


    const question =
        data || {

            question: "",

            answers: [
                "",
                "",
                "",
                ""
            ],

            correct: 0

        };


    const editor =
        document.createElement("div");


    editor.className =
        "question-editor";


    editor.innerHTML = `

        <div class="question-title">

            <h3>
                Question ${number}
            </h3>

        </div>


        <label>
            Question
        </label>

        <textarea
            class="question-text"
            placeholder="Enter your question..."
        ></textarea>


        <label>
            Answers
        </label>


        <div class="answers">

            ${question.answers.map(
                (answer, index) => `

                <div class="answer-row">

                    <input
                        type="radio"
                        name="correct-${number}"
                        value="${index}"
                        ${
                            question.correct ===
                            index
                                ? "checked"
                                : ""
                        }
                    >

                    <input
                        type="text"
                        class="answer-text"
                        placeholder="Answer ${index + 1}"
                    >

                </div>

            `).join("")}

        </div>


        <button
            class="delete-question"
            onclick="
                this.closest('.question-editor').remove();
                renumberQuestions();
            "
        >
            🗑️ Delete Question
        </button>

    `;


    list.appendChild(editor);


    editor.querySelector(
        ".question-text"
    ).value =
        question.question;


    editor
        .querySelectorAll(".answer-text")
        .forEach(
            (input, index) => {

                input.value =
                    question.answers[
                        index
                    ];

            }
        );


    updateQuestionCount();

}



/* Renumber */

function renumberQuestions() {

    document
        .querySelectorAll(
            ".question-editor"
        )
        .forEach(
            (box, index) => {

                box.querySelector(
                    "h3"
                ).textContent =
                    `Question ${index + 1}`;


                box
                    .querySelectorAll(
                        'input[type="radio"]'
                    )
                    .forEach(
                        radio => {

                            radio.name =
                                `correct-${index + 1}`;

                        }
                    );

            }
        );


    updateQuestionCount();

}


function updateQuestionCount() {

    const count =
        document.querySelectorAll(
            ".question-editor"
        ).length;


    document.getElementById(
        "questionCount"
    ).textContent =
        `${count} question${count === 1 ? "" : "s"}`;

}



/* =====================================
   BUILD QUIZ
===================================== */

function buildQuizFromEditor() {

    const title =
        document.getElementById(
            "quizTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "quizDescription"
        ).value.trim();


    const category =
        document.getElementById(
            "quizCategory"
        ).value;


    const difficulty =
        document.getElementById(
            "quizDifficulty"
        ).value;


    if (!title) {

        alert(
            "Please enter a quiz title."
        );

        return null;
    }


    const editors =
        document.querySelectorAll(
            ".question-editor"
        );


    if (editors.length === 0) {

        alert(
            "Add at least one question."
        );

        return null;
    }


    const questions = [];


    for (
        let i = 0;
        i < editors.length;
        i++
    ) {

        const editor =
            editors[i];


        const questionText =
            editor
                .querySelector(
                    ".question-text"
                )
                .value
                .trim();


        const answers =
            [
                ...editor.querySelectorAll(
                    ".answer-text"
                )
            ]
            .map(
                input =>
                    input.value.trim()
            );


        const correct =
            editor.querySelector(
                'input[type="radio"]:checked'
            );


        if (!questionText) {

            alert(
                `Question ${i + 1} is empty.`
            );

            return null;
        }


        if (
            answers.some(
                answer => !answer
            )
        ) {

            alert(
                `Question ${i + 1} needs four answers.`
            );

            return null;
        }


        if (!correct) {

            alert(
                `Choose the correct answer for question ${i + 1}.`
            );

            return null;
        }


        questions.push({

            type:
                "multiple_choice",

            question:
                questionText,

            answers:
                answers,

            correct:
                Number(
                    correct.value
                )

        });

    }


    return {

        ...currentQuiz,

        title,

        description,

        category,

        difficulty,

        questions,

        updatedAt:
            new Date().toISOString()

    };

}



/* =====================================
   SAVE
===================================== */

function saveCurrentQuiz() {

    const built =
        buildQuizFromEditor();


    if (!built) return;


    currentQuiz =
        built;


    const existing =
        localQuizzes.findIndex(
            quiz =>
                quiz.id ===
                currentQuiz.id
        );


    if (existing >= 0) {

        localQuizzes[
            existing
        ] = currentQuiz;

    }

    else {

        localQuizzes.push(
            currentQuiz
        );

    }


    localStorage.setItem(
        "quizforgeQuizzes",
        JSON.stringify(
            localQuizzes
        )
    );


    alert(
        "💾 Quiz saved to My Quizzes!"
    );


    renderMyQuizzes();

}



/* =====================================
   LOAD QUIZ
===================================== */

function editQuiz(id) {

    const found =
        localQuizzes.find(
            quiz =>
                quiz.id === id
        );


    if (!found) return;


    currentQuiz =
        JSON.parse(
            JSON.stringify(found)
        );


    document.getElementById(
        "quizTitle"
    ).value =
        currentQuiz.title;


    document.getElementById(
        "quizDescription"
    ).value =
        currentQuiz.description || "";


    document.getElementById(
        "quizCategory"
    ).value =
        currentQuiz.category || "Other";


    document.getElementById(
        "quizDifficulty"
    ).value =
        currentQuiz.difficulty || "Medium";


    const list =
        document.getElementById(
            "questionList"
        );


    list.innerHTML = "";


    currentQuiz.questions
        .forEach(
            question =>
                addQuestion(
                    question
                )
        );


    navigate("create");

}



/* =====================================
   DELETE
===================================== */

function deleteQuiz(id) {

    if (
        !confirm(
            "Delete this quiz?"
        )
    ) return;


    localQuizzes =
        localQuizzes.filter(
            quiz =>
                quiz.id !== id
        );


    localStorage.setItem(
        "quizforgeQuizzes",
        JSON.stringify(
            localQuizzes
        )
    );


    renderMyQuizzes();

}



/* =====================================
   DUPLICATE
===================================== */

function duplicateQuiz(id) {

    const original =
        localQuizzes.find(
            quiz =>
                quiz.id === id
        );


    if (!original) return;


    const copy =
        JSON.parse(
            JSON.stringify(
                original
            )
        );


    copy.id =
        crypto.randomUUID();


    copy.title +=
        " Copy";


    copy.createdAt =
        new Date().toISOString();


    localQuizzes.push(copy);


    localStorage.setItem(
        "quizforgeQuizzes",
        JSON.stringify(
            localQuizzes
        )
    );


    renderMyQuizzes();

}



/* =====================================
   EXPORT
===================================== */

function exportCurrentQuiz() {

    const built =
        buildQuizFromEditor();


    if (!built) return;


    currentQuiz =
        built;


    downloadQZ(
        currentQuiz
    );

}



/* =====================================
   IMPORT
===================================== */

async function importQuizFromDevice() {

    const input =
        document.createElement(
            "input"
        );


    input.type = "file";

    input.accept =
        ".qz,application/json";


    input.onchange =
        async event => {

            const file =
                event.target.files[0];


            try {

                const imported =
                    await importQZFile(
                        file
                    );


                localQuizzes.push(
                    imported
                );


                localStorage.setItem(
                    "quizforgeQuizzes",
                    JSON.stringify(
                        localQuizzes
                    )
                );


                alert(
                    "✅ Quiz imported successfully!"
                );


                renderMyQuizzes();


                editQuiz(
                    imported.id
                );

            }

            catch(error) {

                alert(
                    "❌ Import failed:\n\n" +
                    error.message
                );

            }

        };


    input.click();

}



/* =====================================
   SHARE
===================================== */

async function shareCurrentQuiz() {

    const built =
        buildQuizFromEditor();


    if (!built) return;


    currentQuiz =
        built;


    const encoded =
        encodeQuizForURL(
            currentQuiz
        );


    const url =
        window.location.origin +
        window.location.pathname +
        "?quiz=" +
        encoded;


    if (
        navigator.share
    ) {

        try {

            await navigator.share({

                title:
                    currentQuiz.title,

                text:
                    "Play my QuizForge quiz!",

                url:
                    url

            });

            return;

        }

        catch {

            // Sharing cancelled.

        }

    }


    try {

        await navigator.clipboard.writeText(
            url
        );


        alert(
            "🔗 Quiz link copied!"
        );

    }

    catch {

        prompt(
            "Copy this link:",
            url
        );

    }

}



/* =====================================
   URL ENCODING
===================================== */

function encodeQuizForURL(data) {

    const json =
        JSON.stringify(data);


    const bytes =
        new TextEncoder()
            .encode(json);


    let binary = "";


    bytes.forEach(
        byte => {

            binary +=
                String.fromCharCode(
                    byte
                );

        }
    );


    return btoa(binary)

        .replace(
            /\+/g,
            "-"
        )

        .replace(
            /\//g,
            "_"
        )

        .replace(
            /=/g,
            ""
        );

}


function decodeQuizFromURL(encoded) {

    let base64 =
        encoded
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


    while (
        base64.length % 4
    ) {

        base64 += "=";

    }


    const binary =
        atob(base64);


    const bytes =
        Uint8Array.from(
            binary,
            character =>
                character.charCodeAt(0)
        );


    return JSON.parse(
        new TextDecoder()
            .decode(bytes)
    );

}


function checkSharedQuiz() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const encoded =
        params.get("quiz");


    if (!encoded) return;


    try {

        const imported =
            decodeQuizFromURL(
                encoded
            );


        validateQZ(
            imported
        );


        playingQuiz =
            imported;


        navigate("play");

        startPlayingQuiz();

    }

    catch {

        alert(
            "❌ This shared quiz link is invalid."
        );

    }

}



/* =====================================
   PLAY QUIZ
===================================== */

function playCurrentQuiz() {

    const built =
        buildQuizFromEditor();


    if (!built) return;


    currentQuiz =
        built;


    playingQuiz =
        currentQuiz;


    startPlayingQuiz();

}


function playSavedQuiz(id) {

    const found =
        localQuizzes.find(
            quiz =>
                quiz.id === id
        );


    if (!found) return;


    playingQuiz =
        found;


    startPlayingQuiz();

}


function startPlayingQuiz() {

    currentQuestion = 0;

    score = 0;

    navigate("play");

    renderPlayingQuestion();

}



/* =====================================
   QUESTION
===================================== */

function renderPlayingQuestion() {

    const area =
        document.getElementById(
            "playArea"
        );


    const total =
        playingQuiz.questions.length;


    if (
        currentQuestion >= total
    ) {

        showResults();

        return;
    }


    const q =
        playingQuiz.questions[
            currentQuestion
        ];


    const percentage =
        (
            currentQuestion /
            total
        ) * 100;


    area.innerHTML = `

        <div class="card play-card">

            <div class="play-header">

                <h1>
                    ${escapeHTML(
                        playingQuiz.title
                    )}
                </h1>

                <p>
                    Question
                    ${currentQuestion + 1}
                    of
                    ${total}
                </p>

                <div class="progress">

                    <div
                        class="progress-bar"
                        style="width:${percentage}%"
                    ></div>

                </div>

            </div>


            <div class="play-question">

                ${escapeHTML(
                    q.question
                )}

            </div>


            <div>

                ${q.answers.map(
                    (answer, index) => `

                    <button
                        class="answer-button"
                        onclick="
                            answerQuestion(${index})
                        "
                    >
                        ${escapeHTML(
                            answer
                        )}
                    </button>

                `).join("")}

            </div>

        </div>

    `;

}



/* =====================================
   ANSWER
===================================== */

function answerQuestion(index) {

    const q =
        playingQuiz.questions[
            currentQuestion
        ];


    const buttons =
        document.querySelectorAll(
            ".answer-button"
        );


    buttons.forEach(
        button =>
            button.disabled = true
    );


    if (
        index === q.correct
    ) {

        score++;

        buttons[index]
            .classList.add(
                "correct"
            );

    }

    else {

        buttons[index]
            .classList.add(
                "wrong"
            );


        buttons[q.correct]
            .classList.add(
                "correct"
            );

    }


    setTimeout(
        () => {

            currentQuestion++;

            renderPlayingQuestion();

        },
        850
    );

}



/* =====================================
   RESULTS
===================================== */

function showResults() {

    const total =
        playingQuiz.questions.length;


    const percentage =
        Math.round(
            score / total * 100
        );


    let message =
        "Keep practising!";


    if (percentage === 100) {

        message =
            "🏆 PERFECT SCORE!";

    }

    else if (percentage >= 80) {

        message =
            "🔥 Amazing job!";

    }

    else if (percentage >= 60) {

        message =
            "👍 Great work!";

    }


    /*
        Reward coins locally.

        A real online version should
        calculate rewards server-side.
    */

    const reward =
        Math.max(
            5,
            score * 5
        );


    user.coins += reward;


    saveUser();

    updateCoins();


    document.getElementById(
        "playArea"
    ).innerHTML = `

        <div class="card result-screen">

            <div class="large-icon">
                🎉
            </div>

            <h1>
                Quiz Complete!
            </h1>

            <div class="score">
                ${percentage}%
            </div>

            <div class="result-message">
                ${message}
            </div>

            <p>
                You scored
                <strong>
                    ${score}
                </strong>
                /
                <strong>
                    ${total}
                </strong>
            </p>

            <p>
                🪙 +${reward} coins
            </p>

            <br>

            <button
                class="primary"
                onclick="startPlayingQuiz()"
            >
                🔄 Play Again
            </button>

            <button
                class="secondary"
                onclick="navigate('home')"
            >
                🏠 Home
            </button>

        </div>

    `;

}



/* =====================================
   MY QUIZZES
===================================== */

function renderMyQuizzes() {

    const grid =
        document.getElementById(
            "myQuizGrid"
        );


    if (
        localQuizzes.length === 0
    ) {

        grid.innerHTML = `

            <div class="card">

                <h2>
                    No quizzes yet.
                </h2>

                <p>
                    Create your first quiz!
                </p>

                <button
                    class="primary"
                    onclick="newQuiz()"
                >
                    ➕ Create Quiz
                </button>

                <button
                    class="secondary"
                    onclick="importQuizFromDevice()"
                >
                    📥 Import .qz
                </button>

            </div>

        `;

        return;
    }


    grid.innerHTML =
        localQuizzes.map(
            quiz => `

            <div class="quiz-card">

                <h3>
                    ${escapeHTML(
                        quiz.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        quiz.description ||
                        "No description"
                    )}
                </p>

                <div class="quiz-meta">

                    <span class="tag">
                        ${quiz.category}
                    </span>

                    <span class="tag">
                        ${quiz.difficulty}
                    </span>

                    <span class="tag">
                        ${quiz.questions.length}
                        questions
                    </span>

                </div>

                <div class="quiz-buttons">

                    <button
                        class="primary"
                        onclick="
                            playSavedQuiz('${quiz.id}')
                        "
                    >
                        ▶ Play
                    </button>

                    <button
                        class="secondary"
                        onclick="
                            editQuiz('${quiz.id}')
                        "
                    >
                        ✏️ Edit
                    </button>

                    <button
                        class="secondary"
                        onclick="
                            duplicateQuiz('${quiz.id}')
                        "
                    >
                        📋 Copy
                    </button>

                    <button
                        class="secondary"
                        onclick="
                            exportSavedQuiz('${quiz.id}')
                        "
                    >
                        📤
                    </button>

                    <button
                        class="delete-question"
                        onclick="
                            deleteQuiz('${quiz.id}')
                        "
                    >
                        🗑️
                    </button>

                </div>

            </div>

        `
        ).join("");

}



/* =====================================
   LIBRARY
===================================== */

const demoLibrary = [

    {
        id: "demo1",
        title: "Minecraft Challenge",
        description:
            "Can you survive this difficult Minecraft quiz?",
        category: "Minecraft",
        difficulty: "Hard",
        questions: 20,
        plays: 1248,
        creator: "QuizForge"
    },

    {
        id: "demo2",
        title: "Ultimate Maths Challenge",
        description:
            "Test your mathematical skills.",
        category: "Maths",
        difficulty: "Extreme",
        questions: 15,
        plays: 831,
        creator: "MathMaster"
    },

    {
        id: "demo3",
        title: "Space & Science",
        description:
            "How much do you know about space?",
        category: "Science",
        difficulty: "Medium",
        questions: 10,
        plays: 526,
        creator: "GalaxyQuiz"
    }

];


function renderLibrary() {

    const grid =
        document.getElementById(
            "libraryGrid"
        );


    const search =
        (
            document.getElementById(
                "librarySearch"
            )?.value || ""
        ).toLowerCase();


    const category =
        document.getElementById(
            "libraryCategory"
        )?.value || "all";


    const quizzes =
        demoLibrary.filter(
            quiz => {

                const matchesSearch =
                    quiz.title
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    category === "all" ||
                    quiz.category ===
                    category;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (!quizzes.length) {

        grid.innerHTML = `

            <div class="card">

                <h2>
                    No quizzes found.
                </h2>

            </div>

        `;

        return;
    }


    grid.innerHTML =
        quizzes.map(
            quiz => `

            <div class="quiz-card">

                <h3>
                    ${escapeHTML(
                        quiz.title
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        quiz.description
                    )}
                </p>

                <div class="quiz-meta">

                    <span class="tag">
                        ${quiz.category}
                    </span>

                    <span class="tag">
                        ${quiz.difficulty}
                    </span>

                    <span class="tag">
                        👥 ${quiz.plays}
                        plays
                    </span>

                </div>

                <p>
                    👤 ${escapeHTML(
                        quiz.creator
                    )}
                </p>

                <button
                    class="primary"
                    onclick="
                        alert(
                            'Online public quizzes require the QuizForge backend.'
                        )
                    "
                >
                    ▶ Play
                </button>

            </div>

        `
        ).join("");

}



/* =====================================
   HOST
===================================== */

function renderHostList() {

    const area =
        document.getElementById(
            "hostQuizList"
        );


    if (!localQuizzes.length) {

        area.innerHTML = `

            <div class="card">

                <h2>
                    You don't have any quizzes.
                </h2>

                <button
                    class="primary"
                    onclick="newQuiz()"
                >
                    ➕ Create Quiz
                </button>

            </div>

        `;

        return;
    }


    area.innerHTML =
        localQuizzes.map(
            quiz => `

            <div class="quiz-card">

                <h2>
                    ${escapeHTML(
                        quiz.title
                    )}
                </h2>

                <p>
                    ${quiz.questions.length}
                    questions
                </p>

                <button
                    class="primary"
                    onclick="
                        hostQuiz('${quiz.id}')
                    "
                >
                    🎤 Host
                </button>

            </div>

        `
        ).join("");

}


function hostQuiz(id) {

    const quiz =
        localQuizzes.find(
            q => q.id === id
        );


    if (!quiz) return;


    /*
        This creates a local room preview.

        Real multiplayer requires
        a realtime backend.
    */

    const room =
        Math.floor(
            100000 +
            Math.random() *
            900000
        );


    const area =
        document.getElementById(
            "hostQuizList"
        );


    area.innerHTML = `

        <div class="center-card">

            <div class="large-icon">
                🎤
            </div>

            <h1>
                ${escapeHTML(
                    quiz.title
                )}
            </h1>

            <p>
                Room Code
            </p>

            <div class="score">
                ${room}
            </div>

            <p>
                Waiting for players...
            </p>

            <button
                class="primary big"
                onclick="
                    alert(
                        'Connect a realtime backend to enable live multiplayer.'
                    )
                "
            >
                ▶ Start Quiz
            </button>

        </div>

    `;

}



/* =====================================
   JOIN
===================================== */

function joinRoom() {

    const code =
        document.getElementById(
            "roomCode"
        ).value.trim();


    const message =
        document.getElementById(
            "joinMessage"
        );


    if (!code) {

        message.textContent =
            "Enter a room code.";

        return;
    }


    message.textContent =
        "🔄 Looking for room " +
        code +
        "...";


    setTimeout(
        () => {

            message.textContent =
                "⚠️ Online multiplayer needs the QuizForge realtime backend.";

        },
        700
    );

}



/* =====================================
   PUBLISH
===================================== */

function publishQuiz() {

    const built =
        buildQuizFromEditor();


    if (!built) return;


    currentQuiz =
        built;


    /*
        Frontend preview.

        Real public publishing should
        send this to a secure backend.
    */

    alert(
        "🌎 Your quiz is ready to publish!\n\n" +
        "Connect the QuizForge backend to make it appear in the global library."
    );

}



/* =====================================
   SHOP
===================================== */

const skins = [

    {
        id: "default",
        icon: "😀",
        name: "Default",
        price: 0
    },

    {
        id: "creeper",
        icon: "🟩",
        name: "Creeper",
        price: 500
    },

    {
        id: "diamond",
        icon: "💎",
        name: "Diamond",
        price: 1000
    },

    {
        id: "nether",
        icon: "🔥",
        name: "Nether",
        price: 1500
    },

    {
        id: "ender",
        icon: "🟪",
        name: "Enderman",
        price: 2000
    },

    {
        id: "gold",
        icon: "👑",
        name: "Golden",
        price: 3000
    }

];


function renderShop() {

    const grid =
        document.getElementById(
            "shopGrid"
        );


    grid.innerHTML =
        skins.map(
            skin => {

                const owned =
                    user.skins.includes(
                        skin.id
                    );


                return `

                    <div class="shop-item">

                        <div class="skin-preview">
                            ${skin.icon}
                        </div>

                        <h3>
                            ${skin.name}
                        </h3>

                        <div class="price">
                            ${
                                skin.price === 0
                                    ? "FREE"
                                    : "🪙 " +
                                      skin.price
                            }
                        </div>

                        ${
                            owned

                                ? `

                                <button
                                    class="primary"
                                    onclick="
                                        selectSkin('${skin.id}')
                                    "
                                >
                                    ${
                                        user.selectedSkin ===
                                        skin.id
                                            ? "✅ Selected"
                                            : "Use"
                                    }
                                </button>

                                `

                                : `

                                <button
                                    class="secondary"
                                    onclick="
                                        buySkin('${skin.id}')
                                    "
                                >
                                    🛒 Buy
                                </button>

                                `

                        }

                    </div>

                `;

            }
        ).join("");

}


function buySkin(id) {

    const skin =
        skins.find(
            s => s.id === id
        );


    if (!skin) return;


    if (
        user.coins <
        skin.price
    ) {

        alert(
            "You don't have enough coins."
        );

        return;
    }


    user.coins -=
        skin.price;


    user.skins.push(
        id
    );


    saveUser();

    updateCoins();

    renderShop();

}


function selectSkin(id) {

    if (
        !user.skins.includes(id)
    ) return;


    user.selectedSkin =
        id;


    saveUser();

    renderShop();

}



/* =====================================
   BADGES
===================================== */

const badges = [

    {
        id: "first",
        icon: "🎯",
        name: "First Quiz",
        description:
            "Complete your first quiz."
    },

    {
        id: "perfect",
        icon: "🏆",
        name: "Perfect",
        description:
            "Get 100% on a quiz."
    },

    {
        id: "creator",
        icon: "✍️",
        name: "Creator",
        description:
            "Create your first quiz."
    },

    {
        id: "publisher",
        icon: "🌎",
        name: "Publisher",
        description:
            "Publish your first quiz."
    },

    {
        id: "popular",
        icon: "🔥",
        name: "Popular",
        description:
            "Reach 100 quiz plays."
    },

    {
        id: "master",
        icon: "👑",
        name: "Quiz Master",
        description:
            "Earn 10 perfect scores."
    }

];


function renderBadges() {

    const grid =
        document.getElementById(
            "badgeGrid"
        );


    grid.innerHTML =
        badges.map(
            badge => {

                const unlocked =
                    user.badges.includes(
                        badge.id
                    );


                return `

                    <div
                        class="badge
                        ${
                            unlocked
                                ? "unlocked"
                                : ""
                        }"
                    >

                        <div class="badge-icon">
                            ${badge.icon}
                        </div>

                        <h3>
                            ${badge.name}
                        </h3>

                        <p>
                            ${badge.description}
                        </p>

                        <small>
                            ${
                                unlocked
                                    ? "✅ Unlocked"
                                    : "🔒 Locked"
                            }
                        </small>

                    </div>

                `;

            }
        ).join("");

}



/* =====================================
   ACCOUNT
===================================== */

function renderAuth() {

    const area =
        document.getElementById(
            "authArea"
        );


    if (!user.loggedIn) {

        area.innerHTML = `

            <p>
                Log in to sync your quizzes,
                coins and badges online.
            </p>

            <label>Email</label>

            <input
                id="loginEmail"
                type="email"
                placeholder="you@example.com"
            >

            <label>Password</label>

            <input
                id="loginPassword"
                type="password"
                placeholder="Password"
            >

            <button
                class="primary full"
                onclick="login()"
            >
                🔐 Login
            </button>

            <button
                class="secondary full"
                onclick="signup()"
            >
                ✨ Create Account
            </button>

        `;

        return;
    }


    area.innerHTML = `

        <h2>
            Welcome, ${escapeHTML(
                user.username
            )}!
        </h2>

        <p>
            ${escapeHTML(
                user.email
            )}
        </p>

        <p>
            🪙 ${user.coins} coins
        </p>

        <button
            class="primary full"
            onclick="navigate('shop')"
        >
            🛒 Shop
        </button>

        <button
            class="secondary full"
            onclick="navigate('badges')"
        >
            🏅 Badges
        </button>

        <button
            class="delete-question full"
            onclick="logout()"
        >
            🚪 Logout
        </button>

    `;

}


function login() {

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();


    if (!email) {

        alert(
            "Enter your email."
        );

        return;
    }


    /*
        Local demo login.

        Real authentication must be
        handled by a backend.
    */

    user.loggedIn = true;

    user.email = email;

    user.username =
        email.split("@")[0];


    saveUser();

    renderAuth();

    updateAccountButton();

}


function signup() {

    const email =
        document.getElementById(
            "loginEmail"
        )?.value.trim();


    if (!email) {

        alert(
            "Enter your email first."
        );

        return;
    }


    user.loggedIn = true;

    user.email = email;

    user.username =
        email.split("@")[0];


    saveUser();

    renderAuth();

    updateAccountButton();


    alert(
        "🎉 Account created locally!"
    );

}


function logout() {

    user.loggedIn = false;

    user.email = "";

    user.username = "Guest";


    saveUser();

    renderAuth();

    updateAccountButton();

}


function updateAccountButton() {

    document.getElementById(
        "accountButton"
    ).textContent =
        user.loggedIn
            ? "👤 " + user.username
            : "👤 Login";

}



/* =====================================
   COINS
===================================== */

function updateCoins() {

    document.getElementById(
        "coinDisplay"
    ).textContent =
        "🪙 " + user.coins;

}



/* =====================================
   LOCAL STORAGE
===================================== */

function saveUser() {

    localStorage.setItem(
        "quizforgeUser",
        JSON.stringify(
            user
        )
    );

}


function loadUser() {

    const saved =
        localStorage.getItem(
            "quizforgeUser"
        );


    if (!saved) {

        updateAccountButton();

        return;
    }


    try {

        user =
            JSON.parse(saved);

    }

    catch {

        localStorage.removeItem(
            "quizforgeUser"
        );

    }


    updateAccountButton();

}


function loadLocalQuizzes() {

    const saved =
        localStorage.getItem(
            "quizforgeQuizzes"
        );


    if (!saved) {

        localQuizzes = [];

        return;
    }


    try {

        localQuizzes =
            JSON.parse(saved);

    }

    catch {

        localQuizzes = [];

    }

}



/* =====================================
   UTILITIES
===================================== */

function escapeHTML(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



/* =====================================
   EXTERNAL IMPORT BUTTON
===================================== */

document.addEventListener(
    "keydown",
    event => {

        /*
            Ctrl/Cmd + I
            opens QZ importer.
        */

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() === "i"
        ) {

            event.preventDefault();

            importQuizFromDevice();

        }

    }
);

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

/*
    Make the import function available
    globally if you want to add an
    Import button later.
*/

window.importQuizFromDevice =
    importQuizFromDevice;
