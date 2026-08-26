/* =========================================================
   QUIZFORGE — QUIZ PLAYER
   Handles:
   - Playing quizzes
   - Questions
   - Timer
   - Answers
   - Score
   - Results
   - Coins
   - Multiplayer compatibility
========================================================= */

const QuizPlayer = {

    quiz: null,

    questionIndex: 0,

    score: 0,

    correctAnswers: 0,

    answered: false,

    timer: null,

    timeLeft: 0,

    results: [],


    /* -----------------------------------------------------
       START
    ----------------------------------------------------- */

    start(
        quiz
    ) {

        if (
            !quiz ||
            !Array.isArray(
                quiz.questions
            )
        ) {

            alert(
                "Invalid quiz."
            );

            return;

        }

        this.quiz =
            JSON.parse(
                JSON.stringify(
                    quiz
                )
            );

        this.questionIndex =
            0;

        this.score =
            0;

        this.correctAnswers =
            0;

        this.answered =
            false;

        this.results =
            [];

        this.showQuestion();

    },


    /* -----------------------------------------------------
       CURRENT QUESTION
    ----------------------------------------------------- */

    getCurrentQuestion() {

        if (!this.quiz) {
            return null;
        }

        return this.quiz.questions[
            this.questionIndex
        ];

    },


    /* -----------------------------------------------------
       SHOW QUESTION
    ----------------------------------------------------- */

    showQuestion() {

        this.stopTimer();

        const container =
            document.getElementById(
                "quizPlayer"
            );

        if (!container) return;

        const question =
            this.getCurrentQuestion();

        if (!question) {

            this.finish();

            return;

        }

        this.answered =
            false;

        this.timeLeft =
            Number(
                question.timeLimit
            ) || 30;


        const total =
            this.quiz.questions.length;


        container.innerHTML = `

            <div class="player-header">

                <span>
                    Question
                    ${this.questionIndex + 1}
                    /
                    ${total}
                </span>

                <span>
                    ⭐ ${this.score}
                </span>

            </div>


            <div class="timer">

                ⏱️

                <span
                    id="quizTimer"
                >
                    ${this.timeLeft}
                </span>

            </div>


            <div class="card question-card">

                <h1>
                    ${escapeHTML(
                        question.text
                    )}
                </h1>


                ${
                    question.image
                        ? `
                            <img
                                class="question-image"
                                src="${escapeHTML(
                                    question.image
                                )}"
                                alt="Question image"
                            />
                        `
                        : ""
                }


                <div class="player-answers">

                    ${question.answers
                        .map(
                            (answer, index) => `

                                <button
                                    class="player-answer"
                                    data-answer="${index}"
                                    onclick="
                                        QuizPlayer.answer(
                                            ${index}
                                        )
                                    "
                                >

                                    <span>
                                        ${
                                            String.fromCharCode(
                                                65 + index
                                            )
                                        }
                                    </span>

                                    ${escapeHTML(
                                        answer.text ||
                                        "Answer"
                                    )}

                                </button>

                            `
                        )
                        .join("")}

                </div>

            </div>

        `;

        this.startTimer();

    },


    /* -----------------------------------------------------
       TIMER
    ----------------------------------------------------- */

    startTimer() {

        const timer =
            document.getElementById(
                "quizTimer"
            );

        if (!timer) return;


        this.timer =
            setInterval(
                () => {

                    this.timeLeft--;

                    timer.textContent =
                        this.timeLeft;


                    if (
                        this.timeLeft <= 0
                    ) {

                        this.stopTimer();

                        this.answer(
                            -1
                        );

                    }

                },
                1000
            );

    },


    stopTimer() {

        if (this.timer) {

            clearInterval(
                this.timer
            );

            this.timer =
                null;

        }

    },


    /* -----------------------------------------------------
       ANSWER
    ----------------------------------------------------- */

    answer(
        answerIndex
    ) {

        if (
            this.answered
        ) {
            return;
        }

        this.answered =
            true;

        this.stopTimer();


        const question =
            this.getCurrentQuestion();


        if (!question) {
            return;
        }


        const buttons =
            document.querySelectorAll(
                ".player-answer"
            );


        buttons.forEach(
            button => {

                button.disabled =
                    true;

            }
        );


        const selected =
            question.answers[
                answerIndex
            ];


        const correctIndex =
            question.answers.findIndex(
                answer =>
                    answer.correct
            );


        const correct =
            selected &&
            selected.correct;


        if (correct) {

            this.correctAnswers++;

            /*
             * Reward faster answers.
             */

            const basePoints =
                Number(
                    question.points
                ) || 100;


            const timeBonus =
                Math.max(
                    0,
                    this.timeLeft * 2
                );


            const points =
                basePoints +
                timeBonus;


            this.score +=
                points;

        }


        /*
         * Visually show result.
         */

        buttons.forEach(
            (button, index) => {

                if (
                    index ===
                    correctIndex
                ) {

                    button.classList.add(
                        "correct"
                    );

                }

                if (
                    index ===
                    answerIndex &&
                    !correct
                ) {

                    button.classList.add(
                        "wrong"
                    );

                }

            }
        );


        this.results.push({

            question:
                question.text,

            selected:
                selected
                    ? selected.text
                    : null,

            correct:
                correct,

            correctAnswer:
                question.answers[
                    correctIndex
                ]
                    ?.text || "",

            points:
                correct
                    ? question.points
                    : 0

        });


        /*
         * Multiplayer support.
         */

        if (
            typeof Multiplayer !==
            "undefined"
        ) {

            Multiplayer.submitAnswer(
                answerIndex
            );

        }


        setTimeout(
            () => {

                this.questionIndex++;

                this.showQuestion();

            },
            1200
        );

    },


    /* -----------------------------------------------------
       FINISH
    ----------------------------------------------------- */

    finish() {

        this.stopTimer();

        const container =
            document.getElementById(
                "quizPlayer"
            );

        if (!container) return;


        const total =
            this.quiz.questions.length;


        const percentage =
            total > 0
                ? Math.round(
                    (
                        this.correctAnswers /
                        total
                    ) * 100
                )
                : 0;


        let reward =
            0;


        /*
         * Give coins if Economy exists.
         */

        if (
            typeof Economy !==
            "undefined" &&
            Economy.rewardQuiz
        ) {

            reward =
                Economy.rewardQuiz(
                    this.correctAnswers,
                    total
                );

        }


        /*
         * Perfect quiz badge.
         */

        if (
            percentage === 100 &&
            typeof Badges !==
            "undefined"
        ) {

            if (
                Badges.unlock
            ) {

                Badges.unlock(
                    "perfect"
                );

            }

        }


        container.innerHTML = `

            <div class="results-screen">

                <div class="card">

                    <h1>
                        🎉 Quiz Complete!
                    </h1>


                    <div class="final-score">

                        ${this.score}

                    </div>


                    <p>
                        Final Score
                    </p>


                    <div class="result-stats">

                        <div>
                            <strong>
                                ${this.correctAnswers}
                            </strong>

                            <span>
                                Correct
                            </span>
                        </div>


                        <div>
                            <strong>
                                ${total -
                                this.correctAnswers}
                            </strong>

                            <span>
                                Incorrect
                            </span>
                        </div>


                        <div>
                            <strong>
                                ${percentage}%
                            </strong>

                            <span>
                                Accuracy
                            </span>
                        </div>

                    </div>


                    ${
                        reward > 0
                            ? `
                                <div class="coin-reward">

                                    🪙
                                    +${reward}
                                    coins!

                                </div>
                            `
                            : ""
                    }


                    <div class="result-actions">

                        <button
                            class="primary"
                            onclick="
                                QuizPlayer.start(
                                    QuizPlayer.quiz
                                )
                            "
                        >
                            🔄 Play Again
                        </button>


                        <button
                            onclick="
                                QuizPlayer.close()
                            "
                        >
                            ← Back
                        </button>

                    </div>

                </div>

            </div>

        `;


        /*
         * Send results to online server.
         */

        if (
            typeof Multiplayer !==
            "undefined" &&
            Multiplayer.roomCode
        ) {

            apiSubmitResult(
                Multiplayer.roomCode,
                this.score
            ).catch(
                () => {}
            );

        }

    },


    /* -----------------------------------------------------
       CLOSE
    ----------------------------------------------------- */

    close() {

        this.stopTimer();

        const container =
            document.getElementById(
                "quizPlayer"
            );

        if (!container) return;

        container.innerHTML = `

            <div class="card">

                <h2>
                    Quiz closed
                </h2>

                <button
                    class="primary"
                    onclick="
                        showPage('home')
                    "
                >
                    🏠 Home
                </button>

            </div>

        `;

    }

};


/* =========================================================
   GLOBAL PLAY FUNCTION
========================================================= */

function startPlayingQuiz(
    quiz = null
) {

    const selectedQuiz =
        quiz ||
        window.playingQuiz;


    if (!selectedQuiz) {

        alert(
            "No quiz selected."
        );

        return;

    }


    QuizPlayer.start(
        selectedQuiz
    );

}
