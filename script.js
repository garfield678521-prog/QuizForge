let quiz = {

    format: "QZ",

    version: 1,

    title: "",

    description: "",

    questions: []

};


let currentQuestion = 0;

let score = 0;

let quizStarted = false;



/* =========================
   PAGE SYSTEM
========================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(p =>
            p.classList.remove("active")
        );

    document
        .getElementById(page)
        .classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}



/* =========================
   CREATE QUESTIONS
========================= */

function addQuestion(data = null) {

    const list =
        document.getElementById("questionList");

    const number =
        list.children.length + 1;

    const question = data || {

        question: "",

        answers: [
            "",
            "",
            "",
            ""
        ],

        correct: 0
    };


    const box =
        document.createElement("div");

    box.className =
        "question-editor";


    box.innerHTML = `

        <div class="question-header">

            <h3>
                Question ${number}
            </h3>

            <span>
                ${number}
            </span>

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
                (answer, i) => `

                <div class="answer-row">

                    <input
                        type="radio"
                        name="correct-${number}"
                        value="${i}"
                        ${question.correct === i ? "checked" : ""}
                    >

                    <input
                        type="text"
                        class="answer-text"
                        placeholder="Answer ${i + 1}"
                    >

                </div>

            `).join("")}

        </div>


        <button
            class="delete-question"
            onclick="this.closest('.question-editor').remove(); renumberQuestions();"
        >
            🗑️ Delete Question
        </button>

    `;


    list.appendChild(box);


    box.querySelector(".question-text")
        .value = question.question;


    box.querySelectorAll(".answer-text")
        .forEach((input, i) => {

            input.value =
                question.answers[i];

        });
}



/* =========================
   RENUMBER QUESTIONS
========================= */

function renumberQuestions() {

    document
        .querySelectorAll(".question-editor")
        .forEach((box, i) => {

            box.querySelector("h3")
                .textContent =
                `Question ${i + 1}`;

            box.querySelectorAll(
                'input[type="radio"]'
            )
            .forEach(radio => {

                radio.name =
                    `correct-${i + 1}`;

            });

        });
}



/* =========================
   BUILD QUIZ
========================= */

