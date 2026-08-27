/* =========================================================
   QUIZFORGE QUIZ EDITOR
========================================================= */

let currentQuiz = null;


/* =========================================================
   CREATE A COMPLETELY BLANK QUIZ
========================================================= */

function createNewQuiz() {

    currentQuiz = {

        id: crypto.randomUUID(),

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
   RENDER EDITOR
========================================================= */

function renderQuizEditor() {

    const editor =
        document.getElementById(
            "quizEditor"
        );


    if (!editor) return;


    if (!currentQuiz) {

        editor.innerHTML = `

            <div class="card">

                <h2>✏️ Create a New Quiz</h2>

                <p>
                    Start with a completely blank quiz.
                </p>

                <button
                    class="primary"
                    onclick="createNewQuiz()"
                >
                    ➕ New Blank Quiz
                </button>

                <button
                    onclick="document.getElementById('quizFileInput').click()"
                >
                    📥 Import .qz
                </button>

                <input
                    id="quizFileInput"
                    type="file"
                    accept=".qz,application/json"
                    hidden
                    onchange="importQuizFile(event)"
                >

            </div>

        `;

        return;

    }


    editor.innerHTML = `

        <div class="card">

            <div class="editor-top">

                <h1>✏️ Quiz Editor</h1>

                <div>

                    <button
                        onclick="createNewQuiz()"
                    >
                        🆕 New Quiz
                    </button>

                    <button
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
                placeholder="Enter quiz title..."
                value="${escapeHTML(currentQuiz.title)}"
                oninput="updateQuizTitle(this.value)"
            >


            <label>
                Description
            </label>

            <textarea
                id="quizDescription"
                placeholder="Describe your quiz..."
                oninput="updateQuizDescription(this.value)"
            >${escapeHTML(currentQuiz.description)}</textarea>


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


            <div id="questionList">

            </div>


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
   QUESTIONS
========================================================= */

function renderQuestions() {

    const list =
        document.getElementById(
            "questionList"
        );


    if (!list) return;


    if (
        currentQuiz.questions.length === 0
    ) {

        list.innerHTML = `

            <div class="empty-state">

                <h3>
                    No questions yet
                </h3>

                <p>
                    Click "Add Question" to begin.
                </p>

                <button
                    class="primary"
                    onclick="addQuestion()"
                >
                    ➕ Add First Question
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
                        data-question="${index}"
                    >

                        <div class="question-card-header">

                            <h3>
                                Question ${index + 1}
                            </h3>

                            <button
                                class="danger"
                                onclick="deleteQuestion(${index})"
                            >
                                🗑️ Delete
                            </button>

                        </div>


                        <label>
                            Question
                        </label>

                        <input
                            type="text"
                            value="${escapeHTML(question.text)}"
                            placeholder="Enter question..."
                            oninput="updateQuestionText(
                                ${index},
                                this.value
                            )"
                        >


                        <label>
                            Question Type
                        </label>

                        <select
                            onchange="changeQuestionType(
                                ${index},
                                this.value
                            )"
                        >

                            <option
                                value="multiple"
                                ${question.type === "multiple" ? "selected" : ""}
                            >
                                Multiple Choice
                            </option>

                            <option
                                value="truefalse"
                                ${question.type === "truefalse" ? "selected" : ""}
                            >
                                True / False
                            </option>

                            <option
                                value="text"
                                ${question.type === "text" ? "selected" : ""}
                            >
                                Written Answer
                            </option>

                        </select>


                        ${renderQuestionAnswers(
                            question,
                            index
                        )}

                    </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   ANSWER UI
========================================================= */

function renderQuestionAnswers(
    question,
    index
) {

    if (
        question.type ===
        "truefalse"
    ) {

        return `

            <label>
                Correct Answer
            </label>

            <select
                onchange="updateCorrectAnswer(
                    ${index},
                    this.value
                )"
            >

                <option
                    value="true"
                    ${question.correctAnswer === "true" ? "selected" : ""}
                >
                    True
                </option>

                <option
                    value="false"
                    ${question.correctAnswer === "false" ? "selected" : ""}
                >
                    False
                </option>

            </select>

        `;

    }


    if (
        question.type ===
        "text"
    ) {

        return `

            <label>
                Correct Answer
            </label>

            <input
                type="text"
                value="${escapeHTML(
                    question.correctAnswer || ""
                )}"
                placeholder="Correct answer..."
                oninput="updateCorrectAnswer(
                    ${index},
                    this.value
                )"
            >

        `;

    }


    return `

        <div class="answers">

            <h4>
                Answers
            </h4>

            ${question.answers
                .map(
                    (
                        answer,
                        answerIndex
                    ) => {

                        return `

                        <div class="answer-row">

                            <input
                                type="radio"
                                name="correct-${index}"
                                ${
                                    question.correctAnswer ===
                                    answerIndex
                                        ? "checked"
                                        : ""
                                }
                                onchange="setCorrectAnswer(
                                    ${index},
                                    ${answerIndex}
                                )"
                            >

                            <input
                                type="text"
                                value="${escapeHTML(answer)}"
                                placeholder="Answer ${answerIndex + 1}"
                                oninput="updateAnswer(
                                    ${index},
                                    ${answerIndex},
                                    this.value
                                )"
                            >

                        </div>

                        `;

                    }
                )
                .join("")}

        </div>

    `;

}


/* =========================================================
   ADD QUESTION
========================================================= */

