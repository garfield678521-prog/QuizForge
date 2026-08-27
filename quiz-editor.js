/* =========================================================
   QUIZFORGE QUIZ EDITOR
   Creates blank quizzes + edits + saves
========================================================= */

let currentQuiz = null;


/* =========================================================
   CREATE A BRAND NEW BLANK QUIZ
========================================================= */

function createNewQuiz() {

    currentQuiz = {

        id: null,

        title: "",

        description: "",

        questions: [],

        is_public: false

    };


    renderQuizEditor();

    showPage("create");

}


/* =========================================================
   RENDER EDITOR
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
                    🆕 Create a Quiz
                </h2>

                <p>
                    Start with a blank quiz.
                </p>

                <button
                    class="primary"
                    onclick="createNewQuiz()"
                >
                    ➕ Create Blank Quiz
                </button>

            </div>

        `;

        return;

    }


    editor.innerHTML = `

        <div class="card">

            <div class="editor-top">

                <div>

                    <h1>
                        📝 Quiz Editor
                    </h1>

                    ${
                        currentQuiz.id
                            ? "<small>Editing saved quiz</small>"
                            : "<small>New quiz</small>"
                    }

                </div>


                <div class="editor-actions">

                    <button
                        onclick="createNewQuiz()"
                    >
                        🆕 New
                    </button>


                    <button
                        onclick="exportCurrentQuiz()"
                    >
                        📤 Export .qz
                    </button>


                    <button
                        onclick="openImportFile()"
                    >
                        📥 Import .qz
                    </button>


                    <button
                        class="primary"
                        onclick="saveCurrentQuiz()"
                    >
                        💾 Save Quiz
                    </button>

                </div>

            </div>


            <hr>


            <label>
                Quiz Title
            </label>

            <input
                id="quizTitle"
                type="text"
                placeholder="My Awesome Quiz"
                value="${escapeHTML(
                    currentQuiz.title
                )}"
                oninput="
                    currentQuiz.title =
                        this.value
                "
            >


            <label>
                Description
            </label>

            <textarea
                id="quizDescription"
                placeholder="What is this quiz about?"
                oninput="
                    currentQuiz.description =
                        this.value
                "
            >${escapeHTML(
                currentQuiz.description
            )}</textarea>


            <label>

                <input
                    type="checkbox"
                    id="quizPublic"
                    ${
                        currentQuiz.is_public
                            ? "checked"
                            : ""
                    }
                    onchange="
                        currentQuiz.is_public =
                            this.checked
                    "
                    style="width:auto;"
                >

                🌎 Publish to Public Library

            </label>

        </div>


        <div
            id="questionsContainer"
        ></div>


        <div class="card">

            <button
                class="primary"
                onclick="addQuestion()"
            >
                ➕ Add Question
            </button>

        </div>

    `;


    renderQuestions();

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        document.getElementById(
            "questionsContainer"
        );


    if (!container) {
        return;
    }


    if (
        !currentQuiz.questions.length
    ) {

        container.innerHTML = `

            <div class="card empty-state">

                <h2>
                    ❓ No questions yet
                </h2>

                <p>
                    Add your first question below.
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


    container.innerHTML =
        currentQuiz.questions
            .map(
                (
                    question,
                    index
                ) =>
                    renderQuestion(
                        question,
                        index
                    )
            )
            .join("");

}


/* =========================================================
   QUESTION
========================================================= */