function buildQuiz() {

    const title =
        document.getElementById("quizTitle")
            .value.trim();

    const description =
        document.getElementById("quizDescription")
            .value.trim();


    const questionBoxes =
        document.querySelectorAll(
            ".question-editor"
        );


    if (!title) {

        alert("Please enter a quiz title.");

        return null;
    }


    if (questionBoxes.length === 0) {

        alert("Add at least one question.");

        return null;
    }


    const questions = [];


    for (
        let i = 0;
        i < questionBoxes.length;
        i++
    ) {

        const box =
            questionBoxes[i];


        const questionText =
            box.querySelector(
                ".question-text"
            ).value.trim();


        const answers =
            [...box.querySelectorAll(
                ".answer-text"
            )]
            .map(input =>
                input.value.trim()
            );


        const selected =
            box.querySelector(
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


        if (!selected) {

            alert(
                `Choose the correct answer for question ${i + 1}.`
            );

            return null;
        }


        questions.push({

            question: questionText,

            answers: answers,

            correct:
                parseInt(selected.value)

        });

    }


    return {

        format: "QZ",

        version: 1,

        title: title,

        description: description,

        questions: questions

    };

}



/* =========================
   SAVE
========================= */

function saveQuiz() {

    const newQuiz =
        buildQuiz();

    if (!newQuiz) return;


    quiz = newQuiz;


    localStorage.setItem(
        "quizforgeQuiz",
        JSON.stringify(quiz)
    );


    updateSavedQuiz();


    alert("✅ Quiz saved!");
}



/* =========================
   LOAD SAVED QUIZ
========================= */

function loadSavedQuiz() {

    const saved =
        localStorage.getItem(
            "quizforgeQuiz"
        );


    if (!saved) {

        updateSavedQuiz();

        return;
    }


    try {

        quiz =
            JSON.parse(saved);

        updateSavedQuiz();

    }

    catch {

        localStorage.removeItem(
            "quizforgeQuiz"
        );

    }

}



/* =========================
   SAVED QUIZ UI
========================= */

function updateSavedQuiz() {

    const area =
        document.getElementById(
            "savedQuiz"
        );


    if (
        !quiz ||
        !quiz.title
    ) {

        area.textContent =
            "No quiz saved yet.";

        return;
    }


    area.innerHTML = `

        <h3>${escapeHTML(quiz.title)}</h3>

        <p>
            ${quiz.questions.length}
            question(s)
        </p>

        <button
            class="primary"
            onclick="loadQuizIntoEditor()"
        >
            ✏️ Edit
        </button>

        <button
            class="secondary"
            onclick="startQuiz()"
        >
            ▶ Play
        </button>

    `;

}



/* =========================
   LOAD INTO EDITOR
========================= */

function loadQuizIntoEditor() {

    document.getElementById(
        "quizTitle"
    ).value = quiz.title;


    document.getElementById(
        "quizDescription"
    ).value = quiz.description || "";


    const list =
        document.getElementById(
            "questionList"
        );


    list.innerHTML = "";


    quiz.questions.forEach(
        question =>
            addQuestion(question)
    );


    showPage("create");
}



/* =========================
   EXPORT QZ
========================= */

function exportQuiz() {

    const newQuiz =
        buildQuiz();

    if (!newQuiz) return;


    quiz = newQuiz;


    const data =
        JSON.stringify(
            quiz,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type:
                    "application/x-qz"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        safeFilename(
            quiz.title
        ) + ".qz";


    link.click();


    URL.revokeObjectURL(url);

}



/* =========================
   IMPORT QZ
========================= */

function importQuiz(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload = function(e) {

        try {

            const imported =
                JSON.parse(
                    e.target.result
                );


            validateQuiz(imported);


            quiz = imported;


            localStorage.setItem(
                "quizforgeQuiz",
                JSON.stringify(quiz)
            );


            loadQuizIntoEditor();


            alert(
                "✅ Quiz imported successfully!"
            );

        }

        catch(error) {

            alert(
                "❌ Invalid .qz quiz file.\n\n" +
                error.message
            );

        }

    };


    reader.readAsText(file);

}



/* =========================
   VALIDATE QZ
========================= */

function validateQuiz(data) {

    if (
        !data ||
        data.format !== "QZ"
    ) {

        throw new Error(
            "This is not a valid QZ file."
        );

    }


    if (
        !data.title ||
        !Array.isArray(data.questions)
    ) {

        throw new Error(
            "The quiz is missing required information."
        );

    }


    data.questions.forEach(
        (question, i) => {

            if (
                !question.question ||
                !Array.isArray(
                    question.answers
                ) ||
                question.answers.length !== 4
            ) {

                throw new Error(
                    `Question ${i + 1} is invalid.`
                );

            }


            if (
                question.correct < 0 ||
                question.correct > 3
            ) {

                throw new Error(
                    `Question ${i + 1} has an invalid answer.`
                );

            }

        }
    );

}



/* =========================
   START QUIZ
========================= */

function startQuiz() {

    let newQuiz =
        buildQuiz();


    /*
        If the creator has questions,
        use the current editor version.
    */

    if (
        newQuiz &&
        newQuiz.questions.length > 0
    ) {

        quiz = newQuiz;

    }

    else if (
        !quiz ||
        !quiz.questions ||
        quiz.questions.length === 0
    ) {

        alert(
            "Create or import a quiz first."
        );

        return;
    }


    currentQuestion = 0;

    score = 0;

    quizStarted = true;


    showPage("play");


    renderQuestion();

}



/* =========================
   RENDER QUESTION
========================= */

function renderQuestion() {

    const area =
        document.getElementById(
            "playArea"
        );


    if (
        currentQuestion >=
        quiz.questions.length
    ) {

        showResults();

        return;
    }


    const q =
        quiz.questions[
            currentQuestion
        ];


    const total =
        quiz.questions.length;


    const percentage =
        (
            currentQuestion /
            total
        ) * 100;


    area.innerHTML = `

        <div class="card">

            <div class="quiz-header">

                <h1>
                    ${escapeHTML(quiz.title)}
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

                ${escapeHTML(q.question)}

            </div>


            <div>

                ${q.answers.map(
                    (answer, i) => `

                    <button
                        class="answer-button"
                        onclick="answerQuestion(${i})"
                    >
                        ${escapeHTML(answer)}
                    </button>

                `).join("")}

            </div>

        </div>

    `;

}



/* =========================
   ANSWER QUESTION
========================= */

function answerQuestion(index) {

    const q =
        quiz.questions[
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
            .classList.add("correct");

    }

    else {

        buttons[index]
            .classList.add("wrong");

        buttons[q.correct]
            .classList.add("correct");

    }


    setTimeout(() => {

        currentQuestion++;

        renderQuestion();

    }, 900);

}



/* =========================
   RESULTS
========================= */

function showResults() {

    const total =
        quiz.questions.length;


    const percentage =
        Math.round(
            (score / total) * 100
        );


    let message;


    if (percentage === 100) {

        message =
            "🏆 Perfect score!";

    }

    else if (percentage >= 80) {

        message =
            "🔥 Excellent job!";

    }

    else if (percentage >= 60) {

        message =
            "👍 Good work!";

    }

    else if (percentage >= 40) {

        message =
            "🙂 Keep practising!";

    }

    else {

        message =
            "💪 Have another go!";

    }


    document.getElementById(
        "playArea"
    ).innerHTML = `

        <div class="card result">

            <h1>
                🎉 Quiz Complete!
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
                out of
                <strong>
                    ${total}
                </strong>.
            </p>

            <br>

            <button
                class="primary"
                onclick="startQuiz()"
            >
                🔄 Play Again
            </button>

            <button
                class="secondary"
                onclick="showPage('home')"
            >
                🏠 Home
            </button>

        </div>

    `;

}



/* =========================
   SHARE QUIZ
========================= */

async function shareQuiz() {

    const newQuiz =
        buildQuiz();

    if (!newQuiz) return;


    quiz = newQuiz;


    const encoded =
        encodeQuiz(quiz);


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

                title: quiz.title,

                text:
                    "Play my quiz: " +
                    quiz.title,

                url: url

            });

            return;

        }

        catch {

            // User cancelled sharing.

        }

    }


    try {

        await navigator.clipboard.writeText(
            url
        );

        alert(
            "🔗 Share link copied to clipboard!"
        );

    }

    catch {

        prompt(
            "Copy this quiz link:",
            url
        );

    }

}



