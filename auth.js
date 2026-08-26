/* =========================================================
   QUIZFORGE AUTH
   Login / Sign Up / Account
========================================================= */

const Auth = {

    currentUser: null,

    ADMIN_EMAIL: "garfield678521@gmail.com",

    init() {

        const saved =
            localStorage.getItem(
                "quizforge_user"
            );

        if (saved) {

            try {

                this.currentUser =
                    JSON.parse(saved);

            } catch {

                this.currentUser =
                    null;

            }

        }

        this.updateUI();

    },


    signup(
        username,
        email,
        password
    ) {

        username =
            String(username || "").trim();

        email =
            String(email || "")
                .trim()
                .toLowerCase();

        password =
            String(password || "");


        if (!username) {

            throw new Error(
                "Please enter a username."
            );

        }


        if (!email.includes("@")) {

            throw new Error(
                "Please enter a valid email."
            );

        }


        if (password.length < 6) {

            throw new Error(
                "Password must be at least 6 characters."
            );

        }


        const users =
            this.getUsers();


        if (
            users.some(
                user =>
                    user.email === email
            )
        ) {

            throw new Error(
                "An account with this email already exists."
            );

        }


        const user = {

            id:
                this.createID(),

            username,

            email,

            /*
             * Demo/local version only.
             * Do NOT use this as a real production
             * authentication system.
             */

            password,

            coins: 100,

            skins: [
                "default"
            ],

            badges: [],

            quizzesCreated: 0,

            quizzesPlayed: 0,

            totalScore: 0,

            isAdmin:
                email ===
                this.ADMIN_EMAIL,

            createdAt:
                new Date().toISOString()

        };


        users.push(user);

        localStorage.setItem(
            "quizforge_users",
            JSON.stringify(users)
        );


        this.login(
            email,
            password
        );

        return user;

    },


    login(
        email,
        password
    ) {

        email =
            String(email || "")
                .trim()
                .toLowerCase();


        const users =
            this.getUsers();


        const user =
            users.find(
                item =>
                    item.email === email &&
                    item.password === password
            );


        if (!user) {

            throw new Error(
                "Incorrect email or password."
            );

        }


        this.currentUser =
            {
                ...user
            };


        /*
         * Admin status is determined from
         * the configured email.
         */

        this.currentUser.isAdmin =
            email ===
            this.ADMIN_EMAIL;


        this.saveSession();

        this.updateUI();

        return this.currentUser;

    },


    logout() {

        this.currentUser =
            null;

        localStorage.removeItem(
            "quizforge_user"
        );

        this.updateUI();

    },


    getUsers() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    "quizforge_users"
                ) || "[]"
            );

        } catch {

            return [];

        }

    },


    saveSession() {

        localStorage.setItem(
            "quizforge_user",
            JSON.stringify(
                this.currentUser
            )
        );

    },


    updateUser(
        changes
    ) {

        if (!this.currentUser) {
            return;
        }


        Object.assign(
            this.currentUser,
            changes
        );


        const users =
            this.getUsers();


        const index =
            users.findIndex(
                user =>
                    user.id ===
                    this.currentUser.id
            );


        if (index !== -1) {

            users[index] =
                {
                    ...this.currentUser
                };

            localStorage.setItem(
                "quizforge_users",
                JSON.stringify(users)
            );

        }


        this.saveSession();

        this.updateUI();

    },


    updateUI() {

        const username =
            document.getElementById(
                "accountUsername"
            );

        const coins =
            document.getElementById(
                "accountCoins"
            );


        if (username) {

            username.textContent =
                this.currentUser
                    ? this.currentUser.username
                    : "Guest";

        }


        if (coins) {

            coins.textContent =
                this.currentUser
                    ? this.currentUser.coins
                    : "0";

        }


        const loginButton =
            document.getElementById(
                "loginButton"
            );


        if (loginButton) {

            loginButton.textContent =
                this.currentUser
                    ? "👤 Account"
                    : "🔐 Login";

        }

    },


    isLoggedIn() {

        return !!this.currentUser;

    },


    isAdmin() {

        return !!(
            this.currentUser &&
            this.currentUser.email
                .toLowerCase() ===
            this.ADMIN_EMAIL
                .toLowerCase()
        );

    },


    createID() {

        if (
            window.crypto &&
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

    }

};


/* Automatically initialise */

document.addEventListener(
    "DOMContentLoaded",
    () => Auth.init()
);
