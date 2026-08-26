/* =========================================================
   QUIZFORGE LIBRARY
   My Quizzes / Public Quizzes / Search / Publish
========================================================= */

const QuizLibrary = {


    STORAGE_KEY:
        "quizforge_quizzes",

    PUBLIC_KEY:
        "quizforge_public_quizzes",


    /* =====================================================
       LOCAL QUIZZES
    ===================================================== */

    getMyQuizzes() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    this.STORAGE_KEY
                ) || "[]"
            );

        } catch {

            return [];

        }

    },


    saveMyQuiz(
        quiz
    ) {

        const quizzes =
            this.getMyQuizzes();


        const index =
            quizzes.findIndex(
                item =>
                    item.id ===
                    quiz.id
            );


        if (index === -1) {

            quizzes.push(
                quiz
            );

        } else {

            quizzes[index] =
                quiz;

        }


        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(
                quizzes
            )
        );

        return quiz;

    },


    deleteQuiz(
        id
    ) {

        let quizzes =
            this.getMyQuizzes();


        quizzes =
            quizzes.filter(
                quiz =>
                    quiz.id !== id
            );


        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(
                quizzes
            )
        );

        this.renderMyQuizzes();

    },


    /* =====================================================
       PUBLIC LIBRARY
    ===================================================== */

    getPublicQuizzes() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    this.PUBLIC_KEY
                ) || "[]"
            );

        } catch {

            return [];

        }

    },


    publish(
        quiz
    ) {

        if (
            typeof Auth === "undefined" ||
            !Auth.isLoggedIn()
        ) {

            alert(
                "🔐 Please log in before publishing."
            );

            return false;

        }


        if (
            !quiz ||
            !quiz.title ||
            !quiz.questions ||
            !quiz.questions.length
        ) {

            alert(
                "Your quiz is incomplete."
            );

            return false;

        }


        const user =
            Auth.currentUser;


        const publicQuizzes =
            this.getPublicQuizzes();


        /*
         * Make a public copy.
         */

        const publicQuiz = {

            ...JSON.parse(
                JSON.stringify(
                    quiz
                )
            ),

            publicID:
                this.createID(),

            authorID:
                user.id,

            author:
                user.username,

            publishedAt:
                new Date().toISOString(),

            plays: 0,

            likes: 0,

            public: true

        };


        publicQuizzes.push(
            publicQuiz
        );


        localStorage.setItem(
            this.PUBLIC_KEY,
            JSON.stringify(
                publicQuizzes
            )
        );


        Economy.unlockBadge(
            "publisher"
        );


        alert(
            "🌎 Your quiz was published to the public library!"
        );


        this.renderPublicLibrary();

        return publicQuiz;

    },


    /* =====================================================
       SEARCH
    ===================================================== */

    search(
        searchText = "",
        category = "all"
    ) {

        const quizzes =
            this.getPublicQuizzes();


        searchText =
            searchText
                .toLowerCase()
                .trim();


        return quizzes.filter(
            quiz => {

                const matchesText =
                    !searchText ||
                    quiz.title
                        .toLowerCase()
                        .includes(
                            searchText
                        ) ||
                    (
                        quiz.description ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        ) ||
                    (
                        quiz.author ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        );


                const matchesCategory =
                    category === "all" ||
                    quiz.category ===
                    category;


                return (
                    matchesText &&
                    matchesCategory
                );

            }
        );

    },


    /* =====================================================
       PLAY
    ===================================================== */

    play(
        id
    ) {

        const quizzes =
            this.getPublicQuizzes();


        const quiz =
            quizzes.find(
                item =>
                    item.publicID === id ||
                    item.id === id
            );


        if (!quiz) {

            alert(
                "Quiz not found."
            );

            return;

        }


        quiz.plays =
            (quiz.plays || 0) + 1;


        localStorage.setItem(
            this.PUBLIC_KEY,
            JSON.stringify(
                quizzes
            )
        );


        if (
            typeof QuizPlayer !==
            "undefined"
        ) {

            QuizPlayer.start(
                quiz
            );

        }

    },


    /* =====================================================
       RENDER MY QUIZZES
    ===================================================== */

    renderMyQuizzes(
        containerID =
            "myQuizLibrary"
    ) {

        const container =
            document.getElementById(
                containerID
            );

        if (!container) return;


        const quizzes =
            this.getMyQuizzes();


        if (!quizzes.length) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        📚 No quizzes yet
                    </h2>

                    <p>
                        Create your first quiz!
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            quizzes
                .map(
                    quiz => `

                        <div class="quiz-card">

                            <h3>
                                ${this.escape(
                                    quiz.title ||
                                    "Untitled Quiz"
                                )}
                            </h3>

                            <p>
                                ${
                                    quiz.questions.length
                                }
                                questions
                            </p>

                            <div>

                                <button
                                    onclick="
                                        QuizEditor.loadQuiz(
                                            '${quiz.id}'
                                        )
                                    "
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    onclick="
                                        QuizPlayer.start(
                                            ${JSON.stringify(
                                                quiz
                                            ).replace(
                                                /"/g,
                                                "&quot;"
                                            )}
                                        )
                                    "
                                >
                                    ▶ Play
                                </button>

                                <button
                                    class="danger"
                                    onclick="
                                        QuizLibrary.deleteQuiz(
                                            '${quiz.id}'
                                        )
                                    "
                                >
                                    🗑️
                                </button>

                            </div>

                        </div>

                    `
                )
                .join("");

    },


    /* =====================================================
       RENDER PUBLIC LIBRARY
    ===================================================== */

    renderPublicLibrary(
        containerID =
            "libraryGrid"
    ) {

        const container =
            document.getElementById(
                containerID
            );

        if (!container) return;


        const quizzes =
            this.search();


        if (!quizzes.length) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        🌎 Public Library
                    </h2>

                    <p>
                        No public quizzes yet.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML =
            quizzes
                .map(
                    quiz => `

                        <div class="quiz-card">

                            <h3>
                                ${this.escape(
                                    quiz.title
                                )}
                            </h3>

                            <p>
                                ${this.escape(
                                    quiz.description ||
                                    "No description"
                                )}
                            </p>

                            <small>
                                👤
                                ${this.escape(
                                    quiz.author ||
                                    "Unknown"
                                )}
                            </small>

                            <br>

                            <small>
                                🌎
                                ${quiz.plays || 0}
                                plays
                            </small>

                            <br><br>

                            <button
                                class="primary"
                                onclick="
                                    QuizLibrary.play(
                                        '${quiz.publicID}'
                                    )
                                "
                            >
                                ▶ Play
                            </button>

                        </div>

                    `
                )
                .join("");

    },


    /* =====================================================
       ID
    ===================================================== */

    createID() {

        if (
            crypto &&
            crypto.randomUUID
        ) {

            return crypto.randomUUID();

        }


        return (
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2)
        );

    },


    escape(
        value
    ) {

        return String(
            value || ""
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

};


/*
 * Load library when page loads.
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        QuizLibrary.renderMyQuizzes();

        QuizLibrary.renderPublicLibrary();

    }
);
