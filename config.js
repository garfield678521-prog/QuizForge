/* =========================================================
   QUIZFORGE CONFIGURATION
========================================================= */

const QUIZFORGE_CONFIG = {

    /* -----------------------------------------------------
       WEBSITE
    ----------------------------------------------------- */

    APP_NAME: "QuizForge",

    VERSION: "1.0.0",


    /* -----------------------------------------------------
       BACKEND
       
       Leave these blank while using the local/demo version.
       When you have a backend, put its URLs here.
    ----------------------------------------------------- */

    API_URL: "",

    WEBSOCKET_URL: "",


    /* -----------------------------------------------------
       FEATURES
    ----------------------------------------------------- */

    FEATURES: {

        LOGIN: true,

        PUBLIC_LIBRARY: true,

        MULTIPLAYER: true,

        COINS: true,

        SKINS: true,

        BADGES: true,

        QZ_IMPORT: true,

        QZ_EXPORT: true,

        ONLINE_RESULTS: true

    },


    /* -----------------------------------------------------
       QUIZ SETTINGS
    ----------------------------------------------------- */

    QUIZ: {

        MIN_QUESTIONS: 1,

        MAX_QUESTIONS: 100,

        DEFAULT_TIME_LIMIT: 30,

        DEFAULT_POINTS: 100,

        MAX_TIME_LIMIT: 300

    },


    /* -----------------------------------------------------
       ECONOMY
    ----------------------------------------------------- */

    ECONOMY: {

        STARTING_COINS: 100,

        CORRECT_ANSWER_REWARD: 10,

        PERFECT_SCORE_BONUS: 50,

        DAILY_REWARD: 50

    },


    /* -----------------------------------------------------
       ADMIN
    ----------------------------------------------------- */

    ADMIN_EMAIL:
        "garfield678521@gmail.com",


    /* -----------------------------------------------------
       FILE SETTINGS
    ----------------------------------------------------- */

    FILES: {

        QUIZ_EXTENSION: ".qz",

        MAX_IMPORT_SIZE:
            10 * 1024 * 1024

    },


    /* -----------------------------------------------------
       DEBUG
    ----------------------------------------------------- */

    DEBUG: true

};


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const QuizForgeConfig = {

    getAPIURL(
        endpoint = ""
    ) {

        const base =
            QUIZFORGE_CONFIG.API_URL
                .replace(/\/$/, "");

        const path =
            String(endpoint)
                .replace(/^\//, "");

        if (!base) {
            return "";
        }

        return `${base}/${path}`;

    },


    hasBackend() {

        return Boolean(
            QUIZFORGE_CONFIG.API_URL
        );

    },


    hasMultiplayerServer() {

        return Boolean(
            QUIZFORGE_CONFIG.WEBSOCKET_URL
        );

    },


    log(
        ...messages
    ) {

        if (
            QUIZFORGE_CONFIG.DEBUG
        ) {

            console.log(
                "[QuizForge]",
                ...messages
            );

        }

    },


    error(
        ...messages
    ) {

        console.error(
            "[QuizForge]",
            ...messages
        );

    }

};
