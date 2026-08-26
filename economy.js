/* =========================================================
   QUIZFORGE ECONOMY
   Coins / Skins / Badges / Rewards
========================================================= */

const Economy = {


    skins: [

        {
            id: "default",
            name: "Default",
            icon: "😀",
            price: 0
        },

        {
            id: "creeper",
            name: "Creeper",
            icon: "🟩",
            price: 250
        },

        {
            id: "diamond",
            name: "Diamond",
            icon: "💎",
            price: 500
        },

        {
            id: "nether",
            name: "Nether",
            icon: "🔥",
            price: 750
        },

        {
            id: "ender",
            name: "Ender",
            icon: "🟪",
            price: 1000
        },

        {
            id: "gold",
            name: "Golden",
            icon: "👑",
            price: 1500
        },

        {
            id: "robot",
            name: "Robot",
            icon: "🤖",
            price: 2000
        },

        {
            id: "galaxy",
            name: "Galaxy",
            icon: "🌌",
            price: 3000
        }

    ],


    badges: [

        {
            id: "first-quiz",
            name: "First Quiz",
            icon: "🎯",
            description:
                "Complete your first quiz."
        },

        {
            id: "perfect",
            name: "Perfect Score",
            icon: "💯",
            description:
                "Get every question correct."
        },

        {
            id: "creator",
            name: "Quiz Creator",
            icon: "✏️",
            description:
                "Create your first quiz."
        },

        {
            id: "publisher",
            name: "Publisher",
            icon: "🌎",
            description:
                "Publish a quiz to the public library."
        },

        {
            id: "popular",
            name: "Popular Creator",
            icon: "🔥",
            description:
                "Have a quiz played many times."
        },

        {
            id: "master",
            name: "Quiz Master",
            icon: "🏆",
            description:
                "Reach 10,000 total points."
        }

    ],


    getUser() {

        if (
            typeof Auth === "undefined" ||
            !Auth.currentUser
        ) {

            return null;

        }

        return Auth.currentUser;

    },


    addCoins(
        amount
    ) {

        const user =
            this.getUser();

        if (!user) return 0;


        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount) || 0
                )
            );


        Auth.updateUser({

            coins:
                (user.coins || 0) +
                amount

        });


        this.updateUI();

        return amount;

    },


    removeCoins(
        amount
    ) {

        const user =
            this.getUser();

        if (!user) return false;


        amount =
            Math.max(
                0,
                Math.floor(
                    Number(amount) || 0
                )
            );


        if (
            user.coins <
            amount
        ) {

            return false;

        }


        Auth.updateUser({

            coins:
                user.coins -
                amount

        });


        this.updateUI();

        return true;

    },


    buySkin(
        skinID
    ) {

        const user =
            this.getUser();


        if (!user) {

            alert(
                "Please log in first."
            );

            return false;

        }


        const skin =
            this.skins.find(
                item =>
                    item.id ===
                    skinID
            );


        if (!skin) {

            return false;

        }


        const owned =
            user.skins ||
            ["default"];


        if (
            owned.includes(
                skinID
            )
        ) {

            this.selectSkin(
                skinID
            );

            return true;

        }


        if (
            !this.removeCoins(
                skin.price
            )
        ) {

            alert(
                "🪙 You don't have enough coins!"
            );

            return false;

        }


        owned.push(
            skinID
        );


        Auth.updateUser({

            skins:
                owned

        });


        alert(
            `🎉 You unlocked ${skin.name}!`
        );


        this.renderShop();

        return true;

    },


    selectSkin(
        skinID
    ) {

        const user =
            this.getUser();

        if (!user) return false;


        const owned =
            user.skins ||
            ["default"];


        if (
            !owned.includes(
                skinID
            )
        ) {

            return false;

        }


        Auth.updateUser({

            selectedSkin:
                skinID

        });


        this.renderShop();

        return true;

    },


    rewardQuiz(
        correct,
        total
    ) {

        if (!this.getUser()) {
            return 0;
        }


        correct =
            Number(correct) || 0;

        total =
            Number(total) || 0;


        let reward =
            correct * 10;


        if (
            total > 0 &&
            correct === total
        ) {

            reward += 50;

            this.unlockBadge(
                "perfect"
            );

        }


        if (reward > 0) {

            this.addCoins(
                reward
            );

        }


        const user =
            this.getUser();


        Auth.updateUser({

            quizzesPlayed:
                (user.quizzesPlayed || 0) + 1,

            totalScore:
                (user.totalScore || 0) +
                correct

        });


        this.unlockBadge(
            "first-quiz"
        );


        if (
            (user.totalScore || 0) >=
            10000
        ) {

            this.unlockBadge(
                "master"
            );

        }


        return reward;

    },


    unlockBadge(
        badgeID
    ) {

        const user =
            this.getUser();

        if (!user) return false;


        const badges =
            user.badges ||
            [];


        if (
            badges.includes(
                badgeID
            )
        ) {

            return false;

        }


        const badge =
            this.badges.find(
                item =>
                    item.id ===
                    badgeID
            );


        if (!badge) {
            return false;
        }


        badges.push(
            badgeID
        );


        Auth.updateUser({

            badges

        });


        this.showBadgeNotification(
            badge
        );


        return true;

    },


    showBadgeNotification(
        badge
    ) {

        alert(
            `${badge.icon} BADGE UNLOCKED!\n\n` +
            `${badge.name}\n` +
            `${badge.description}`
        );

    },


    renderShop() {

        const container =
            document.getElementById(
                "skinShop"
            );

        if (!container) return;


        const user =
            this.getUser();


        if (!user) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        🔐 Log in to use the shop
                    </h2>

                </div>

            `;

            return;

        }


        const owned =
            user.skins ||
            ["default"];


        container.innerHTML =
            this.skins
                .map(
                    skin => {

                        const isOwned =
                            owned.includes(
                                skin.id
                            );

                        const selected =
                            user.selectedSkin ===
                            skin.id;


                        return `

                            <div class="skin-card">

                                <div class="skin-icon">
                                    ${skin.icon}
                                </div>

                                <h3>
                                    ${skin.name}
                                </h3>

                                ${
                                    selected
                                        ? `
                                            <span>
                                                ✅ Equipped
                                            </span>
                                        `
                                        : isOwned
                                            ? `
                                                <button
                                                    onclick="
                                                        Economy.selectSkin(
                                                            '${skin.id}'
                                                        )
                                                    "
                                                >
                                                    Equip
                                                </button>
                                            `
                                            : `
                                                <button
                                                    onclick="
                                                        Economy.buySkin(
                                                            '${skin.id}'
                                                        )
                                                    "
                                                >
                                                    🪙
                                                    ${skin.price}
                                                </button>
                                            `
                                }

                            </div>

                        `;

                    }
                )
                .join("");

    },


    updateUI() {

        const element =
            document.getElementById(
                "coinCount"
            );


        if (element) {

            const user =
                this.getUser();

            element.textContent =
                user
                    ? user.coins || 0
                    : 0;

        }

    }

};


/*
 * Optional global badge object.
 * quiz-player.js can use this.
 */

const Badges = {

    unlock(
        badgeID
    ) {

        return Economy.unlockBadge(
            badgeID
        );

    }

};
