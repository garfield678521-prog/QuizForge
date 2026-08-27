/* =========================================================
   QUIZFORGE LIBRARY
   Supabase quiz saving/loading
========================================================= */

const QuizLibrary = {

    quizzes: [],

    mode: "mine",

    async getUser() {

        const {
            data,
            error
        } = await window.supabaseClient
            .auth
            .getUser();

        if (error) {
            console.error(error);
            return null;
        }

        return data.user;

    },


    async loadMyQuizzes() {

        const user =
            await this.getUser();

        const container =
            document.getElementById(
                "quizLibrary"
            );

        if (!user) {

            container.innerHTML = `
                <div class="card empty-state">
                    <h2>🔐 Login required</h2>

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

            return [];

        }


        const {
            data,
            error
        } = await window.supabaseClient
            .from("quizzes")
            .select("*")
            .eq(
                "owner_id",
                user.id
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(error);

            container.innerHTML = `
                <div class="card status error">
                    ❌ Could not load quizzes.
                    <br>
                    ${this.escape(
                        error.message
                    )}
                </div>
            `;

            return [];

        }


        this.quizzes =
            data || [];

        this.render();

        return this.quizzes;

    },


    async loadPublicQuizzes() {

        const container =
            document.getElementById(
                "quizLibrary"
            );


        const {
            data,
            error
        } = await window.supabaseClient
            .from("quizzes")
            .select("*")
            .eq(
                "is_public",
                true
            )
            .order(
                "updated_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(error);

            container.innerHTML = `
                <div class="card status error">
                    ❌ Could not load public quizzes.
                </div>
            `;

            return [];

        }


        this.quizzes =
            data || [];

        this.render();

        return this.quizzes;

    },


    async showMyQuizzes() {

        this.mode =
            "mine";


        this.setTab(
            "myQuizzesTab",
            "publicLibraryTab"
        );


        await this.loadMyQuizzes();

    },


    async showPublicLibrary() {

        this.mode =
            "public";


        this.setTab(
            "publicLibraryTab",
            "myQuizzesTab"
        );


        await this.loadPublicQuizzes();

    },


    setTab(
        active,
        inactive
    ) {

        document
            .getElementById(active)
            ?.classList
            .add("active");

        document
            .getElementById(inactive)
            ?.classList
            .remove("active");

    },


    render() {

        const container =
            document.getElementById(
                "quizLibrary"
            );


        if (!container) {
            return;
        }


        if (!this.quizzes.length) {

            container.innerHTML = `
                <div class="card empty-state">

                    <h2>
                        ${
                            this.mode === "mine"
                                ? "📭 No quizzes yet"
                                : "🌎 No public quizzes yet"
                        }
                    </h2>

                    <p>
                        ${
                            this.mode === "mine"
                                ? "Create your first quiz!"
                                : "Be the first to publish one!"
                        }
                    </p>

                    <button
                        class="primary"
                        onclick="openCreateQuiz()"
                    >
                        ➕ Create Quiz
                    </button>

                </div>
            `;

            return;

        }


        container.innerHTML = `
            <div class="library-grid">

                ${
                    this.quizzes
                        .map(
                            quiz =>
                                this.quizCard(
                                    quiz
                                )
                        )
                        .join("")
                }

            </div>
        `;

    },


    quizCard(
        quiz
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
                        quiz.title
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

                ${
                    this.mode === "mine"
                        ?

                    `
                        <button
                            class="primary"
                            onclick="
                                QuizLibrary.editQuiz(
                                    '${quiz.id}'
                                )
                            "
                        >
                            ✏️ Edit
                        </button>

                        <button
                            onclick="
                                QuizLibrary.togglePublic(
                                    '${quiz.id}',
                                    ${!quiz.is_public}
                                )
                            "
                        >
                            ${
                                quiz.is_public
                                    ? "🔒 Unpublish"
                                    : "🌎 Publish"
                            }
                        </button>

                        <button
                            class="danger"
                            onclick="
                                QuizLibrary.deleteQuiz(
                                    '${quiz.id}'
                                )
                            "
                        >
                            🗑️ Delete
                        </button>
                    `

                        :

                    `
                        <button
                            class="primary"
                            onclick="
                                QuizLibrary.playQuiz(
                                    '${quiz.id}'
                                )
                            "
                        >
                            ▶️ Play
                        </button>
                    `
                }

            </div>
        `;

    },


    async editQuiz(
        id
    ) {

        const quiz =
            this.quizzes.find(
                q => q.id === id
            );


        if (!quiz) {

            alert(
                "Quiz not found."
            );

            return;

        }


        window.currentQuiz =
            JSON.parse(
                JSON.stringify(
                    quiz
                )
            );


        showPage(
            "create"
        );


        if (
            typeof renderQuizEditor ===
            "function"
        ) {

            renderQuizEditor(
                window.currentQuiz
            );

        }

    },


    async saveQuiz(
        quiz
    ) {

        const user =
            await this.getUser();


        if (!user) {

            alert(
                "Please log in before saving."
            );

            showPage(
                "login"
            );

            return null;

        }


        if (!quiz) {

            alert(
                "There is no quiz to save."
            );

            return null;

        }


        const payload = {

            title:
                quiz.title ||
                "Untitled Quiz",

            description:
                quiz.description ||
                "",

            questions:
                Array.isArray(
                    quiz.questions
                )
                    ? quiz.questions
                    : [],

            is_public:
                Boolean(
                    quiz.is_public
                ),

            updated_at:
                new Date()
                    .toISOString()

        };


        let result;


        /*
         * Existing quiz
         */

        if (quiz.id) {

            result =
                await window.supabaseClient
                    .from("quizzes")
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        quiz.id
                    )
                    .eq(
                        "owner_id",
                        user.id
                    )
                    .select()
                    .single();

        }


        /*
         * New quiz
         */

        else {

            result =
                await window.supabaseClient
                    .from("quizzes")
                    .insert({

                        ...payload,

                        owner_id:
                            user.id

                    })
                    .select()
                    .single();

        }


        if (result.error) {

            console.error(
                result.error
            );


            alert(
                "❌ Quiz could not be saved:\n\n" +
                result.error.message
            );


            return null;

        }


        window.currentQuiz =
            result.data;


        /*
         * Reward quiz creation.
         */

        if (
            !quiz.id &&
            window.Economy
        ) {

            await Economy.quizCreated();

        }


        alert(
            "✅ Quiz saved!"
        );


        await this.showMyQuizzes();


        return result.data;

    },


    async togglePublic(
        id,
        makePublic
    ) {

        const user =
            await this.getUser();


        if (!user) {
            return;
        }


        const {
            error
        } =
            await window.supabaseClient
                .from("quizzes")
                .update({

                    is_public:
                        makePublic,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "owner_id",
                    user.id
                );


        if (error) {

            alert(
                error.message
            );

            return;

        }


        await this.loadMyQuizzes();


        alert(
            makePublic
                ? "🌎 Quiz published!"
                : "🔒 Quiz removed from public library."
        );

    },


    async deleteQuiz(
        id
    ) {

        if (
            !confirm(
                "Delete this quiz permanently?"
            )
        ) {

            return;

        }


        const user =
            await this.getUser();


        if (!user) {
            return;
        }


        const {
            error
        } =
            await window.supabaseClient
                .from("quizzes")
                .delete()
                .eq(
                    "id",
                    id
                )
                .eq(
                    "owner_id",
                    user.id
                );


        if (error) {

            alert(
                error.message
            );

            return;

        }


        await this.loadMyQuizzes();

    },


    async playQuiz(
        id
    ) {

        const quiz =
            this.quizzes.find(
                q => q.id === id
            );


        if (!quiz) {
            return;
        }


        window.currentQuiz =
            quiz;


        showPage(
            "play"
        );


        if (
            typeof startQuiz ===
            "function"
        ) {

            startQuiz(
                quiz
            );

        }

    },


    escape(
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

};


window.QuizLibrary =
    QuizLibrary;
