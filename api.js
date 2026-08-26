/* =========================================================
   QUIZFORGE API
   Online database / accounts / library / results
========================================================= */

const QuizForgeAPI = {


    /* =====================================================
       BASIC REQUEST
    ===================================================== */

    async request(
        endpoint,
        options = {}
    ) {

        if (
            !QuizForgeConfig.hasBackend()
        ) {

            throw new Error(
                "QuizForge backend is not configured."
            );

        }


        const url =
            QuizForgeConfig.getAPIURL(
                endpoint
            );


        const headers = {

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        };


        /*
         * Add authentication token if
         * the backend uses one.
         */

        const token =
            localStorage.getItem(
                "quizforge_token"
            );


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const response =
            await fetch(
                url,
                {

                    ...options,

                    headers

                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data = null;

        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                `Server error: ${response.status}`
            );

        }


        return data;

    },


    /* =====================================================
       AUTH
    ===================================================== */

    async signup(
        username,
        email,
        password
    ) {

        return this.request(
            "/auth/signup",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        username,

                        email,

                        password

                    })

            }
        );

    },


    async login(
        email,
        password
    ) {

        const result =
            await this.request(
                "/auth/login",
                {

                    method: "POST",

                    body:
                        JSON.stringify({

                            email,

                            password

                        })

                }
            );


        if (
            result.token
        ) {

            localStorage.setItem(
                "quizforge_token",
                result.token
            );

        }


        return result;

    },


    async logout() {

        try {

            await this.request(
                "/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch {

            /*
             * Logging out locally should
             * still work if the server
             * cannot be reached.
             */

        }


        localStorage.removeItem(
            "quizforge_token"
        );

    },


    async getAccount() {

        return this.request(
            "/auth/me",
            {
                method: "GET"
            }
        );

    },


    /* =====================================================
       PUBLIC QUIZ LIBRARY
    ===================================================== */

    async getPublicQuizzes(
        options = {}
    ) {

        const params =
            new URLSearchParams();


        if (options.search) {

            params.set(
                "search",
                options.search
            );

        }


        if (options.category) {

            params.set(
                "category",
                options.category
            );

        }


        if (options.sort) {

            params.set(
                "sort",
                options.sort
            );

        }


        if (options.page) {

            params.set(
                "page",
                options.page
            );

        }


        const query =
            params.toString();


        return this.request(
            `/quizzes/public${
                query
                    ? "?" + query
                    : ""
            }`,
            {
                method: "GET"
            }
        );

    },


    async getQuiz(
        quizID
    ) {

        return this.request(
            `/quizzes/${encodeURIComponent(
                quizID
            )}`,
            {

                method: "GET"

            }
        );

    },


    async publishQuiz(
        quiz
    ) {

        return this.request(
            "/quizzes",
            {

                method: "POST",

                body:
                    JSON.stringify(
                        quiz
                    )

            }
        );

    },


    async updateQuiz(
        quizID,
        quiz
    ) {

        return this.request(
            `/quizzes/${encodeURIComponent(
                quizID
            )}`,
            {

                method: "PUT",

                body:
                    JSON.stringify(
                        quiz
                    )

            }
        );

    },


    async deleteQuiz(
        quizID
    ) {

        return this.request(
            `/quizzes/${encodeURIComponent(
                quizID
            )}`,
            {

                method: "DELETE"

            }
        );

    },


    /* =====================================================
       MY QUIZZES
    ===================================================== */

    async getMyQuizzes() {

        return this.request(
            "/quizzes/mine",
            {

                method: "GET"

            }
        );

    },


    /* =====================================================
       PLAY COUNTER
    ===================================================== */

    async recordPlay(
        quizID
    ) {

        return this.request(
            `/quizzes/${encodeURIComponent(
                quizID
            )}/play`,
            {

                method: "POST"

            }
        );

    },


    /* =====================================================
       LIKE QUIZ
    ===================================================== */

    async likeQuiz(
        quizID
    ) {

        return this.request(
            `/quizzes/${encodeURIComponent(
                quizID
            )}/like`,
            {

                method: "POST"

            }
        );

    },


    /* =====================================================
       RESULTS
    ===================================================== */

    async submitResult(
        roomCode,
        score,
        correct,
        total
    ) {

        return this.request(
            "/results",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        roomCode,

                        score,

                        correct,

                        total

                    })

            }
        );

    },


    async getQuizResults(
        quizID
    ) {

        return this.request(
            `/results/quiz/${encodeURIComponent(
                quizID
            )}`,
            {

                method: "GET"

            }
        );

    },


    /* =====================================================
       ECONOMY
    ===================================================== */

    async getEconomy() {

        return this.request(
            "/economy",
            {

                method: "GET"

            }
        );

    },


    async buySkin(
        skinID
    ) {

        return this.request(
            "/economy/skins/buy",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        skinID

                    })

            }
        );

    },


    async equipSkin(
        skinID
    ) {

        return this.request(
            "/economy/skins/equip",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        skinID

                    })

            }
        );

    },


    async claimDailyReward() {

        return this.request(
            "/economy/daily",
            {

                method: "POST"

            }
        );

    },


    /* =====================================================
       BADGES
    ===================================================== */

    async getBadges() {

        return this.request(
            "/badges",
            {

                method: "GET"

            }
        );

    },


    /* =====================================================
       MULTIPLAYER
    ===================================================== */

    async createRoom(
        quizID
    ) {

        return this.request(
            "/rooms",
            {

                method: "POST",

                body:
                    JSON.stringify({

                        quizID

                    })

            }
        );

    },


    async getRoom(
        roomCode
    ) {

        return this.request(
            `/rooms/${encodeURIComponent(
                roomCode
            )}`,
            {

                method: "GET"

            }
        );

    },


    async submitRoomResult(
        roomCode,
        result
    ) {

        return this.request(
            `/rooms/${encodeURIComponent(
                roomCode
            )}/results`,
            {

                method: "POST",

                body:
                    JSON.stringify(
                        result
                    )

            }
        );

    },


    /* =====================================================
       HEALTH CHECK
    ===================================================== */

    async ping() {

        return this.request(
            "/health",
            {

                method: "GET"

            }
        );

    }

};


/* =========================================================
   GLOBAL HELPER
========================================================= */

async function apiSubmitResult(
    roomCode,
    score,
    correct = 0,
    total = 0
) {

    try {

        return await QuizForgeAPI.submitResult(
            roomCode,
            score,
            correct,
            total
        );

    }

    catch(error) {

        QuizForgeConfig.error(
            "Could not submit result:",
            error
        );

        return null;

    }

}
