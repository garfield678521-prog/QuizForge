/* =========================================================
   QUIZFORGE MULTIPLAYER
   Host / Join / Players / Rooms / Answers
========================================================= */

const Multiplayer = {

    socket: null,

    connected: false,

    roomCode: null,

    isHost: false,

    username: "",

    players: [],

    quiz: null,


    /* =====================================================
       CONNECT
    ===================================================== */

    connect(
        serverURL = null
    ) {

        const url =
            serverURL ||
            (
                typeof QUIZFORGE_CONFIG !==
                "undefined"
                    ? QUIZFORGE_CONFIG
                        .WEBSOCKET_URL
                    : ""
            );


        /*
         * GitHub Pages cannot create
         * a real WebSocket server.
         *
         * If no server is configured,
         * stay in offline/demo mode.
         */

        if (!url) {

            console.log(
                "QuizForge multiplayer is in offline mode."
            );

            return false;

        }


        try {

            this.socket =
                new WebSocket(
                    url
                );


            this.socket.onopen =
                () => {

                    this.connected =
                        true;

                    console.log(
                        "🌎 Multiplayer connected."
                    );

                };


            this.socket.onclose =
                () => {

                    this.connected =
                        false;

                    console.log(
                        "Multiplayer disconnected."
                    );

                };


            this.socket.onerror =
                error => {

                    console.error(
                        "Multiplayer error:",
                        error
                    );

                };


            this.socket.onmessage =
                event => {

                    try {

                        const message =
                            JSON.parse(
                                event.data
                            );

                        this.handleMessage(
                            message
                        );

                    } catch(error) {

                        console.error(
                            "Invalid server message.",
                            error
                        );

                    }

                };


            return true;

        }

        catch(error) {

            console.error(
                error
            );

            return false;

        }

    },


    /* =====================================================
       SEND
    ===================================================== */

    send(
        type,
        data = {}
    ) {

        if (
            !this.socket ||
            !this.connected
        ) {

            console.log(
                "Offline multiplayer message:",
                type,
                data
            );

            return false;

        }


        this.socket.send(
            JSON.stringify({

                type,

                ...data

            })
        );


        return true;

    },


    /* =====================================================
       CREATE ROOM
    ===================================================== */

    createRoom(
        quiz
    ) {

        this.quiz =
            quiz;

        this.isHost =
            true;


        this.username =
            Auth.currentUser
                ?.username ||
            "Host";


        /*
         * Temporary local room code.
         * The real server will generate this
         * when multiplayer is connected.
         */

        this.roomCode =
            this.generateRoomCode();


        this.players = [

            {

                id:
                    Auth.currentUser
                        ?.id ||
                    "host",

                username:
                    this.username,

                host:
                    true,

                score:
                    0

            }

        ];


        this.send(
            "CREATE_ROOM",
            {

                roomCode:
                    this.roomCode,

                quiz

            }
        );


        this.showRoom();

        return this.roomCode;

    },


    /* =====================================================
       JOIN ROOM
    ===================================================== */

    joinRoom(
        roomCode,
        username
    ) {

        roomCode =
            String(
                roomCode || ""
            )
            .trim()
            .toUpperCase();


        username =
            String(
                username || "Player"
            )
            .trim();


        if (
            roomCode.length !== 6
        ) {

            alert(
                "Enter a valid 6-character room code."
            );

            return false;

        }


        this.roomCode =
            roomCode;

        this.username =
            username;

        this.isHost =
            false;


        this.send(
            "JOIN_ROOM",
            {

                roomCode,

                username

            }
        );


        this.showRoom();

        return true;

    },


    /* =====================================================
       START QUIZ
    ===================================================== */

    startQuiz() {

        if (!this.isHost) {

            alert(
                "Only the host can start the quiz."
            );

            return;

        }


        this.send(
            "START_QUIZ",
            {

                roomCode:
                    this.roomCode

            }
        );


        if (this.quiz) {

            QuizPlayer.start(
                this.quiz
            );

        }

    },


    /* =====================================================
       NEXT QUESTION
    ===================================================== */

    nextQuestion(
        questionIndex
    ) {

        if (!this.isHost) {
            return;
        }


        this.send(
            "NEXT_QUESTION",
            {

                roomCode:
                    this.roomCode,

                questionIndex

            }
        );

    },


    /* =====================================================
       ANSWER
    ===================================================== */

    submitAnswer(
        answerIndex
    ) {

        this.send(
            "ANSWER",
            {

                roomCode:
                    this.roomCode,

                answerIndex

            }
        );

    },


    /* =====================================================
       END QUIZ
    ===================================================== */

    endQuiz() {

        if (!this.isHost) {
            return;
        }


        this.send(
            "END_QUIZ",
            {

                roomCode:
                    this.roomCode

            }
        );

    },


    /* =====================================================
       KICK
    ===================================================== */

    kickPlayer(
        playerID
    ) {

        if (!this.isHost) {
            return;
        }


        this.send(
            "KICK_PLAYER",
            {

                roomCode:
                    this.roomCode,

                playerID

            }
        );

    },


    /* =====================================================
       LEAVE
    ===================================================== */

    leaveRoom() {

        this.send(
            "LEAVE_ROOM",
            {

                roomCode:
                    this.roomCode

            }
        );


        this.roomCode =
            null;

        this.players =
            [];

        this.quiz =
            null;

        this.isHost =
            false;

    },


    /* =====================================================
       HANDLE SERVER EVENTS
    ===================================================== */

    handleMessage(
        message
    ) {

        switch (
            message.type
        ) {


            case "ROOM_CREATED":

                this.roomCode =
                    message.roomCode;

                this.showRoom();

                break;


            case "ROOM_STATE":

                this.players =
                    message.players ||
                    [];

                this.quiz =
                    message.quiz ||
                    this.quiz;

                this.renderPlayers();

                break;


            case "PLAYER_JOINED":

                this.players.push(
                    message.player
                );

                this.renderPlayers();

                break;


            case "PLAYER_LEFT":

                this.players =
                    this.players.filter(
                        player =>
                            player.id !==
                            message.playerID
                    );

                this.renderPlayers();

                break;


            case "START_QUIZ":

                if (
                    message.quiz
                ) {

                    this.quiz =
                        message.quiz;

                }

                if (
                    this.quiz &&
                    typeof QuizPlayer !==
                    "undefined"
                ) {

                    QuizPlayer.start(
                        this.quiz
                    );

                }

                break;


            case "NEXT_QUESTION":

                if (
                    typeof QuizPlayer !==
                    "undefined"
                ) {

                    QuizPlayer.questionIndex =
                        message.questionIndex;

                    QuizPlayer.showQuestion();

                }

                break;


            case "RESULTS":

                this.showResults(
                    message.results
                );

                break;


            case "QUIZ_ENDED":

                this.showResults(
                    message.results ||
                    []
                );

                break;


            case "KICKED":

                alert(
                    "You were removed from the room."
                );

                this.leaveRoom();

                break;


            default:

                console.log(
                    "Unknown multiplayer event:",
                    message
                );

        }

    },


    /* =====================================================
       DISPLAY ROOM
    ===================================================== */

    showRoom() {

        const element =
            document.getElementById(
                "multiplayerRoom"
            );


        if (!element) return;


        element.innerHTML = `

            <div class="card">

                <h1>
                    🎮 Quiz Room
                </h1>

                <div class="room-code">

                    ${this.roomCode}

                </div>

                <p>
                    Share this code with your players.
                </p>

                <h3>
                    Players
                </h3>

                <div
                    id="multiplayerPlayers"
                ></div>

                ${
                    this.isHost
                        ? `
                            <button
                                class="primary"
                                onclick="
                                    Multiplayer.startQuiz()
                                "
                            >
                                🚀 Start Quiz
                            </button>
                        `
                        : `
                            <p>
                                ⏳ Waiting for host...
                            </p>
                        `
                }

            </div>

        `;


        this.renderPlayers();

    },


    /* =====================================================
       PLAYER LIST
    ===================================================== */

    renderPlayers() {

        const element =
            document.getElementById(
                "multiplayerPlayers"
            );


        if (!element) return;


        element.innerHTML =
            this.players
                .map(
                    player => `

                        <div class="player-row">

                            <span>
                                👤
                                ${this.escape(
                                    player.username
                                )}
                            </span>

                            ${
                                this.isHost &&
                                !player.host
                                    ? `
                                        <button
                                            onclick="
                                                Multiplayer.kickPlayer(
                                                    '${player.id}'
                                                )
                                            "
                                        >
                                            Kick
                                        </button>
                                    `
                                    : ""
                            }

                        </div>

                    `
                )
                .join("");

    },


    /* =====================================================
       RESULTS
    ===================================================== */

    showResults(
        results
    ) {

        const element =
            document.getElementById(
                "multiplayerRoom"
            );


        if (!element) return;


        element.innerHTML = `

            <div class="card">

                <h1>
                    🏆 Results
                </h1>

                ${
                    (results || [])
                        .map(
                            (player, index) => `

                                <div class="result-row">

                                    <strong>
                                        #${index + 1}
                                    </strong>

                                    <span>
                                        ${this.escape(
                                            player.username ||
                                            "Player"
                                        )}
                                    </span>

                                    <strong>
                                        ${player.score || 0}
                                    </strong>

                                </div>

                            `
                        )
                        .join("")
                }

            </div>

        `;

    },


    /* =====================================================
       ROOM CODE
    ===================================================== */

    generateRoomCode() {

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