/* =========================
   URL QUIZ LOADING
========================= */

function loadSharedQuiz() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const encoded =
        params.get("quiz");


    if (!encoded) return;


    try {

        const decoded =
            decodeQuiz(encoded);


        validateQuiz(decoded);


        quiz = decoded;


        localStorage.setItem(
            "quizforgeQuiz",
            JSON.stringify(quiz)
        );


        alert(
            `🎮 Shared quiz loaded: ${quiz.title}`
        );


        startImportedQuiz();

    }

    catch(error) {

        alert(
            "Could not load the shared quiz."
        );

    }

}



/* =========================
   PLAY IMPORTED QUIZ
========================= */

function startImportedQuiz() {

    currentQuestion = 0;

    score = 0;

    quizStarted = true;

    showPage("play");

    renderQuestion();

}



/* =========================
   ENCODE QUIZ
========================= */

function encodeQuiz(data) {

    const json =
        JSON.stringify(data);


    /*
        Unicode-safe Base64
    */

    const bytes =
        new TextEncoder()
            .encode(json);


    let binary = "";

    bytes.forEach(
        byte =>
            binary +=
                String.fromCharCode(byte)
    );


    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

}



/* =========================
   DECODE QUIZ
========================= */

function decodeQuiz(encoded) {

    let base64 =
        encoded
            .replace(/-/g, "+")
            .replace(/_/g, "/");


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
            char => char.charCodeAt(0)
        );


    const json =
        new TextDecoder()
            .decode(bytes);


    return JSON.parse(json);

}



/* =========================
   HELPERS
========================= */

function safeFilename(name) {

    return name
        .replace(
            /[^a-z0-9_\- ]/gi,
            ""
        )
        .trim()
        .replace(/\s+/g, "_")
        .substring(0, 60)
        || "quiz";

}


function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



/* =========================
   INITIALISE
========================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        loadSavedQuiz();

        loadSharedQuiz();

    }
);
