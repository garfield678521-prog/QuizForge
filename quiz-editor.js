/* =========================================================
   QUIZFORGE — QUIZ EDITOR
   Creates a NEW BLANK quiz every time.
   Handles:
   - Creating quizzes
   - Questions
   - Multiple choice
   - Correct answers
   - Timers
   - Saving
   - .qz export/import
   - Publishing
========================================================= */

const QuizEditor = {

    currentQuiz: null,
    currentQuestion: 0,

    /* -----------------------------------------------------
       CREATE A COMPLETELY NEW QUIZ
    ----------------------------------------------------- */

    createNewQuiz() {

        this.currentQuiz = {

            id: crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(),

            title: "",

            description: "",

            category: "General",

            difficulty: "Easy",

            questions: [],

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };

        this.currentQuestion = 0;

        /*
         * IMPORTANT:
         * We deliberately DO NOT copy the previous quiz.
         */

        this.render();

    },


    /* -----------------------------------------------------
       ADD QUESTION
    ----------------------------------------------------- */

    addQuestion() {

        if (!this.currentQuiz) {
            this.createNewQuiz();
        }

        const question = {

            id:
                Date.now().toString() +
                Math.random()
                    .toString(36)
                    .slice(2),

            text: "",

            type: "multiple-choice",

            answers: [

                {
                    id: "a",
                    text: "",
                    correct: false
                },

                {
                    id: "b",
                    text: "",
                    correct: false
                },

                {
                    id: "c",
                    text: "",
                    correct: false
                },

                {
                    id: "d",
                    text: "",
                    correct: false
                }

            ],

            timeLimit: 30,

            points: 100,

            image: ""

        };

        this.currentQuiz.questions.push(
            question
        );

        this.currentQuestion =
            this.currentQuiz.questions.length - 1;

        this.render();

    },


    /* -----------------------------------------------------
       DELETE QUESTION
    ----------------------------------------------------- */

    deleteQuestion(index) {

        if (!this.currentQuiz) return;

        if (
            !confirm(
                "Delete this question?"
            )
        ) {
            return;
        }

        this.currentQuiz.questions.splice(
            index,
            1
        );

        if (
            this.currentQuestion >=
            this.currentQuiz.questions.length
        ) {

            this.currentQuestion =
                Math.max(
                    0,
                    this.currentQuiz.questions.length - 1
                );

        }

        this.render();

    },


    /* -----------------------------------------------------
       UPDATE QUIZ INFORMATION
    ----------------------------------------------------- */

    updateInfo(
        field,
        value
    ) {

        if (!this.currentQuiz) return;

        this.currentQuiz[field] =
            value;

        this.currentQuiz.updatedAt =
            new Date().toISOString();

    },


    /* -----------------------------------------------------
       UPDATE QUESTION
    ----------------------------------------------------- */

    updateQuestion(
        index,
        field,
        value
    ) {

        if (!this.currentQuiz) return;

        const question =
            this.currentQuiz.questions[index];

        if (!question) return;

        question[field] =
            value;

        this.currentQuiz.updatedAt =
            new Date().toISOString();

    },


    /* -----------------------------------------------------
       UPDATE ANSWER
    ----------------------------------------------------- */

    updateAnswer(
        questionIndex,
        answerIndex,
        value
    ) {

        const question =
            this.currentQuiz
                ?.questions[
                    questionIndex
                ];

        if (!question) return;

        if (!question.answers[answerIndex]) {
            return;
        }

        question.answers[
            answerIndex
        ].text = value;

        this.currentQuiz.updatedAt =
            new Date().toISOString();

    },


    /* -----------------------------------------------------
       SET CORRECT ANSWER
    ----------------------------------------------------- */

    setCorrectAnswer(
        questionIndex,
        answerIndex
    ) {

        const question =
            this.currentQuiz
                ?.questions[
                    questionIndex
                ];

        if (!question) return;

        question.answers.forEach(
            (answer, index) => {

                answer.correct =
                    index === answerIndex;

            }
        );

        this.currentQuiz.updatedAt =
            new Date().toISOString();

        this.render();

    },


    /* -----------------------------------------------------
       SAVE LOCALLY
    ----------------------------------------------------- */

    save() {

        if (!this.currentQuiz) {
            alert(
                "There is no quiz to save."
            );
            return;
        }

        this.currentQuiz.updatedAt =
            new Date().toISOString();

        const quizzes =
            JSON.parse(
                localStorage.getItem(
                    "quizforge_quizzes"
                ) || "[]"
            );

        const existing =
            quizzes.findIndex(
                quiz =>
                    quiz.id ===
                    this.currentQuiz.id
            );

        if (existing >= 0) {

            quizzes[existing] =
                this.currentQuiz;

        } else {

            quizzes.push(
                this.currentQuiz
            );

        }

        localStorage.setItem(
            "quizforge_quizzes",
            JSON.stringify(quizzes)
        );

        alert(
            "✅ Quiz saved!"
        );

    },


    /* -----------------------------------------------------
       LOAD QUIZ
    ----------------------------------------------------- */

    loadQuiz(
        id
    ) {

        const quizzes =
            JSON.parse(
                localStorage.getItem(
                    "quizforge_quizzes"
                ) || "[]"
            );

        const quiz =
            quizzes.find(
                item =>
                    item.id === id
            );

        if (!quiz) {

            alert(
                "Quiz could not be found."
            );

            return;

        }

        this.currentQuiz =
            JSON.parse(
                JSON.stringify(
                    quiz
                )
            );

        this.currentQuestion = 0;

        this.render();

    },


    /* -----------------------------------------------------
       EXPORT .QZ FILE
    ----------------------------------------------------- */

    exportQZ() {

        if (!this.currentQuiz) {

            alert(
                "Create a quiz first."
            );

            return;

        }

        const data = {

            format: "QuizForge",

            version: 1,

            quiz:
                this.currentQuiz

        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
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

        link.href = url;

        link.download =
            (
                this.currentQuiz.title
                    .trim()
                    .replace(
                        /[^a-z0-9]/gi,
                        "_"
                    ) ||
                "quizforge_quiz"
            ) +
            ".qz";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

    },


    /* -----------------------------------------------------
       IMPORT .QZ
    ----------------------------------------------------- */

    importQZ(
        file
    ) {

        if (!file) return;

        const reader =
            new FileReader();

        reader.onload =
            event => {

                try {

                    const data =
                        JSON.parse(
                            event.target.result
                        );

                    let quiz =
                        data.quiz ||
                        data;

                    if (
                        !quiz ||
                        !Array.isArray(
                            quiz.questions
                        )
                    ) {

                        throw new Error(
                            "Invalid QuizForge file."
                        );

                    }

                    /*
                     * Give imported quizzes a
                     * fresh ID so they don't
                     * overwrite another quiz.
                     */

                    quiz.id =
                        crypto.randomUUID
                            ? crypto.randomUUID()
                            : Date.now().toString();

                    this.currentQuiz =
                        quiz;

                    this.currentQuestion =
                        0;

                    this.render();

                    alert(
                        "✅ Quiz imported!"
                    );

                }

                catch(error) {

                    alert(
                        "❌ Could not import .qz file.\n\n" +
                        error.message
                    );

                }

            };

        reader.readAsText(
            file
        );

    },


    /* -----------------------------------------------------
       PUBLISH
    ----------------------------------------------------- */

    async publish() {

        if (!this.currentQuiz) {

            alert(
                "Create a quiz first."
            );

            return;

        }

        if (
            !this.currentQuiz.title.trim()
        ) {

            alert(
                "Give your quiz a title first."
            );

            return;

        }

        if (
            this.currentQuiz.questions.length === 0
        ) {

            alert(
                "Add at least one question."
            );

            return;

        }

        if (
            typeof QuizLibrary !==
            "undefined" &&
            QuizLibrary.publish
        ) {

            await QuizLibrary.publish(
                this.currentQuiz
            );

            return;

        }

        alert(
            "Online publishing is not available yet."
        );

    },


    /* -----------------------------------------------------
       VALIDATE QUIZ
    ----------------------------------------------------- */

    validate() {

        if (!this.currentQuiz) {
            return false;
        }

        for (
            const question
            of this.currentQuiz.questions
        ) {

            if (
                !question.text.trim()
            ) {

                alert(
                    "Every question needs text."
                );

                return false;

            }

            const correct =
                question.answers.filter(
                    answer =>
                        answer.correct
                );

            if (
                correct.length === 0
            ) {

                alert(
                    "Every question needs a correct answer."
                );

                return false;

            }

            const hasAnswer =
                question.answers.some(
                    answer =>
                        answer.text.trim()
                );

            if (!hasAnswer) {

                alert(
                    "Every question needs at least one answer."
                );

                return false;

            }

        }

        return true;

    },


    /* -----------------------------------------------------
       RENDER EDITOR
    ----------------------------------------------------- */

    render() {

        const container =
            document.getElementById(
                "quizEditor"
            );

        if (!container) return;

        if (!this.currentQuiz) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        Create a Quiz
                    </h2>

                    <p>
                        Start with a completely blank quiz.
                    </p>

                    <button
                        class="primary"
                        onclick="
                            QuizEditor.createNewQuiz()
                        "
                    >
                        ➕ Create Blank Quiz
                    </button>

                </div>

            `;

            return;

        }

        container.innerHTML = `

            <div class="editor-header">

                <h1>
                    ✏️ Quiz Editor
                </h1>

                <div class="editor-buttons">

                    <button
                        onclick="
                            QuizEditor.save()
                        "
                    >
                        💾 Save
                    </button>

                    <button
                        onclick="
                            QuizEditor.exportQZ()
                        "
                    >
                        📤 Export .qz
                    </button>

                    <button
                        onclick="
                            QuizEditor.publish()
                        "
                    >
                        🌎 Publish
                    </button>

                </div>

            </div>


            <div class="card">

                <label>
                    Quiz Title
                </label>

                <input
                    type="text"
                    value="${escapeHTML(
                        this.currentQuiz.title
                    )}"
                    placeholder="Enter quiz title..."
                    oninput="
                        QuizEditor.updateInfo(
                            'title',
                            this.value
                        )
                    "
                />


                <label>
                    Description
                </label>

                <textarea
                    placeholder="Describe your quiz..."
                    oninput="
                        QuizEditor.updateInfo(
                            'description',
                            this.value
                        )
                    "
                >${escapeHTML(
                    this.currentQuiz.description
                )}</textarea>


                <label>
                    Category
                </label>

                <select
                    onchange="
                        QuizEditor.updateInfo(
                            'category',
                            this.value
                        )
                    "
                >

                    ${[
                        "General",
                        "Minecraft",
                        "Science",
                        "Math",
                        "History",
                        "Geography",
                        "Technology",
                        "Gaming",
                        "Sport",
                        "Other"
                    ].map(
                        category => `
                            <option
                                ${
                                    this.currentQuiz.category ===
                                    category
                                    ? "selected"
                                    : ""
                                }
                            >
                                ${category}
                            </option>
                        `
                    ).join("")}

                </select>


                <label>
                    Difficulty
                </label>

                <select
                    onchange="
                        QuizEditor.updateInfo(
                            'difficulty',
                            this.value
                        )
                    "
                >

                    ${[
                        "Easy",
                        "Medium",
                        "Hard",
                        "Extreme"
                    ].map(
                        difficulty => `
                            <option
                                ${
                                    this.currentQuiz.difficulty ===
                                    difficulty
                                    ? "selected"
                                    : ""
                                }
                            >
                                ${difficulty}
                            </option>
                        `
                    ).join("")}

                </select>

            </div>


            <div class="editor-layout">

                <aside class="question-list">

                    <h3>
                        Questions
                    </h3>

                    ${this.currentQuiz.questions
                        .map(
                            (question, index) => `

                                <button
                                    class="
                                        question-list-item
                                        ${
                                            index ===
                                            this.currentQuestion
                                                ? "active"
                                                : ""
                                        }
                                    "
                                    onclick="
                                        QuizEditor.currentQuestion =
                                            ${index};
                                        QuizEditor.render();
                                    "
                                >

                                    ${index + 1}.
                                    ${
                                        question.text
                                            ? escapeHTML(
                                                question.text
                                            ).slice(0, 30)
                                            : "New question"
                                    }

                                </button>

                            `
                        )
                        .join("")}


                    <button
                        class="primary"
                        onclick="
                            QuizEditor.addQuestion()
                        "
                    >
                        ➕ Add Question
                    </button>

                </aside>


                <main class="question-editor">

                    ${this.renderCurrentQuestion()}

                </main>

            </div>

        `;

    },


    /* -----------------------------------------------------
       RENDER CURRENT QUESTION
    ----------------------------------------------------- */

    renderCurrentQuestion() {

        const question =
            this.currentQuiz.questions[
                this.currentQuestion
            ];

        if (!question) {

            return `

                <div class="card">

                    <h2>
                        No questions yet
                    </h2>

                    <p>
                        Click "Add Question" to begin.
                    </p>

                </div>

            `;

        }

        return `

            <div class="card">

                <div class="question-editor-header">

                    <h2>
                        Question
                        ${this.currentQuestion + 1}
                    </h2>

                    <button
                        class="danger"
                        onclick="
                            QuizEditor.deleteQuestion(
                                ${this.currentQuestion}
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
                    placeholder="Type your question..."
                    oninput="
                        QuizEditor.updateQuestion(
                            ${this.currentQuestion},
                            'text',
                            this.value
                        )
                    "
                >${escapeHTML(
                    question.text
                )}</textarea>


                <label>
                    Time Limit
                </label>

                <input
                    type="number"
                    min="5"
                    max="300"
                    value="${question.timeLimit}"
                    oninput="
                        QuizEditor.updateQuestion(
                            ${this.currentQuestion},
                            'timeLimit',
                            Number(this.value)
                        )
                    "
                />


                <label>
                    Points
                </label>

                <input
                    type="number"
                    min="1"
                    max="10000"
                    value="${question.points}"
                    oninput="
                        QuizEditor.updateQuestion(
                            ${this.currentQuestion},
                            'points',
                            Number(this.value)
                        )
                    "
                />


                <h3>
                    Answers
                </h3>


                <div class="answers-editor">

                    ${question.answers
                        .map(
                            (answer, index) => `

                                <div
                                    class="
                                        answer-editor
                                        ${
                                            answer.correct
                                                ? "correct"
                                                : ""
                                        }
                                    "
                                >

                                    <button
                                        onclick="
                                            QuizEditor.setCorrectAnswer(
                                                ${this.currentQuestion},
                                                ${index}
                                            )
                                        "
                                    >
                                        ${
                                            answer.correct
                                                ? "✅"
                                                : "⭕"
                                        }
                                    </button>


                                    <input
                                        type="text"
                                        value="${escapeHTML(
                                            answer.text
                                        )}"
                                        placeholder="
                                            Answer ${
                                                index + 1
                                            }
                                        "
                                        oninput="
                                            QuizEditor.updateAnswer(
                                                ${this.currentQuestion},
                                                ${index},
                                                this.value
                                            )
                                        "
                                    />

                                </div>

                            `
                        )
                        .join("")}

                </div>

                <p class="hint">
                    Click ⭕ beside an answer to make it correct.
                </p>

            </div>

        `;

    }

};


/* =========================================================
   FILE INPUT HELPER
========================================================= */

function openQZImporter() {

    const input =
        document.createElement(
            "input"
        );

    input.type =
        "file";

    input.accept =
        ".qz,.json";

    input.onchange =
        () => {

            if (
                input.files &&
                input.files[0]
            ) {

                QuizEditor.importQZ(
                    input.files[0]
                );

            }

        };

    input.click();

}
