/* =========================================================
   QUIZFORGE QUIZ EDITOR
   CREATE • EDIT • IMPORT • EXPORT
========================================================= */

let currentQuiz = null;


/* =========================================================
   CREATE NEW BLANK QUIZ
========================================================= */

function createNewQuiz() {

    currentQuiz = {
        format: "QuizForge",
        version: 1,
        id: generateID(),
        title: "",
        description: "",
        author: "",
        questions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    renderQuizEditor();
}


/* =========================================================
   ID
========================================================= */

function generateID() {

    if (
        window.crypto &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   OPEN IMPORT FILE
========================================================= */

function openImportFile() {

    let input =
        document.getElementById(
            "hiddenQuizFileInput"
        );

    /*
     * If the hidden input doesn't exist,
     * create one automatically.
     */

    if (!input) {

        input =
            document.createElement("input");

        input.type = "file";

        input.id =
            "hiddenQuizFileInput";

        input.accept =
            ".qz,.json,application/json";

        input.style.display =
            "none";

        document.body.appendChild(input);

        input.addEventListener(
            "change",
            importQuizFile
        );
    }

    /*
     * Clear previous selection.
     * This allows the same file to be
     * imported again.
     */

    input.value = "";

    input.click();
}


/* =========================================================
   IMPORT .QZ
========================================================= */

function importQuizFile(event) {

    const input =
        event.target;

    const file =
        input.files &&
        input.files[0];

    if (!file) {
        return;
    }


    /*
     * Accept .qz and JSON files.
     */

    const fileName =
        file.name.toLowerCase();

    const isQZ =
        fileName.endsWith(".qz");

    const isJSON =
        fileName.endsWith(".json");


    if (!isQZ && !isJSON) {

        alert(
            "❌ Please select a .qz quiz file."
        );

        input.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function(e) {

        try {

            const text =
                e.target.result;


            if (
                !text ||
                text.trim() === ""
            ) {

                throw new Error(
                    "The file is empty."
                );

            }


            /*
             * .qz files contain JSON.
             */

            const quiz =
                JSON.parse(text);


            validateImportedQuiz(
                quiz
            );


            /*
             * Make sure required fields
             * exist.
             */

            if (
                !Array.isArray(
                    quiz.questions
                )
            ) {

                quiz.questions = [];

            }


            if (!quiz.format) {

                quiz.format =
                    "QuizForge";

            }


            if (!quiz.version) {

                quiz.version = 1;

            }


            if (!quiz.id) {

                quiz.id =
                    generateID();

            }


            if (!quiz.title) {

                quiz.title =
                    "Imported Quiz";

            }


            /*
             * Save imported quiz
             * into the editor.
             */

            currentQuiz =
                quiz;


            currentQuiz.updatedAt =
                new Date().toISOString();


            /*
             * Open creator.
             */

            if (
                typeof showPage ===
                "function"
            ) {

                showPage("create");

            }


            renderQuizEditor();


            alert(
                "✅ Quiz imported successfully!"
            );

        }

        catch(error) {

            console.error(
                "Quiz import error:",
                error
            );


            alert(
                "❌ Could not import this file.\n\n" +
                "Make sure it is a valid QuizForge .qz file."
            );

        }


        input.value = "";

    };


    reader.onerror =
        function() {

            alert(
                "❌ Could not read the file."
            );

            input.value = "";

        };


    reader.readAsText(
        file
    );
}


/* =========================================================
   VALIDATE IMPORTED QUIZ
========================================================= */

function validateImportedQuiz(quiz) {

    if (
        !quiz ||
        typeof quiz !== "object" ||
        Array.isArray(quiz)
    ) {

        throw new Error(
            "Invalid quiz format."
        );

    }


    /*
     * Allow older QuizForge files
     * without strict format checking.
     */

    if (
        quiz.questions !== undefined &&
        !Array.isArray(
            quiz.questions
        )
    ) {

        throw new Error(
            "Questions must be an array."
        );

    }

}


/* =========================================================
   EXPORT QUIZ
========================================================= */

function exportQuiz() {

    /*
     * Don't export nothing.
     */

    if (!currentQuiz) {

        alert(
            "❌ There is no quiz to export.\n\n" +
            "Create or import a quiz first."
        );

        return;
    }


    /*
     * Update quiz metadata.
     */

    currentQuiz.updatedAt =
        new Date().toISOString();


    /*
     * Get current title.
     */

    const titleInput =
        document.getElementById(
            "quizTitle"
        );


    if (
        titleInput &&
        titleInput.value.trim()
    ) {

        currentQuiz.title =
            titleInput.value.trim();

    }


    /*
     * Get description.
     */

    const descriptionInput =
        document.getElementById(
            "quizDescription"
        );


    if (descriptionInput) {

        currentQuiz.description =
            descriptionInput.value;

    }


    /*
     * Make pretty JSON.
     */

    const json =
        JSON.stringify(
            currentQuiz,
            null,
            2
        );


    /*
     * Create .qz file.
     */

    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    /*
     * Clean filename.
     */

    let filename =
        currentQuiz.title ||
        "QuizForge-Quiz";


    filename =
        filename
            .replace(
                /[<>:"/\\|?*]/g,
                ""
            )
            .trim();


    if (!filename) {

        filename =
            "QuizForge-Quiz";

    }


    link.download =
        filename + ".qz";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    /*
     * Free browser memory.
     */

    setTimeout(
        function() {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );


    alert(
        "📤 Quiz exported!\n\n" +
        filename +
        ".qz"
    );
}


/* =========================================================
   UPDATE TITLE
========================================================= */

function updateQuizTitle(title) {

    if (!currentQuiz) {
        return;
    }

    currentQuiz.title =
        title;

    currentQuiz.updatedAt =
        new Date().toISOString();
}


/* =========================================================
   UPDATE DESCRIPTION
========================================================= */

function updateQuizDescription(
    description
) {

    if (!currentQuiz) {
        return;
    }

    currentQuiz.description =
        description;

    currentQuiz.updatedAt =
        new Date().toISOString();
}


/* =========================================================
   ADD QUESTION
========================================================= */

function addQuestion() {

    if (!currentQuiz) {

        createNewQuiz();

    }


    currentQuiz.questions.push({

        id: generateID(),

        type: "multiple-choice",

        question: "",

        options: [
            "",
            "",
            "",
            ""
        ],

        answer: 0,

        points: 1

    });


    currentQuiz.updatedAt =
        new Date().toISOString();


    renderQuizEditor();

}


/* =========================================================
   DELETE QUESTION
========================================================= */

function deleteQuestion(index) {

    if (!currentQuiz) {
        return;
    }


    if (
        !confirm(
            "Delete this question?"
        )
    ) {

        return;

    }


    currentQuiz.questions
        .splice(
            index,
            1
        );


    currentQuiz.updatedAt =
        new Date().toISOString();


    renderQuizEditor();

}


/* =========================================================
   SAVE QUIZ LOCALLY
========================================================= */

function saveQuiz() {

    if (!currentQuiz) {

        alert(
            "Create a quiz first."
        );

        return;

    }


    currentQuiz.updatedAt =
        new Date().toISOString();


    localStorage.setItem(
        "quizforge_current_quiz",
        JSON.stringify(
            currentQuiz
        )
    );


    /*
     * Also keep a list of
     * locally saved quizzes.
     */

    let quizzes = [];


    try {

        quizzes =
            JSON.parse(
                localStorage.getItem(
                    "quizforge_my_quizzes"
                )
            ) || [];

    }

    catch {

        quizzes = [];

    }


    const existingIndex =
        quizzes.findIndex(
            quiz =>
                quiz.id ===
                currentQuiz.id
        );


    if (existingIndex >= 0) {

        quizzes[
            existingIndex
        ] = currentQuiz;

    }

    else {

        quizzes.push(
            currentQuiz
        );

    }


    localStorage.setItem(
        "quizforge_my_quizzes",
        JSON.stringify(
            quizzes
        )
    );


    alert(
        "💾 Quiz saved!"
    );
}


/* =========================================================
   LOAD SAVED QUIZ
========================================================= */

function loadSavedQuiz(
    quizID
) {

    let quizzes = [];


    try {

        quizzes =
            JSON.parse(
                localStorage.getItem(
                    "quizforge_my_quizzes"
                )
            ) || [];

    }

    catch {

        return;

    }


    const quiz =
        quizzes.find(
            q =>
                q.id ===
                quizID
        );


    if (!quiz) {

        alert(
            "Quiz not found."
        );

        return;

    }


    currentQuiz =
        quiz;


    renderQuizEditor();


    if (
        typeof showPage ===
        "function"
    ) {

        showPage("create");

    }

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const list =
        document.getElementById(
            "questionList"
        );


    if (!list || !currentQuiz) {
        return;
    }


    if (
        currentQuiz.questions.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                <h3>
                    No questions yet
                </h3>

                <p>
                    Add your first question!
                </p>

                <button
                    class="primary"
                    onclick="addQuestion()"
                >
                    ➕ Add Question
                </button>

            </div>

        `;

        return;

    }


    list.innerHTML =
        currentQuiz.questions
            .map(
                (
                    question,
                    index
                ) => {

                    return `

                        <div
                            class="question-card"
                        >

                            <h3>
                                Question
                                ${index + 1}
                            </h3>


                            <textarea
                                placeholder="Enter question..."
                                oninput="updateQuestionText(
                                    ${index},
                                    this.value
                                )"
                            >${escapeHTML(
                                question.question
                            )}</textarea>


                            <label>
                                Answer Type
                            </label>


                            <select
                                onchange="changeQuestionType(
                                    ${index},
                                    this.value
                                )"
                            >

                                <option
                                    value="multiple-choice"
                                    ${
                                        question.type ===
                                        "multiple-choice"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Multiple Choice
                                </option>


                                <option
                                    value="true-false"
                                    ${
                                        question.type ===
                                        "true-false"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    True / False
                                </option>


                                <option
                                    value="written"
                                    ${
                                        question.type ===
                                        "written"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Written Answer
                                </option>

                            </select>


                            ${renderAnswerArea(
                                question,
                                index
                            )}


                            <label>
                                Points
                            </label>


                            <input
                                type="number"
                                min="1"
                                value="${
                                    question.points || 1
                                }"
                                onchange="updateQuestionPoints(
                                    ${index},
                                    this.value
                                )"
                            >


                            <button
                                class="danger"
                                onclick="deleteQuestion(
                                    ${index}
                                )"
                            >
                                🗑️ Delete
                            </button>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   ANSWER AREA
========================================================= */

function renderAnswerArea(
    question,
    index
) {

    if (
        question.type ===
        "true-false"
    ) {

        return `

            <label>
                Correct Answer
            </label>

            <select
                onchange="updateQuestionAnswer(
                    ${index},
                    this.value
                )"
            >

                <option
                    value="true"
                    ${
                        question.answer === true
                            ? "selected"
                            : ""
                    }
                >
                    True
                </option>

                <option
                    value="false"
                    ${
                        question.answer === false
                            ? "selected"
                            : ""
                    }
                >
                    False
                </option>

            </select>

        `;

    }


    if (
        question.type ===
        "written"
    ) {

        return `

            <label>
                Correct Answer
            </label>

            <input
                type="text"
                placeholder="Correct answer"
                value="${escapeHTML(
                    question.answer || ""
                )}"
                oninput="updateQuestionAnswer(
                    ${index},
                    this.value
                )"
            >

        `;

    }


    /*
     * Multiple choice
     */

    return `

        <label>
            Answers
        </label>

        <div class="answer-options">

            ${
                question.options
                    .map(
                        (
                            option,
                            optionIndex
                        ) => `

                            <div
                                class="answer-row"
                            >

                                <input
                                    type="radio"
                                    name="correct-${index}"
                                    ${
                                        question.answer ===
                                        optionIndex
                                            ? "checked"
                                            : ""
                                    }
                                    onchange="updateQuestionAnswer(
                                        ${index},
                                        ${optionIndex}
                                    )"
                                >


                                <input
                                    type="text"
                                    placeholder="Answer ${
                                        optionIndex + 1
                                    }"
                                    value="${escapeHTML(
                                        option
                                    )}"
                                    oninput="updateOption(
                                        ${index},
                                        ${optionIndex},
                                        this.value
                                    )"
                                >

                            </div>

                        `
                    )
                    .join("")
            }

        </div>

    `;
}


/* =========================================================
   UPDATE QUESTION TEXT
========================================================= */

function updateQuestionText(
    index,
    value
) {

    if (!currentQuiz) {
        return;
    }


    if (
        !currentQuiz.questions[index]
    ) {

        return;

    }


    currentQuiz.questions[
        index
    ].question = value;


    currentQuiz.updatedAt =
        new Date().toISOString();

}


/* =========================================================
   UPDATE QUESTION TYPE
========================================================= */

function changeQuestionType(
    index,
    type
) {

    const question =
        currentQuiz?.questions[
            index
        ];


    if (!question) {
        return;
    }


    question.type =
        type;


    if (
        type ===
        "multiple-choice"
    ) {

        question.options = [
            "",
            "",
            "",
            ""
        ];

        question.answer = 0;

    }


    if (
        type ===
        "true-false"
    ) {

        question.options = [];

        question.answer = true;

    }


    if (
        type ===
        "written"
    ) {

        question.options = [];

        question.answer = "";

    }


    currentQuiz.updatedAt =
        new Date().toISOString();


    renderQuizEditor();

}


/* =========================================================
   UPDATE ANSWER
========================================================= */

function updateQuestionAnswer(
    index,
    answer
) {

    if (!currentQuiz) {
        return;
    }


    const question =
        currentQuiz.questions[
            index
        ];


    if (!question) {
        return;
    }


    if (
        question.type ===
        "multiple-choice"
    ) {

        question.answer =
            Number(answer);

    }

    else if (
        question.type ===
        "true-false"
    ) {

        question.answer =
            answer === true ||
            answer === "true";

    }

    else {

        question.answer =
            answer;

    }


    currentQuiz.updatedAt =
        new Date().toISOString();

}


/* =========================================================
   UPDATE OPTION
========================================================= */

function updateOption(
    questionIndex,
    optionIndex,
    value
) {

    if (!currentQuiz) {
        return;
    }


    const question =
        currentQuiz.questions[
            questionIndex
        ];


    if (!question) {
        return;
    }


    if (
        !Array.isArray(
            question.options
        )
    ) {

        question.options = [
            "",
            "",
            "",
            ""
        ];

    }


    question.options[
        optionIndex
    ] = value;


    currentQuiz.updatedAt =
        new Date().toISOString();

}


/* =========================================================
   UPDATE POINTS
========================================================= */

function updateQuestionPoints(
    index,
    value
) {

    if (!currentQuiz) {
        return;
    }


    const points =
        Math.max(
            1,
            Number(value) || 1
        );


    currentQuiz.questions[
        index
    ].points =
        points;


    currentQuiz.updatedAt =
        new Date().toISOString();

}


/* =========================================================
   MAIN EDITOR RENDER
========================================================= */

function renderQuizEditor() {

    const editor =
        document.getElementById(
            "quizEditor"
        );


    if (!editor) {
        return;
    }


    if (!currentQuiz) {

        editor.innerHTML = `

            <div class="card">

                <h2>
                    🆕 New Blank Quiz
                </h2>

                <p>
                    Create a brand-new quiz
                    or import a .qz file.
                </p>


                <button
                    class="primary"
                    onclick="createNewQuiz()"
                >
                    ➕ Create Blank Quiz
                </button>


                <button
                    onclick="openImportFile()"
                >
                    📥 Import .qz
                </button>

            </div>

        `;

        return;

    }


    editor.innerHTML = `

        <div class="card">

            <div class="editor-top">

                <h1>
                    ✏️ Quiz Editor
                </h1>


                <div>

                    <button
                        onclick="createNewQuiz()"
                    >
                        🆕 New
                    </button>


                    <button
                        onclick="openImportFile()"
                    >
                        📥 Import
                    </button>


                    <button
                        class="primary"
                        onclick="exportQuiz()"
                    >
                        📤 Export .qz
                    </button>

                </div>

            </div>


            <label>
                Quiz Title
            </label>


            <input
                id="quizTitle"
                type="text"
                placeholder="My Quiz"
                value="${escapeHTML(
                    currentQuiz.title
                )}"
                oninput="updateQuizTitle(
                    this.value
                )"
            >


            <label>
                Description
            </label>


            <textarea
                id="quizDescription"
                placeholder="Describe your quiz..."
                oninput="updateQuizDescription(
                    this.value
                )"
            >${escapeHTML(
                currentQuiz.description
            )}</textarea>


            <hr>


            <div class="question-header">

                <h2>
                    ❓ Questions
                </h2>


                <button
                    class="primary"
                    onclick="addQuestion()"
                >
                    ➕ Add Question
                </button>

            </div>


            <div
                id="questionList"
            ></div>


            <hr>


            <div class="editor-actions">

                <button
                    class="primary"
                    onclick="saveQuiz()"
                >
                    💾 Save Quiz
                </button>


                <button
                    onclick="exportQuiz()"
                >
                    📤 Export .qz
                </button>

            </div>

        </div>

    `;


    renderQuestions();

}


/* =========================================================
   AUTOMATICALLY RESTORE LAST SAVED QUIZ
   ONLY WHEN EXPLICITLY REQUESTED
========================================================= */

function restoreSavedQuiz() {

    /*
     * We deliberately DO NOT call this
     * when Create is opened.
     *
     * Create must always be blank.
     */

    const saved =
        localStorage.getItem(
            "quizforge_current_quiz"
        );


    if (!saved) {
        return false;
    }


    try {

        currentQuiz =
            JSON.parse(saved);

        renderQuizEditor();

        return true;

    }

    catch(error) {

        console.error(
            "Could not restore quiz:",
            error
        );

        return false;

    }

}


/* =========================================================
   INITIAL EDITOR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderQuizEditor();

    }
);