function addQuestion() {

    if (!currentQuiz) {

        createNewQuiz();

        return;

    }


    currentQuiz.questions.push({

        id:
            crypto.randomUUID(),

        text:
            "",

        type:
            "multiple",

        answers:
            [
                "",
                "",
                "",
                ""
            ],

        correctAnswer:
            0

    });


    currentQuiz.updatedAt =
        new Date().toISOString();


    renderQuestions();

}


/* =========================================================
   DELETE QUESTION
========================================================= */

function deleteQuestion(
    index
) {

    if (
        !confirm(
            "Delete this question?"
        )
    ) {

        return;

    }


    currentQuiz.questions.splice(
        index,
        1
    );


    renderQuestions();

}


/* =========================================================
   UPDATE QUESTION
========================================================= */

function updateQuestionText(
    index,
    value
) {

    currentQuiz.questions[
        index
    ].text =
        value;

}


/* =========================================================
   UPDATE ANSWER
========================================================= */

function updateAnswer(
    questionIndex,
    answerIndex,
    value
) {

    currentQuiz.questions[
        questionIndex
    ].answers[
        answerIndex
    ] =
        value;

}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function setCorrectAnswer(
    questionIndex,
    answerIndex
) {

    currentQuiz.questions[
        questionIndex
    ].correctAnswer =
        answerIndex;

}


function updateCorrectAnswer(
    index,
    value
) {

    currentQuiz.questions[
        index
    ].correctAnswer =
        value;

}


/* =========================================================
   CHANGE QUESTION TYPE
========================================================= */

function changeQuestionType(
    index,
    type
) {

    const question =
        currentQuiz.questions[
            index
        ];


    question.type =
        type;


    if (
        type ===
        "multiple"
    ) {

        question.answers =
            [
                "",
                "",
                "",
                ""
            ];

        question.correctAnswer =
            0;

    }


    if (
        type ===
        "truefalse"
    ) {

        question.answers =
            [];

        question.correctAnswer =
            "true";

    }


    if (
        type ===
        "text"
    ) {

        question.answers =
            [];

        question.correctAnswer =
            "";

    }


    renderQuestions();

}


/* =========================================================
   TITLE
========================================================= */

function updateQuizTitle(
    value
) {

    currentQuiz.title =
        value;

}


/* =========================================================
   DESCRIPTION
========================================================= */

function updateQuizDescription(
    value
) {

    currentQuiz.description =
        value;

}


/* =========================================================
   SAVE QUIZ
========================================================= */

function saveQuiz() {

    if (!currentQuiz) {

        return;

    }


    if (
        !currentQuiz.title.trim()
    ) {

        alert(
            "Please enter a quiz title."
        );

        return;

    }


    localStorage.setItem(

        "quizforge_quiz_" +
        currentQuiz.id,

        JSON.stringify(
            currentQuiz
        )

    );


    /*
     * Keep a list of created quizzes.
     */

    const quizIDs =
        JSON.parse(
            localStorage.getItem(
                "quizforge_my_quizzes"
            ) ||
            "[]"
        );


    if (
        !quizIDs.includes(
            currentQuiz.id
        )
    ) {

        quizIDs.push(
            currentQuiz.id
        );

    }


    localStorage.setItem(

        "quizforge_my_quizzes",

        JSON.stringify(
            quizIDs
        )

    );


    alert(
        "✅ Quiz saved!"
    );

}


/* =========================================================
   EXPORT .QZ
========================================================= */

function exportQuiz() {

    if (!currentQuiz) {

        alert(
            "Create a quiz first."
        );

        return;

    }


    const data =
        JSON.stringify(
            currentQuiz,
            null,
            2
        );


    const blob =
        new Blob(
            [
                data
            ],
            {
                type:
                    "application/x-quizforge"
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


    const safeName =
        (
            currentQuiz.title ||
            "quiz"
        )
        .replace(
            /[^a-z0-9]/gi,
            "_"
        );


    link.download =
        safeName +
        ".qz";


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
   IMPORT .QZ
========================================================= */

function importQuizFile(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function () {

            try {

                const imported =
                    JSON.parse(
                        reader.result
                    );


                if (
                    !imported ||
                    !Array.isArray(
                        imported.questions
                    )
                ) {

                    throw new Error(
                        "Invalid .qz file."
                    );

                }


                currentQuiz = {

                    id:
                        crypto.randomUUID(),

                    title:
                        imported.title ||
                        "Imported Quiz",

                    description:
                        imported.description ||
                        "",

                    author:
                        imported.author ||
                        "",

                    questions:
                        imported.questions,

                    createdAt:
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()

                };


                renderQuizEditor();


                alert(
                    "✅ Quiz imported successfully!"
                );

            }

            catch (error) {

                console.error(
                    error
                );

                alert(
                    "❌ That file is not a valid QuizForge .qz file."
                );

            }

        };


    reader.readAsText(
        file
    );


    /*
     * Allow importing the same file again.
     */

    event.target.value =
        "";

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
   OPEN CREATE PAGE
========================================================= */

function openQuizCreator() {

    /*
     * IMPORTANT:
     * Always create a NEW blank quiz.
     * It never loads the previous quiz.
     */

    currentQuiz =
        null;


    showPage(
        "create"
    );


    renderQuizEditor();

}


/* =========================================================
   STARTUP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Don't automatically load
         * the previous quiz.
         */

        currentQuiz =
            null;

        renderQuizEditor();

    }
);