function renderQuestion(
    question,
    index
) {

    /*
     * Make sure every question has
     * four answer slots.
     */

    if (
        !Array.isArray(
            question.answers
        )
    ) {

        question.answers = [];

    }


    while (
        question.answers.length < 4
    ) {

        question.answers.push("");

    }


    question.answers =
        question.answers.slice(
            0,
            4
        );


    if (
        typeof question.correctAnswer !==
        "number"
    ) {

        question.correctAnswer =
            0;

    }


    return `

        <div
            class="card question-card"
        >

            <div class="question-header">

                <h2>
                    Question ${index + 1}
                </h2>


                <button
                    class="danger"
                    onclick="
                        deleteQuestion(
                            ${index}
                        )
                    "
                >
                    🗑️ Delete
                </button>

            </div>


            <label>
                Question
            </label>

            <textarea
                placeholder="Type your question here..."
                oninput="
                    currentQuiz.questions[
                        ${index}
                    ].question =
                        this.value
                "
            >${escapeHTML(
                question.question ||
                ""
            )}</textarea>


            <h3>
                Answers
            </h3>


            ${question.answers
                .map(
                    (
                        answer,
                        answerIndex
                    ) => `

                        <div
                            class="answer-row"
                        >

                            <input
                                type="radio"
                                name="correct-${index}"
                                ${
                                    question.correctAnswer ===
                                    answerIndex
                                        ? "checked"
                                        : ""
                                }
                                onchange="
                                    currentQuiz.questions[
                                        ${index}
                                    ].correctAnswer =
                                        ${answerIndex}
                                "
                            >


                            <input
                                type="text"
                                placeholder="Answer ${
                                    answerIndex + 1
                                }"
                                value="${escapeHTML(
                                    answer
                                )}"
                                oninput="
                                    currentQuiz.questions[
                                        ${index}
                                    ].answers[
                                        ${answerIndex}
                                    ] =
                                        this.value
                                "
                            >

                        </div>

                    `
                )
                .join("")}


            <p>
                💡 Select the radio button next
                to the correct answer.
            </p>

        </div>

    `;

}


/* =========================================================
   ADD QUESTION
========================================================= */

function addQuestion() {

    if (!currentQuiz) {

        createNewQuiz();

    }


    currentQuiz.questions.push({

        question: "",

        answers: [
            "",
            "",
            "",
            ""
        ],

        correctAnswer: 0

    });


    renderQuestions();


    /*
     * Scroll to the new question.
     */

    setTimeout(
        () => {

            const questions =
                document.querySelectorAll(
                    ".question-card"
                );


            const last =
                questions[
                    questions.length - 1
                ];


            last?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        },
        50
    );

}


/* =========================================================
   DELETE QUESTION
========================================================= */

function deleteQuestion(
    index
) {

    if (
        !confirm(
            `Delete question ${
                index + 1
            }?`
        )
    ) {

        return;

    }


    currentQuiz.questions
        .splice(
            index,
            1
        );


    renderQuestions();

}


/* =========================================================
   VALIDATE QUIZ
========================================================= */

function validateQuiz() {

    if (!currentQuiz) {

        alert(
            "Create a quiz first."
        );

        return false;

    }


    currentQuiz.title =
        document.getElementById(
            "quizTitle"
        )?.value.trim() ||
        currentQuiz.title.trim();


    currentQuiz.description =
        document.getElementById(
            "quizDescription"
        )?.value.trim() ||
        currentQuiz.description;


    const publicCheckbox =
        document.getElementById(
            "quizPublic"
        );


    if (publicCheckbox) {

        currentQuiz.is_public =
            publicCheckbox.checked;

    }


    if (!currentQuiz.title) {

        alert(
            "Please enter a quiz title."
        );

        return false;

    }


    if (
        !currentQuiz.questions.length
    ) {

        alert(
            "Add at least one question."
        );

        return false;

    }


    for (
        let i = 0;
        i < currentQuiz.questions.length;
        i++
    ) {

        const q =
            currentQuiz.questions[i];


        if (
            !q.question ||
            !q.question.trim()
        ) {

            alert(
                `Question ${
                    i + 1
                } is empty.`
            );

            return false;

        }


        if (
            !Array.isArray(
                q.answers
            ) ||
            q.answers.length !== 4
        ) {

            alert(
                `Question ${
                    i + 1
                } needs four answers.`
            );

            return false;

        }


        for (
            let a = 0;
            a < 4;
            a++
        ) {

            if (
                !q.answers[a] ||
                !q.answers[a].trim()
            ) {

                alert(
                    `Answer ${
                        a + 1
                    } for question ${
                        i + 1
                    } is empty.`
                );

                return false;

            }

        }


        if (
            q.correctAnswer < 0 ||
            q.correctAnswer > 3
        ) {

            alert(
                `Choose the correct answer for question ${
                    i + 1
                }.`
            );

            return false;

        }

    }


    return true;

}


