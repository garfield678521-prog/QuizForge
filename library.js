/* =========================================================
   QUIZFORGE LIBRARY
   SUPABASE VERSION
========================================================= */

const QuizLibrary = {

    currentTab: "mine",

    /* =====================================================
       GET SUPABASE CLIENT
    ===================================================== */

    getClient() {

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.supabase) {
            return window.supabase;
        }

        console.error(
            "Supabase client was not found."
        );

        return null;
    },


    /* =====================================================
       GET USER
    ===================================================== */

    async getUser() {

        const supabase =
            this.getClient();

        if (!supabase) {
            return null;
        }

        const {
            data,
            error
        } =
            await supabase.auth.getUser();

        if (error) {
            console.error(error);
            return null;
        }

        return data.user;
    },


    /* =====================================================
       SHOW MY QUIZZES
    ===================================================== */

    async showMyQuizzes() {

        this.currentTab = "mine";

        await this.loadMyQuizzes();

    },


    /* =====================================================
       SHOW PUBLIC LIBRARY
    ===================================================== */

    async showPublicLibrary() {

        this.currentTab = "public";

        await this.loadPublicQuizzes();

    },


    /* =====================================================
       LOAD MY QUIZZES
    ===================================================== */

    async loadMyQuizzes() {

        const container =
            document.getElementById(
                "quizLibrary"
            );

        if (!container) return;


        container.innerHTML = `
            <div class="card">
                <h2>👤 My Quizzes</h2>
                <p>Loading your quizzes...</p>
            </div>
        `;


        const supabase =
            this.getClient();

        if (!supabase) {

            this.showError(
                "Supabase isn't connected."
            );

            return;
        }


        const user =
            await this.getUser();


        if (!user) {

            container.innerHTML = `
                <div class="card">
                    <h2>🔐 Login Required</h2>

                    <p>
                        Log in to see your quizzes.
                    </p>

                    <button
                        class="primary"
                        onclick="showPage('login')"
                    >
                        Login
                    </button>
                </div>
            `;

            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("quizzes")
                .select("*")
                .eq(
                    "user_id",
                    user.id
                )
                .order(
                    "updated_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Quiz loading error:",
                error
            );

            this.showError(
                error.message
            );

            return;
        }


        this.renderQuizzes(
            data || [],
            false
        );

    },


    /* =====================================================
       LOAD PUBLIC QUIZZES
    ===================================================== */

    async loadPublicQuizzes() {

        const container =
            document.getElementById(
                "quizLibrary"
            );

        if (!container) return;


        container.innerHTML = `
            <div class="card">
                <h2>🌎 Public Library</h2>
                <p>Loading quizzes from around the world...</p>
            </div>
        `;


        const supabase =
            this.getClient();

        if (!supabase) {

            this.showError(
                "Supabase isn't connected."
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabase
                .from("quizzes")
                .select("*")
                .eq(
                    "is_public",
                    true
                )
                .order(
                    "plays",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(error);

            this.showError(
                error.message
            );

            return;
        }


        this.renderQuizzes(
            data || [],
            true
        );

    },


    /* =====================================================
       RENDER
    ===================================================== */

    renderQuizzes(
        quizzes,
        isPublic
    ) {

        const container =
            document.getElementById(
                "quizLibrary"
            );

        if (!container) return;


        if (!quizzes.length) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        ${
                            isPublic
                                ? "🌎 No Public Quizzes Yet"
                                : "👤 No Quizzes Yet"
                        }
                    </h2>

                    <p>
                        ${
                            isPublic
                                ? "Be the first to publish a quiz!"
                                : "Create your first quiz."
                        }
                    </p>

                    <button
                        class="primary"
                        onclick="openQuizCreator()"
                    >
                        ➕ Create Quiz
                    </button>

                </div>

            `;

            return;
        }


        container.innerHTML = `

            <div class="library-grid">

                ${quizzes
                    .map(
                        quiz =>
                            this.createQuizCard(
                                quiz,
                                isPublic
                            )
                    )
                    .join("")}

            </div>

        `;

    },


    /* =====================================================
       QUIZ CARD
    ===================================================== */

    createQuizCard(
        quiz,
        isPublic
    ) {

        const questionCount =
            Array.isArray(
                quiz.questions
            )
                ? quiz.questions.length
                : 0;


        return `

            <div class="card quiz-card">

                <h2>
                    ${this.escape(
                        quiz.title ||
                        "Untitled Quiz"
                    )}
                </h2>


                <p>
                    ${this.escape(
                        quiz.description ||
                        "No description"
                    )}
                </p>


                <div class="quiz-meta">

                    <span>
                        ❓ ${questionCount}
                        questions
                    </span>

                    <span>
                        🎮 ${quiz.plays || 0}
                        plays
                    </span>

                </div>


                <p>
                    👤 ${this.escape(
                        quiz.author ||
                        "Unknown"
                    )}
                </p>


                <button
                    class="primary"
                    onclick="QuizLibrary.playQuiz(
                        '${quiz.id}'
                    )"
                >
                    🎮 Play
                </button>


                ${
                    !isPublic
                        ? `
                            <button
                                onclick="QuizLibrary.editQuiz(
                                    '${quiz.id}'
                                )"
                            >
                                ✏️ Edit
                            </button>

                            <button
                                onclick="QuizLibrary.publishQuiz(
                                    '${quiz.id}'
                                )"
                            >
                                🌎 Publish
                            </button>
                        `
                        : ""
                }

            </div>

        `;

    },


    /* =====================================================
       SAVE QUIZ TO SUPABASE
    ===================================================== */

    async saveQuiz(
        quiz
    ) {

        const supabase =
            this.getClient();

        if (!supabase) {
            throw new Error(
                "Supabase unavailable."
            );
        }


        const user =
            await this.getUser();


        if (!user) {

            throw new Error(
                "You must be logged in."
            );

        }


        const row = {

            user_id:
                user.id,

            title:
                quiz.title ||
                "Untitled Quiz",

            description:
                quiz.description ||
                "",

            author:
                user.user_metadata?.username ||
                user.email ||
                "Player",

            questions:
                quiz.questions ||
                [],

            is_public:
                quiz.is_public ||
                false,

            updated_at:
                new Date().toISOString()

        };


        let result;


        if (quiz.id) {

            result =
                await supabase
                    .from("quizzes")
                    .update(row)
                    .eq(
                        "id",
                        quiz.id
                    )
                    .eq(
                        "user_id",
                        user.id
                    )
                    .select()
                    .single();

        }

        else {

            result =
                await supabase
                    .from("quizzes")
                    .insert(row)
                    .select()
                    .single();

        }


        if (result.error) {

            throw result.error;

        }


        return result.data;

    },


    /* =====================================================
       PUBLISH
    ===================================================== */

    async publishQuiz(
        quizID
    ) {

        const supabase =
            this.getClient();

        const user =
            await this.getUser();


        if (!user) {

            alert(
                "Please log in first."
            );

            return;

        }


        const {
            error
        } =
            await supabase
                .from("quizzes")
                .update({
                    is_public: true,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    quizID
                )
                .eq(
                    "user_id",
                    user.id
                );


        if (error) {

            alert(
                "Could not publish quiz:\n" +
                error.message
            );

            return;

        }


        alert(
            "🌎 Your quiz is now public!"
        );


        await this.loadMyQuizzes();

    },


    /* =====================================================
       EDIT
    ===================================================== */

    async editQuiz(
        quizID
    ) {

        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from("quizzes")
                .select("*")
                .eq(
                    "id",
                    quizID
                )
                .single();


        if (error) {

            alert(
                error.message
            );

            return;

        }


        currentQuiz = {

            format:
                "QuizForge",

            version:
                1,

            id:
                data.id,

            title:
                data.title,

            description:
                data.description,

            author:
                data.author,

            questions:
                data.questions || [],

            createdAt:
                data.created_at,

            updatedAt:
                data.updated_at

        };


        showPage("create");


        if (
            typeof renderQuizEditor ===
            "function"
        ) {

            renderQuizEditor();

        }

    },


    /* =====================================================
       PLAY
    ===================================================== */

    async playQuiz(
        quizID
    ) {

        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from("quizzes")
                .select("*")
                .eq(
                    "id",
                    quizID
                )
                .single();


        if (error) {

            alert(
                error.message
            );

            return;

        }


        /*
         * Increase play count.
         */

        await supabase
            .from("quizzes")
            .update({
                plays:
                    (data.plays || 0) + 1
            })
            .eq(
                "id",
                quizID
            );


        if (
            typeof startQuiz ===
            "function"
        ) {

            startQuiz(
                data
            );

        }

        else {

            window.selectedQuiz =
                data;

            showPage("play");

        }

    },


    /* =====================================================
       ERROR
    ===================================================== */

    showError(
        message
    ) {

        const container =
            document.getElementById(
                "quizLibrary"
            );

        if (!container) return;


        container.innerHTML = `

            <div class="card">

                <h2>
                    ❌ Library Error
                </h2>

                <p>
                    ${this.escape(
                        message
                    )}
                </p>

                <button
                    onclick="QuizLibrary.showMyQuizzes()"
                >
                    🔄 Try Again
                </button>

            </div>

        `;

    },


    /* =====================================================
       ESCAPE
    ===================================================== */

    escape(
        text
    ) {

        return String(
            text ?? ""
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


/* =========================================================
   COMPATIBILITY FUNCTIONS
========================================================= */

async function loadMyQuizzes() {

    await QuizLibrary.showMyQuizzes();

}


async function loadPublicLibrary() {

    await QuizLibrary.showPublicLibrary();

}


async function loadPublicQuizzes() {

    await QuizLibrary.showPublicLibrary();

}


/*
 * IMPORTANT:
 * Library defaults to YOUR quizzes.
 */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setTimeout(
            function() {

                QuizLibrary.showMyQuizzes();

            },
            300
        );

    }
);
