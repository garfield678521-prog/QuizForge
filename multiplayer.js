/* =========================================================
   QUIZFORGE MULTIPLAYER
   SUPABASE + REALTIME
========================================================= */

const Multiplayer = {

    game: null,

    channel: null,

    /* =====================================================
       SUPABASE
    ===================================================== */

    getClient() {

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.supabase) {
            return window.supabase;
        }

        console.error(
            "Supabase client unavailable."
        );

        return null;
    },


    /* =====================================================
       USER
    ===================================================== */

    async getUser() {

        const supabase =
            this.getClient();

        if (!supabase) {
            return null;
        }


        const {
            data
        } =
            await supabase.auth.getUser();


        return data?.user || null;

    },


    /* =====================================================
       GENERATE GAME CODE
    ===================================================== */

    generateCode() {

        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


        let code = "";


        for (
            let i = 0;
            i < 6;
            i++
        ) {

            code +=
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

        }


        return code;

    },


    /* =====================================================
       HOST QUIZ
    ===================================================== */

    async hostQuiz() {

        const supabase =
            this.getClient();


        if (!supabase) {

            alert(
                "Supabase is not connected."
            );

            return;

        }


        const user =
            await this.getUser();


        if (!user) {

            alert(
                "You need to log in to host a game."
            );

            showPage("login");

            return;

        }


        /*
         * Get user's quizzes.
         */

        const {
            data: quizzes,
            error
        } =
            await supabase
                .from("quizzes")
                .select(
                    "id,title,questions"
                )
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

            alert(
                "Could not load your quizzes:\n" +
                error.message
            );

            return;

        }


        if (!quizzes?.length) {

            alert(
                "You need to create a quiz first."
            );

            showPage("create");

            return;

        }


        this.showHostQuizSelector(
            quizzes
        );

    },


    /* =====================================================
       QUIZ SELECTOR
    ===================================================== */

    showHostQuizSelector(
        quizzes
    ) {

        const gameArea =
            document.getElementById(
                "multiplayerGame"
            );


        if (!gameArea) return;


        gameArea.innerHTML = `

            <div class="card">

                <h2>
                    🎤 Host a Quiz
                </h2>

                <p>
                    Choose the quiz you want
                    to host.
                </p>


                <select
                    id="hostQuizSelect"
                >

                    ${quizzes
                        .map(
                            quiz =>
                                `
                                <option
                                    value="${quiz.id}"
                                >
                                    ${this.escape(
                                        quiz.title
                                    )}
                                </option>
                                `
                        )
                        .join("")}

                </select>


                <button
                    class="primary"
                    onclick="Multiplayer.createGame()"
                >
                    🚀 Create Game
                </button>

            </div>

        `;

    },


    /* =====================================================
       CREATE GAME
    ===================================================== */

    async createGame() {

        const supabase =
            this.getClient();


        const user =
            await this.getUser();


        const select =
            document.getElementById(
                "hostQuizSelect"
            );


        const quizID =
            select?.value;


        if (!quizID) {

            alert(
                "Please select a quiz."
            );

            return;

        }


        let code;


        /*
         * Keep trying until the code
         * is unique.
         */

        for (
            let attempt = 0;
            attempt < 10;
            attempt++
        ) {

            const candidate =
                this.generateCode();


            const {
                data
            } =
                await supabase
                    .from(
                        "multiplayer_games"
                    )
                    .select("id")
                    .eq(
                        "code",
                        candidate
                    )
                    .maybeSingle();


            if (!data) {

                code =
                    candidate;

                break;

            }

        }


        if (!code) {

            alert(
                "Could not generate a game code."
            );

            return;

        }


        const {
            data: game,
            error
        } =
            await supabase
                .from(
                    "multiplayer_games"
                )
                .insert({

                    code:

                        code,

                    host_id:

                        user.id,

                    quiz_id:

                        quizID,

                    status:

                        "waiting",

                    current_question:

                        -1,

                    results:

                        []

                })
                .select()
                .single();


        if (error) {

            console.error(error);

            alert(
                "Could not create game:\n" +
                error.message
            );

            return;

        }


        this.game =
            game;


        /*
         * Host automatically joins
         * as a player.
         */

        await this.joinPlayer(
            game.id,
            user
        );


        await this.subscribe(
            game.id
        );


        this.renderHostLobby();

    },


    /* =====================================================
       JOIN GAME
    ===================================================== */

    async joinQuiz(
        code
    ) {

        const supabase =
            this.getClient();


        const user =
            await this.getUser();


        if (!user) {

            alert(
                "You need to log in to join."
            );

            showPage("login");

            return;

        }


        code =
            String(
                code || ""
            )
                .trim()
                .toUpperCase();


        if (
            code.length !== 6
        ) {

            alert(
                "Game codes are 6 characters."
            );

            return;

        }


        const {
            data: game,
            error
        } =
            await supabase
                .from(
                    "multiplayer_games"
                )
                .select("*")
                .eq(
                    "code",
                    code
                )
                .maybeSingle();


        if (error) {

            alert(
                error.message
            );

            return;

        }


        if (!game) {

            alert(
                "❌ Game not found."
            );

            return;

        }


        if (
            game.status !==
            "waiting"
        ) {

            alert(
                "❌ This game has already started."
            );

            return;

        }


        this.game =
            game;


        const joined =
            await this.joinPlayer(
                game.id,
                user
            );


        if (!joined) {
            return;
        }


        await this.subscribe(
            game.id
        );


        this.renderPlayerLobby();

    },


    /* =====================================================
       JOIN PLAYER
    ===================================================== */

    async joinPlayer(
        gameID,
        user
    ) {

        const supabase =
            this.getClient();


        const username =
            user.user_metadata?.username ||
            user.email?.split("@")[0] ||
            "Player";


        const {
            error
        } =
            await supabase
                .from(
                    "multiplayer_players"
                )
                .upsert(
                    {

                        game_id:
                            gameID,

                        user_id:
                            user.id,

                        username:
                            username,

                        score:
                            0,

                        answered:
                            false

                    },
                    {
                        onConflict:
                            "game_id,user_id"
                    }
                );


        if (error) {

            console.error(error);

            alert(
                "Could not join game:\n" +
                error.message
            );

            return false;

        }


        return true;

    },


    /* =====================================================
       REALTIME
    ===================================================== */

    async subscribe(
        gameID
    ) {

        const supabase =
            this.getClient();


        /*
         * Remove previous channel.
         */

        if (this.channel) {

            await supabase.removeChannel(
                this.channel
            );

            this.channel =
                null;

        }


        this.channel =
            supabase
                .channel(
                    "quizforge-game-" +
                    gameID
                )


                /*
                 * Game updates.
                 */

                .on(
                    "postgres_changes",
                    {

                        event: "*",

                        schema: "public",

                        table:
                            "multiplayer_games",

                        filter:
                            "id=eq." +
                            gameID

                    },
                    payload => {

                        console.log(
                            "Game update:",
                            payload
                        );


                        if (
                            payload.new
                        ) {

                            this.game =
                                payload.new;

                            this.handleGameUpdate(
                                payload.new
                            );

                        }

                    }
                )


                /*
                 * Player joins,
                 * score changes etc.
                 */

                .on(
                    "postgres_changes",
                    {

                        event: "*",

                        schema: "public",

                        table:
                            "multiplayer_players",

                        filter:
                            "game_id=eq." +
                            gameID

                    },
                    payload => {

                        console.log(
                            "Player update:",
                            payload
                        );


                        this.loadPlayers();

                    }
                )


                .subscribe(
                    (
                        status,
                        error
                    ) => {

                        if (
                            status ===
                                "CHANNEL_ERROR" ||
                            status ===
                                "TIMED_OUT"
                        ) {

                            console.error(
                                "Realtime error:",
                                error
                            );

                        }

                    }
                );

    },


    /* =====================================================
       LOAD PLAYERS
    ===================================================== */

    async loadPlayers() {

        if (!this.game) {
            return [];
        }


        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "multiplayer_players"
                )
                .select("*")
                .eq(
                    "game_id",
                    this.game.id
                )
                .order(
                    "joined_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(error);

            return [];

        }


        this.renderPlayers(
            data || []
        );


        return data || [];

    },


    /* =====================================================
       HOST LOBBY
    ===================================================== */

    async renderHostLobby() {

        const area =
            document.getElementById(
                "multiplayerGame"
            );


        if (!area) return;


        area.innerHTML = `

            <div class="card">

                <h2>
                    🎤 Game Lobby
                </h2>


                <p>
                    Give this code to your
                    players:
                </p>


                <div class="game-code">
                    ${this.game.code}
                </div>


                <p>
                    Waiting for players...
                </p>


                <div
                    id="playerList"
                >
                    Loading players...
                </div>


                <button
                    class="primary"
                    onclick="Multiplayer.startGame()"
                >
                    ▶️ Start Game
                </button>

            </div>

        `;


        await this.loadPlayers();

    },


    /* =====================================================
       PLAYER LOBBY
    ===================================================== */

    async renderPlayerLobby() {

        const area =
            document.getElementById(
                "multiplayerGame"
            );


        if (!area) return;


        area.innerHTML = `

            <div class="card">

                <h2>
                    👥 Game Lobby
                </h2>


                <div class="game-code">
                    ${this.game.code}
                </div>


                <p>
                    You joined the game!
                </p>


                <p>
                    Waiting for the host...
                </p>


                <div
                    id="playerList"
                >
                    Loading players...
                </div>

            </div>

        `;


        await this.loadPlayers();

    },


    /* =====================================================
       RENDER PLAYERS
    ===================================================== */

    renderPlayers(
        players
    ) {

        const list =
            document.getElementById(
                "playerList"
            );


        if (!list) return;


        if (!players.length) {

            list.innerHTML =
                "<p>No players yet.</p>";

            return;

        }


        list.innerHTML = `

            <div class="players">

                ${players
                    .map(
                        player => `

                            <div class="player">

                                <span>
                                    👤
                                    ${this.escape(
                                        player.username
                                    )}
                                </span>

                                <strong>
                                    ${player.score}
                                </strong>

                            </div>

                        `
                    )
                    .join("")}

            </div>

        `;

    },


    /* =====================================================
       START GAME
    ===================================================== */

    async startGame() {

        if (!this.game) {
            return;
        }


        const user =
            await this.getUser();


        if (
            !user ||
            user.id !==
                this.game.host_id
        ) {

            alert(
                "Only the host can start the game."
            );

            return;

        }


        const supabase =
            this.getClient();


        const {
            error
        } =
            await supabase
                .from(
                    "multiplayer_games"
                )
                .update({

                    status:
                        "playing",

                    current_question:
                        0,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    this.game.id
                );


        if (error) {

            alert(
                error.message
            );

            return;

        }

    },


    /* =====================================================
       GAME UPDATE
    ===================================================== */

    async handleGameUpdate(
        game
    ) {

        if (
            game.status ===
            "playing"
        ) {

            await this.loadGameQuiz();

        }


        if (
            game.status ===
            "finished"
        ) {

            await this.showResults();

        }

    },


    /* =====================================================
       LOAD QUIZ
    ===================================================== */

    async loadGameQuiz() {

        if (!this.game) {
            return;
        }


        const supabase =
            this.getClient();


        const {
            data: quiz,
            error
        } =
            await supabase
                .from("quizzes")
                .select("*")
                .eq(
                    "id",
                    this.game.quiz_id
                )
                .single();


        if (error) {

            console.error(error);

            return;

        }


        window.multiplayerQuiz =
            quiz;


        this.renderGameQuestion(
            quiz
        );

    },


    /* =====================================================
       QUESTION
    ===================================================== */

    renderGameQuestion(
        quiz
    ) {

        const questionIndex =
            this.game.current_question;


        const question =
            quiz.questions[
                questionIndex
            ];


        if (!question) {

            return;

        }


        const area =
            document.getElementById(
                "multiplayerGame"
            );


        if (!area) return;


        area.innerHTML = `

            <div class="card">

                <p>
                    Question
                    ${questionIndex + 1}
                    /
                    ${quiz.questions.length}
                </p>


                <h2>
                    ${this.escape(
                        question.question
                    )}
                </h2>


                <div
                    id="multiplayerAnswers"
                    class="answer-options"
                >

                    ${
                        question.type ===
                        "multiple-choice"

                            ?

                        question.options
                            .map(
                                (
                                    option,
                                    index
                                ) => `

                                    <button
                                        onclick="Multiplayer.answerQuestion(
                                            ${index}
                                        )"
                                    >
                                        ${this.escape(
                                            option
                                        )}
                                    </button>

                                `
                            )
                            .join("")

                            :

                        question.type ===
                        "true-false"

                            ?

                        `
                            <button
                                onclick="Multiplayer.answerQuestion(true)"
                            >
                                ✅ True
                            </button>

                            <button
                                onclick="Multiplayer.answerQuestion(false)"
                            >
                                ❌ False
                            </button>
                        `

                            :

                        `
                            <input
                                id="writtenAnswer"
                                type="text"
                                placeholder="Your answer..."
                            >

                            <button
                                onclick="Multiplayer.submitWrittenAnswer()"
                            >
                                Submit
                            </button>
                        `

                    }

                </div>

            </div>

        `;

    },


    /* =====================================================
       ANSWER
    ===================================================== */

    async answerQuestion(
        answer
    ) {

        if (
            !this.game ||
            !window.multiplayerQuiz
        ) {

            return;

        }


        const user =
            await this.getUser();


        const question =
            window.multiplayerQuiz
                .questions[
                    this.game.current_question
                ];


        let correct = false;


        if (
            question.type ===
            "multiple-choice"
        ) {

            correct =
                Number(answer) ===
                Number(
                    question.answer
                );

        }

        else if (
            question.type ===
            "true-false"
        ) {

            correct =
                Boolean(answer) ===
                Boolean(
                    question.answer
                );

        }


        await this.recordAnswer(
            user.id,
            correct,
            question.points || 1
        );

    },


    /* =====================================================
       WRITTEN ANSWER
    ===================================================== */

    async submitWrittenAnswer() {

        const input =
            document.getElementById(
                "writtenAnswer"
            );


        if (!input) return;


        const answer =
            input.value
                .trim()
                .toLowerCase();


        const question =
            window.multiplayerQuiz
                ?.questions[
                    this.game.current_question
                ];


        if (!question) return;


        const correct =
            answer ===
            String(
                question.answer || ""
            )
                .trim()
                .toLowerCase();


        const user =
            await this.getUser();


        await this.recordAnswer(
            user.id,
            correct,
            question.points || 1
        );

    },


    /* =====================================================
       RECORD ANSWER
    ===================================================== */

    async recordAnswer(
        userID,
        correct,
        points
    ) {

        const supabase =
            this.getClient();


        const {
            data: player,
            error
        } =
            await supabase
                .from(
                    "multiplayer_players"
                )
                .select("*")
                .eq(
                    "game_id",
                    this.game.id
                )
                .eq(
                    "user_id",
                    userID
                )
                .single();


        if (error) {

            console.error(error);

            return;

        }


        const newScore =
            player.score +
            (
                correct
                    ? points
                    : 0
            );


        await supabase
            .from(
                "multiplayer_players"
            )
            .update({

                score:
                    newScore,

                answered:
                    true

            })
            .eq(
                "id",
                player.id
            );

    },


    /* =====================================================
       NEXT QUESTION
    ===================================================== */

    async nextQuestion() {

        if (!this.game) {
            return;
        }


        const user =
            await this.getUser();


        if (
            !user ||
            user.id !==
                this.game.host_id
        ) {

            return;

        }


        const supabase =
            this.getClient();


        const quiz =
            window.multiplayerQuiz;


        const next =
            this.game.current_question +
            1;


        if (
            next >=
            quiz.questions.length
        ) {

            await supabase
                .from(
                    "multiplayer_games"
                )
                .update({

                    status:
                        "finished",

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    this.game.id
                );

            return;

        }


        await supabase
            .from(
                "multiplayer_players"
            )
            .update({
                answered: false
            })
            .eq(
                "game_id",
                this.game.id
            );


        await supabase
            .from(
                "multiplayer_games"
            )
            .update({

                current_question:
                    next,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                this.game.id
            );

    },


    /* =====================================================
       RESULTS
    ===================================================== */

    async showResults() {

        const supabase =
            this.getClient();


        const {
            data: players
        } =
            await supabase
                .from(
                    "multiplayer_players"
                )
                .select("*")
                .eq(
                    "game_id",
                    this.game.id
                )
                .order(
                    "score",
                    {
                        ascending: false
                    }
                );


        const area =
            document.getElementById(
                "multiplayerGame"
            );


        if (!area) return;


        area.innerHTML = `

            <div class="card">

                <h1>
                    🏆 Final Results
                </h1>


                <div class="leaderboard">

                    ${players
                        .map(
                            (
                                player,
                                index
                            ) => `

                                <div class="leaderboard-row">

                                    <strong>
                                        ${
                                            index === 0
                                                ? "🥇"
                                                : index === 1
                                                ? "🥈"
                                                : index === 2
                                                ? "🥉"
                                                : "#" +
                                                  (
                                                      index + 1
                                                  )
                                        }
                                    </strong>


                                    <span>
                                        ${this.escape(
                                            player.username
                                        )}
                                    </span>


                                    <strong>
                                        ${player.score}
                                    </strong>

                                </div>

                            `
                        )
                        .join("")}

                </div>


                <button
                    onclick="showPage('home')"
                >
                    🏠 Home
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

    },


    /* =====================================================
       CLEAN UP
    ===================================================== */

    async leaveGame() {

        const supabase =
            this.getClient();


        if (this.channel) {

            await supabase
                .removeChannel(
                    this.channel
                );

            this.channel =
                null;

        }


        this.game =
            null;

        window.multiplayerQuiz =
            null;

    }

};


/* =========================================================
   GLOBAL COMPATIBILITY FUNCTIONS
========================================================= */

async function hostQuiz() {

    await Multiplayer.hostQuiz();

}


async function joinQuiz() {

    const input =
        document.getElementById(
            "joinGameCode"
        );


    const code =
        input?.value;


    await Multiplayer.joinQuiz(
        code
    );

}


/* =========================================================
   DEFAULT LIBRARY TAB
========================================================= */

function openMyQuizzes() {

    showPage("library");

    QuizLibrary.showMyQuizzes();

}


function openPublicLibrary() {

    showPage("library");

    QuizLibrary.showPublicLibrary();

}