/* =========================================================
   SAVE
========================================================= */

async function saveCurrentQuiz() {

    if (
        !validateQuiz()
    ) {

        return;

    }


    if (
        !window.QuizLibrary
    ) {

        alert(
            "Library system is not loaded."
        );

        return;

    }


    const saved =
        await QuizLibrary.saveQuiz(
            currentQuiz
        );


    if (saved) {

        currentQuiz =
            saved;

        renderQuizEditor();

    }

}


/* =========================================================
   EXPORT .QZ
========================================================= */

function exportCurrentQuiz() {

    if (
        !currentQuiz
    ) {

        alert(
            "Create a quiz first."
        );

        return;

    }


    const exportData = {

        format:
            "QuizForge",

        version:
            1,

        title:
            currentQuiz.title,

        description:
            currentQuiz.description,

        questions:
            currentQuiz.questions,

        is_public:
            currentQuiz.is_public

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    exportData,
                    null,
                    2
                )
            ],
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


    link.download =
        `${safeFilename(
            currentQuiz.title ||
            "quiz"
        )}.qz`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   IMPORT
========================================================= */

function openImportFile() {

    const input =
        document.getElementById(
            "hiddenQuizFileInput"
        );


    if (!input) {

        alert(
            "Import system is not available."
        );

        return;

    }


    input.value = "";

    input.click();

}


/* =========================================================
   IMPORT FILE HANDLER
========================================================= */

function importQuizFile(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    /*
     * Accept .qz and JSON.
     */

    const reader =
        new FileReader();


    reader.onload =
        function() {

            try {

                const data =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !data ||
                    !Array.isArray(
                        data.questions
                    )
                ) {

                    throw new Error(
                        "Invalid QuizForge file."
                    );

                }


                currentQuiz = {

                    id: null,

                    title:
                        data.title ||
                        "Imported Quiz",

                    description:
                        data.description ||
                        "",

                    questions:
                        data.questions,

                    is_public:
                        Boolean(
                            data.is_public
                        )

                };


                /*
                 * Clean imported questions.
                 */

                currentQuiz.questions =
                    currentQuiz.questions
                        .map(
                            q => ({

                                question:
                                    q.question ||
                                    "",

                                answers:
                                    Array.isArray(
                                        q.answers
                                    )
                                        ? [
                                            ...q.answers,
                                            "",
                                            "",
                                            "",
                                            ""
                                        ].slice(
                                            0,
                                            4
                                        )
                                        : [
                                            "",
                                            "",
                                            "",
                                            ""
                                        ],

                                correctAnswer:
                                    Number.isInteger(
                                        q.correctAnswer
                                    )
                                        ? q.correctAnswer
                                        : 0

                            })
                        );


                renderQuizEditor();

                showPage(
                    "create"
                );


                alert(
                    "📥 Quiz imported! Review it and press Save Quiz."
                );


            }

            catch (
                error
            ) {

                console.error(
                    error
                );


                alert(
                    "❌ Could not import this file.\n\n" +
                    error.message
                );

            }

        };


    reader.readAsText(
        file
    );

}


/* =========================================================
   SAFE FILENAME
========================================================= */

function safeFilename(
    name
) {

    return String(
        name || "quiz"
    )
        .replace(
            /[<>:"/\\|?*]+/g,
            "_"
        )
        .replace(
            /\s+/g,
            "_"
        )
        .substring(
            0,
            80
        );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

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


/* =========================================================
   GLOBALS
========================================================= */

window.currentQuiz =
    currentQuiz;

window.createNewQuiz =
    createNewQuiz;

window.renderQuizEditor =
    renderQuizEditor;

window.addQuestion =
    addQuestion;

window.deleteQuestion =
    deleteQuestion;

window.saveCurrentQuiz =
    saveCurrentQuiz;

window.exportCurrentQuiz =
    exportCurrentQuiz;

window.importQuizFile =
    importQuizFile;

window.openImportFile =
    openImportFile;


/* =========================================================
   IMPORTANT:
   Do NOT automatically load the previous quiz.
   The Create button always calls createNewQuiz().
========================================================= */
