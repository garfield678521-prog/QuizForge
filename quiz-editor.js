/* =========================================================
   QUIZFORGE QUIZ EDITOR
   IMPORT + EXPORT .QZ
========================================================= */

let currentQuiz = null;


/* =========================================================
   CREATE NEW BLANK QUIZ
========================================================= */

function createNewQuiz() {

    currentQuiz = {

        format: "QuizForge",

        version: 1,

        id: crypto.randomUUID(),

        title: "",

        description: "",

        author: "",

        questions: [],

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

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

                <h2>
                    🆕 New Quiz
                </h2>

                <p>
                    Start with a completely
                    blank quiz.
                </p>


                <button
                    class="primary"
                    onclick="createNewQuiz()"
                >
                    ➕ New Blank Quiz
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
                        onclick="exportQuiz()"
                    >
                        📤 Export
                    </button>

                </div>

            </div>


            <label>
                Quiz Title
            </label>


            <input
                id="quizTitle"
                type="text"
                placeholder="Quiz title"
                value="${escapeHTML(
                    currentQuiz.title
                )}"
                oninput="updateQuizTitle(this.value)"
            >


            <label>
                Description
            </label>


            <textarea
                id="quizDescription"
                placeholder="Quiz description"
                oninput="updateQuizDescription(this.value)"
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


            <div id="questionList"></div>


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
   RENDER QUESTIONS
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
                    No
