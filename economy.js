/* =========================================================
   QUIZFORGE ECONOMY
   COINS • BADGES • SKINS • PROFILE
========================================================= */

const Economy = {

    profile: null,

    skins: [],


    /* =====================================================
       SUPABASE
    ===================================================== */

    getClient() {

        return window.supabaseClient;

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
            await supabase
                .auth
                .getUser();

        if (error) {

            console.error(error);

            return null;

        }

        return data.user;

    },


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    async loadProfile() {

        const supabase =
            this.getClient();

        const user =
            await this.getUser();


        if (!user) {

            this.profile =
                null;

            return null;

        }


        /*
         * Get profile.
         */

        let {
            data: profile,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .select("*")
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        /*
         * If no profile exists,
         * create one.
         */

        if (!profile) {

            const username =
                user.user_metadata
                    ?.username ||
                user.email?.split("@")[0] ||
                "Player";


            const result =
                await supabase
                    .from(
                        "player_profiles"
                    )
                    .insert({

                        id:
                            user.id,

                        username:
                            username

                    })
                    .select()
                    .single();


            if (result.error) {

                console.error(
                    result.error
                );

                return null;

            }


            profile =
                result.data;

        }


        if (error) {

            console.error(error);

        }


        this.profile =
            profile;


        return profile;

    },


    /* =====================================================
       LOAD SKINS
    ===================================================== */

    async loadSkins() {

        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "skin_shop"
                )
                .select("*")
                .order(
                    "price",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(error);

            return [];

        }


        this.skins =
            data || [];


        return this.skins;

    },


    /* =====================================================
       INITIALISE
    ===================================================== */

    async init() {

        await this.loadProfile();

        await this.loadSkins();

        this.updateCoinDisplay();

    },


    /* =====================================================
       ADD COINS
    ===================================================== */

    async addCoins(
        amount,
        reason = "Reward"
    ) {

        if (
            !this.profile ||
            amount <= 0
        ) {

            return false;

        }


        const supabase =
            this.getClient();


        const newCoins =
            this.profile.coins +
            amount;


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    coins:
                        newCoins,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            return false;

        }


        this.profile =
            data;


        this.updateCoinDisplay();


        console.log(
            `+${amount} coins: ${reason}`
        );


        return true;

    },


    /* =====================================================
       SPEND COINS
    ===================================================== */

    async spendCoins(
        amount
    ) {

        if (
            !this.profile ||
            amount <= 0
        ) {

            return false;

        }


        if (
            this.profile.coins <
            amount
        ) {

            return false;

        }


        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    coins:
                        this.profile.coins -
                        amount,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            return false;

        }


        this.profile =
            data;


        this.updateCoinDisplay();


        return true;

    },


    /* =====================================================
       BUY SKIN
    ===================================================== */

    async buySkin(
        skinID
    ) {

        if (!this.profile) {

            alert(
                "Please log in first."
            );

            return;

        }


        const skin =
            this.skins.find(
                s =>
                    s.id ===
                    skinID
            );


        if (!skin) {

            alert(
                "Skin not found."
            );

            return;

        }


        const unlocked =
            Array.isArray(
                this.profile
                    .unlocked_skins
            )
                ? this.profile
                    .unlocked_skins
                : [];


        if (
            unlocked.includes(
                skinID
            )
        ) {

            await this.equipSkin(
                skinID
            );

            return;

        }


        if (
            this.profile.coins <
            skin.price
        ) {

            alert(
                `You need ${
                    skin.price -
                    this.profile.coins
                } more coins.`
            );

            return;

        }


        const success =
            await this.spendCoins(
                skin.price
            );


        if (!success) {

            alert(
                "Could not purchase skin."
            );

            return;

        }


        unlocked.push(
            skinID
        );


        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    unlocked_skins:
                        unlocked,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            /*
             * Try to refund the coins.
             */

            await this.addCoins(
                skin.price,
                "Skin purchase refund"
            );

            alert(
                "Purchase failed."
            );

            return;

        }


        this.profile =
            data;


        alert(
            `🎉 You unlocked ${skin.name}!`
        );


        await this.equipSkin(
            skinID
        );


        this.renderSkins();

    },


    /* =====================================================
       EQUIP SKIN
    ===================================================== */

    async equipSkin(
        skinID
    ) {

        if (!this.profile) {
            return;
        }


        const unlocked =
            this.profile
                .unlocked_skins || [];


        if (
            !unlocked.includes(
                skinID
            )
        ) {

            return;

        }


        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    equipped_skin:
                        skinID,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            return;

        }


        this.profile =
            data;


        this.renderProfile();

    },


    /* =====================================================
       BADGES
    ===================================================== */

    async awardBadge(
        badgeID
    ) {

        if (!this.profile) {
            return false;
        }


        const badges =
            Array.isArray(
                this.profile.badges
            )
                ? this.profile.badges
                : [];


        if (
            badges.includes(
                badgeID
            )
        ) {

            return false;

        }


        badges.push(
            badgeID
        );


        const supabase =
            this.getClient();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    badges:
                        badges,

                    updated_at:
                        new Date()
                            .toISOString()

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        if (error) {

            console.error(error);

            return false;

        }


        this.profile =
            data;


        const reward =
            this.getBadgeReward(
                badgeID
            );


        if (reward > 0) {

            await this.addCoins(
                reward,
                `Badge: ${badgeID}`
            );

        }


        alert(
            `🏅 Badge unlocked!\n\n${this.getBadgeName(
                badgeID
            )}`
        );


        this.renderProfile();


        return true;

    },


    /* =====================================================
       BADGE NAMES
    ===================================================== */

    getBadgeName(
        id
    ) {

        const badges = {

            first_quiz:
                "First Quiz",

            first_win:
                "First Victory",

            quiz_master:
                "Quiz Master",

            question_machine:
                "Question Machine",

            world_challenger:
                "World Challenger",

            quiz_host:
                "Quiz Host",

            perfect_score:
                "Perfect Score",

            coin_collector:
                "Coin Collector"

        };


        return (
            badges[id] ||
            id
        );

    },


    /* =====================================================
       BADGE REWARDS
    ===================================================== */

    getBadgeReward(
        id
    ) {

        const rewards = {

            first_quiz:
                100,

            first_win:
                150,

            quiz_master:
                500,

            question_machine:
                250,

            world_challenger:
                300,

            quiz_host:
                200,

            perfect_score:
                250,

            coin_collector:
                500

        };


        return rewards[id] || 0;

    },


    /* =====================================================
       QUIZ CREATED
    ===================================================== */

    async quizCreated() {

        if (!this.profile) {
            return;
        }


        const supabase =
            this.getClient();


        const count =
            this.profile
                .quizzes_created +
            1;


        const {
            data
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    quizzes_created:
                        count

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        this.profile =
            data;


        await this.addCoins(
            50,
            "Created a quiz"
        );


        if (
            count === 1
        ) {

            await this.awardBadge(
                "first_quiz"
            );

        }


        if (
            count >= 10
        ) {

            await this.awardBadge(
                "quiz_master"
            );

        }

    },


    /* =====================================================
       QUIZ PLAYED
    ===================================================== */

    async quizPlayed(
        correct,
        totalQuestions
    ) {

        if (!this.profile) {
            return;
        }


        const supabase =
            this.getClient();


        const played =
            this.profile
                .quizzes_played +
            1;


        const answered =
            this.profile
                .questions_answered +
            1;


        const correctCount =
            this.profile
                .correct_answers +
            (
                correct
                    ? 1
                    : 0
            );


        const {
            data
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    quizzes_played:
                        played,

                    questions_answered:
                        answered,

                    correct_answers:
                        correctCount

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        this.profile =
            data;


        await this.addCoins(
            correct
                ? 10
                : 2,
            correct
                ? "Correct answer"
                : "Played quiz"
        );


        if (
            played === 1
        ) {

            await this.awardBadge(
                "first_win"
            );

        }


        if (
            answered >= 100
        ) {

            await this.awardBadge(
                "question_machine"
            );

        }

    },


    /* =====================================================
       HOSTED QUIZ
    ===================================================== */

    async quizHosted() {

        if (!this.profile) {
            return;
        }


        const supabase =
            this.getClient();


        const hosted =
            this.profile
                .quizzes_hosted +
            1;


        const {
            data
        } =
            await supabase
                .from(
                    "player_profiles"
                )
                .update({

                    quizzes_hosted:
                        hosted

                })
                .eq(
                    "id",
                    this.profile.id
                )
                .select()
                .single();


        this.profile =
            data;


        await this.addCoins(
            25,
            "Hosted quiz"
        );


        if (
            hosted === 1
        ) {

            await this.awardBadge(
                "quiz_host"
            );

        }

    },


    /* =====================================================
       COIN DISPLAY
    ===================================================== */

    updateCoinDisplay() {

        const elements =
            document.querySelectorAll(
                "[data-coins]"
            );


        elements.forEach(
            element => {

                element.textContent =
                    this.profile
                        ? this.profile.coins
                        : "0";

            }
        );

    },


    /* =====================================================
       PROFILE UI
    ===================================================== */

    renderProfile() {

        const container =
            document.getElementById(
                "economyProfile"
            );


        if (!container) {
            return;
        }


        if (!this.profile) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        🔐 Login Required
                    </h2>

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


        const skin =
            this.skins.find(
                s =>
                    s.id ===
                    this.profile
                        .equipped_skin
            );


        const badges =
            this.profile.badges ||
            [];


        container.innerHTML = `

            <div class="card">

                <h1>
                    👤
                    ${this.escape(
                        this.profile.username
                    )}
                </h1>


                <div
                    style="
                        font-size:32px;
                        margin:15px 0;
                    "
                >
                    🪙
                    ${this.profile.coins}
                    Coins
                </div>


                <p>
                    ${
                        skin?.emoji ||
                        "🟢"
                    }

                    Equipped:
                    <strong>
                        ${
                            skin?.name ||
                            "Classic"
                        }
                    </strong>
                </p>


                <p>
                    🎮 Quizzes Played:
                    ${this.profile.quizzes_played}
                </p>


                <p>
                    📝 Quizzes Created:
                    ${this.profile.quizzes_created}
                </p>


                <p>
                    🎤 Quizzes Hosted:
                    ${this.profile.quizzes_hosted}
                </p>


                <p>
                    ❓ Questions Answered:
                    ${this.profile.questions_answered}
                </p>


                <p>
                    ✅ Correct:
                    ${this.profile.correct_answers}
                </p>


                <h2>
                    🏅 Badges
                </h2>


                <div>

                    ${
                        badges.length
                            ? badges
                                .map(
                                    badge => `
                                        <span
                                            style="
                                                display:inline-block;
                                                padding:10px;
                                                margin:5px;
                                                background:#f1f2f6;
                                                border-radius:10px;
                                            "
                                        >
                                            🏅
                                            ${this.escape(
                                                this.getBadgeName(
                                                    badge
                                                )
                                            )}
                                        </span>
                                    `
                                )
                                .join("")
                            :
                                "<p>No badges yet. Start playing!</p>"
                    }

                </div>

            </div>

        `;


        this.updateCoinDisplay();

    },


    /* =====================================================
       SKIN SHOP
    ===================================================== */

    renderSkins() {

        const container =
            document.getElementById(
                "skinShop"
            );


        if (!container) {
            return;
        }


        if (!this.profile) {

            container.innerHTML =
                "<p>Login to use the skin shop.</p>";

            return;

        }


        const unlocked =
            this.profile
                .unlocked_skins ||
            [];


        container.innerHTML = `

            <div class="library-grid">

                ${
                    this.skins
                        .map(
                            skin => {

                                const owned =
                                    unlocked
                                        .includes(
                                            skin.id
                                        );


                                const equipped =
                                    this.profile
                                        .equipped_skin ===
                                    skin.id;


                                return `

                                    <div class="card">

                                        <div
                                            style="
                                                font-size:55px;
                                                text-align:center;
                                            "
                                        >
                                            ${
                                                skin.emoji
                                            }
                                        </div>


                                        <h2>
                                            ${this.escape(
                                                skin.name
                                            )}
                                        </h2>


                                        <p>
                                            ${this.escape(
                                                skin.description
                                            )}
                                        </p>


                                        <p>
                                            🪙
                                            ${
                                                skin.price
                                            }
                                        </p>


                                        ${
                                            equipped

                                                ?

                                            `
                                                <button
                                                    disabled
                                                >
                                                    ✅ Equipped
                                                </button>
                                            `

                                                :

                                            owned

                                                ?

                                            `
                                                <button
                                                    class="primary"
                                                    onclick="
                                                        Economy.equipSkin(
                                                            '${skin.id}'
                                                        )
                                                    "
                                                >
                                                    👕 Equip
                                                </button>
                                            `

                                                :

                                            `
                                                <button
                                                    class="primary"
                                                    onclick="
                                                        Economy.buySkin(
                                                            '${skin.id}'
                                                        )
                                                    "
                                                >
                                                    🛒 Buy
                                                </button>
                                            `
                                        }

                                    </div>

                                `;

                            }
                        )
                        .join("")
                }

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
   GLOBAL FUNCTIONS
========================================================= */

async function openRewards() {

    showPage(
        "rewards"
    );


    await Economy.init();

    Economy.renderProfile();

    Economy.renderSkins();

}


document.addEventListener(
    "DOMContentLoaded",
    async function() {

        await Economy.init();

    }
);
