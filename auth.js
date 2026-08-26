/* =========================================================
   QUIZFORGE AUTHENTICATION V2
   ---------------------------------------------------------
   Features:
   - Sign up
   - Login
   - Logout
   - Password changing
   - Account settings
   - Persistent account data
   - Separate data for each account
   - Admin account
   - Session restoration
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const QUIZFORGE_ADMIN_EMAIL =
    "garfield678521@gmail.com";


/*
 * Initial admin password.
 *
 * IMPORTANT:
 * This is only suitable for the local/demo version.
 * A production website should authenticate through
 * a secure backend instead of storing passwords here.
 */

const QUIZFORGE_INITIAL_ADMIN_PASSWORD =
    "OscArc22";


/* =========================================================
   AUTH OBJECT
========================================================= */

const Auth = {

    currentUser: null,

    SESSION_KEY:
        "quizforge_session",

    USERS_KEY:
        "quizforge_users",


    /* =====================================================
       INITIALISE
    ===================================================== */

    init() {

        this.createAdminAccount();

        this.restoreSession();

        this.updateUI();

    },


    /* =====================================================
       CREATE ADMIN ACCOUNT
    ===================================================== */

    createAdminAccount() {

        const users =
            this.getUsers();


        const adminExists =
            users.some(
                user =>
                    user.email.toLowerCase() ===
                    QUIZFORGE_ADMIN_EMAIL.toLowerCase()
            );


        if (adminExists) {

            return;

        }


        const admin = {

            id:
                this.createID(),

            username:
                "Admin",

            email:
                QUIZFORGE_ADMIN_EMAIL,

            password:
                QUIZFORGE_INITIAL_ADMIN_PASSWORD,

            coins:
                100,

            skins: [
                "default"
            ],

            selectedSkin:
                "default",

            badges: [],

            quizzesCreated:
                0,

            quizzesPlayed:
                0,

            totalScore:
                0,

            isAdmin:
                true,

            createdAt:
                new Date().toISOString(),

            lastLogin:
                null

        };


        users.push(
            admin
        );


        this.saveUsers(
            users
        );

    },


    /* =====================================================
       SIGN UP
    ===================================================== */

    signup(
        username,
        email,
        password
    ) {

        username =
            String(
                username || ""
            ).trim();


        email =
            String(
                email || ""
            )
            .trim()
            .toLowerCase();


        password =
            String(
                password || ""
            );


        if (!username) {

            throw new Error(
                "Please enter a username."
            );

        }


        if (
            username.length < 2
        ) {

            throw new Error(
                "Username must be at least 2 characters."
            );

        }


        if (
            !this.isValidEmail(
                email
            )
        ) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        if (
            password.length < 6
        ) {

            throw new Error(
                "Password must be at least 6 characters."
            );

        }


        const users =
            this.getUsers();


        const existingUser =
            users.find(
                user =>
                    user.email.toLowerCase() ===
                    email
            );


        if (existingUser) {

            throw new Error(
                "An account with this email already exists."
            );

        }


        const user = {

            id:
                this.createID(),

            username,

            email,

            password,

            coins:
                100,

            skins: [
                "default"
            ],

            selectedSkin:
                "default",

            badges: [],

            quizzesCreated:
                0,

            quizzesPlayed:
                0,

            totalScore:
                0,

            isAdmin:
                email ===
                QUIZFORGE_ADMIN_EMAIL,

            createdAt:
                new Date().toISOString(),

            lastLogin:
                null

        };


        users.push(
            user
        );


        this.saveUsers(
            users
        );


        /*
         * Automatically log the new user in.
         */

        this.login(
            email,
            password
        );


        return this.currentUser;

    },


    /* =====================================================
       LOGIN
    ===================================================== */

    login(
        email,
        password
    ) {

        email =
            String(
                email || ""
            )
            .trim()
            .toLowerCase();


        password =
            String(
                password || ""
            );


        if (!email) {

            throw new Error(
                "Please enter your email."
            );

        }


        if (!password) {

            throw new Error(
                "Please enter your password."
            );

        }


        const users =
            this.getUsers();


        const user =
            users.find(
                item =>
                    item.email.toLowerCase() ===
                    email &&
                    item.password ===
                    password
            );


        if (!user) {

            throw new Error(
                "Incorrect email or password."
            );

        }


        /*
         * Update login information.
         */

        user.lastLogin =
            new Date().toISOString();


        user.isAdmin =
            user.email.toLowerCase() ===
            QUIZFORGE_ADMIN_EMAIL.toLowerCase();


        this.saveUsers(
            users
        );


        /*
         * Make a fresh copy for the session.
         */

        this.currentUser =
            JSON.parse(
                JSON.stringify(
                    user
                )
            );


        this.saveSession();

        this.updateUI();


        return this.currentUser;

    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    logout() {

        /*
         * IMPORTANT:
         *
         * We only remove the SESSION.
         *
         * We DO NOT delete:
         * - account
         * - quizzes
         * - coins
         * - skins
         * - badges
         * - statistics
         */

        this.currentUser =
            null;


        sessionStorage.removeItem(
            this.SESSION_KEY
        );


        localStorage.removeItem(
            this.SESSION_KEY
        );


        this.updateUI();


        /*
         * Clear visible user-specific
         * screens without deleting data.
         */

        this.resetVisibleAccountUI();


        /*
         * Return user to login/home page.
         */

        if (
            typeof showPage ===
            "function"
        ) {

            try {

                showPage(
                    "login"
                );

            } catch {

                /*
                 * Login page may not exist yet.
                 */

            }

        }


        return true;

    },


    /* =====================================================
       RESTORE SESSION
    ===================================================== */

    restoreSession() {

        let savedSession =
            sessionStorage.getItem(
                this.SESSION_KEY
            );


        /*
         * Also support older QuizForge
         * versions that used localStorage.
         */

        if (!savedSession) {

            savedSession =
                localStorage.getItem(
                    this.SESSION_KEY
                );

        }


        if (!savedSession) {

            /*
             * Backwards compatibility.
             */

            const oldUser =
                localStorage.getItem(
                    "quizforge_user"
                );


            if (oldUser) {

                savedSession =
                    oldUser;

            }

        }


        if (!savedSession) {

            this.currentUser =
                null;

            return false;

        }


        try {

            const sessionUser =
                JSON.parse(
                    savedSession
                );


            /*
             * Find the latest saved version
             * of the account.
             */

            const users =
                this.getUsers();


            const actualUser =
                users.find(
                    user =>
                        user.id ===
                        sessionUser.id
                );


            if (!actualUser) {

                this.currentUser =
                    null;

                this.clearSession();

                return false;

            }


            this.currentUser =
                JSON.parse(
                    JSON.stringify(
                        actualUser
                    )
                );


            this.currentUser.isAdmin =
                this.currentUser.email
                    .toLowerCase() ===
                QUIZFORGE_ADMIN_EMAIL
                    .toLowerCase();


            this.saveSession();

            return true;

        }

        catch {

            this.currentUser =
                null;

            this.clearSession();

            return false;

        }

    },


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    changePassword(
        currentPassword,
        newPassword,
        confirmPassword
    ) {

        if (
            !this.currentUser
        ) {

            throw new Error(
                "You must be logged in."
            );

        }


        currentPassword =
            String(
                currentPassword || ""
            );


        newPassword =
            String(
                newPassword || ""
            );


        confirmPassword =
            String(
                confirmPassword || ""
            );


        /*
         * Check old password.
         */

        if (
            currentPassword !==
            this.currentUser.password
        ) {

            throw new Error(
                "Your current password is incorrect."
            );

        }


        /*
         * Check new password length.
         */

        if (
            newPassword.length < 6
        ) {

            throw new Error(
                "Your new password must be at least 6 characters."
            );

        }


        /*
         * Make sure the two new passwords
         * match.
         */

        if (
            newPassword !==
            confirmPassword
        ) {

            throw new Error(
                "The new passwords do not match."
            );

        }


        /*
         * Don't allow the same password.
         */

        if (
            currentPassword ===
            newPassword
        ) {

            throw new Error(
                "Your new password must be different."
            );

        }


        /*
         * Update saved account.
         */

        const users =
            this.getUsers();


        const index =
            users.findIndex(
                user =>
                    user.id ===
                    this.currentUser.id
            );


        if (index === -1) {

            throw new Error(
                "Account could not be found."
            );

        }


        users[index].password =
            newPassword;


        this.saveUsers(
            users
        );


        /*
         * Update active session.
         */

        this.currentUser.password =
            newPassword;


        this.saveSession();


        return true;

    },


    /* =====================================================
       SETTINGS — CHANGE PASSWORD UI
    ===================================================== */

    renderPasswordSettings(
        containerID =
            "passwordSettings"
    ) {

        const container =
            document.getElementById(
                containerID
            );


        if (!container) {
            return;
        }


        if (!this.currentUser) {

            container.innerHTML = `

                <div class="card">

                    <h3>
                        🔐 Login Required
                    </h3>

                    <p>
                        Log in to change your password.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="card">

                <h2>
                    🔑 Change Password
                </h2>

                <p>
                    Your current password is required
                    before you can create a new one.
                </p>


                <form
                    id="changePasswordForm"
                    onsubmit="
                        Auth.handlePasswordChange(event)
                    "
                >

                    <label>
                        Current Password
                    </label>

                    <input
                        id="currentPassword"
                        type="password"
                        autocomplete="current-password"
                        required
                        placeholder="Current password"
                    />


                    <label>
                        New Password
                    </label>

                    <input
                        id="newPassword"
                        type="password"
                        autocomplete="new-password"
                        minlength="6"
                        required
                        placeholder="New password"
                    />


                    <label>
                        Confirm New Password
                    </label>

                    <input
                        id="confirmPassword"
                        type="password"
                        autocomplete="new-password"
                        minlength="6"
                        required
                        placeholder="Confirm new password"
                    />


                    <button
                        type="submit"
                        class="primary"
                    >
                        🔒 Change Password
                    </button>

                </form>


                <div
                    id="passwordChangeMessage"
                ></div>

            </div>

        `;

    },


    /* =====================================================
       PASSWORD FORM HANDLER
    ===================================================== */

    handlePasswordChange(
        event
    ) {

        event.preventDefault();


        const current =
            document.getElementById(
                "currentPassword"
            )?.value;


        const newPassword =
            document.getElementById(
                "newPassword"
            )?.value;


        const confirm =
            document.getElementById(
                "confirmPassword"
            )?.value;


        const message =
            document.getElementById(
                "passwordChangeMessage"
            );


        try {

            this.changePassword(
                current,
                newPassword,
                confirm
            );


            if (message) {

                message.innerHTML = `

                    <div class="success-message">

                        ✅ Password changed successfully!

                    </div>

                `;

            }


            document.getElementById(
                "changePasswordForm"
            )?.reset();


        }

        catch(error) {

            if (message) {

                message.innerHTML = `

                    <div class="error-message">

                        ❌
                        ${this.escape(
                            error.message
                        )}

                    </div>

                `;

            }

        }

    },


    /* =====================================================
       ACCOUNT SETTINGS
    ===================================================== */

    renderSettings(
        containerID =
            "accountSettings"
    ) {

        const container =
            document.getElementById(
                containerID
            );


        if (!container) {
            return;
        }


        if (!this.currentUser) {

            container.innerHTML = `

                <div class="card">

                    <h2>
                        🔐 You are logged out
                    </h2>

                    <button
                        class="primary"
                        onclick="
                            showPage('login')
                        "
                    >
                        Login
                    </button>

                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="card">

                <h1>
                    ⚙️ Account Settings
                </h1>


                <div class="account-info">

                    <p>
                        <strong>
                            Username:
                        </strong>

                        ${this.escape(
                            this.currentUser.username
                        )}
                    </p>


                    <p>
                        <strong>
                            Email:
                        </strong>

                        ${this.escape(
                            this.currentUser.email
                        )}
                    </p>


                    <p>
                        <strong>
                            Coins:
                        </strong>

                        🪙
                        ${this.currentUser.coins || 0}
                    </p>


                    ${
                        this.isAdmin()
                            ? `
                                <p>
                                    👑
                                    <strong>
                                        Administrator
                                    </strong>
                                </p>
                            `
                            : ""
                    }

                </div>

            </div>

        `;


        /*
         * Also render password settings.
         */

        this.renderPasswordSettings();

    },


    /* =====================================================
       UPDATE USER
    ===================================================== */

    updateUser(
        changes
    ) {

        if (!this.currentUser) {

            return false;

        }


        Object.assign(
            this.currentUser,
            changes
        );


        /*
         * Make sure admin status cannot be
         * changed by normal account data.
         */

        this.currentUser.isAdmin =
            this.currentUser.email
                .toLowerCase() ===
            QUIZFORGE_ADMIN_EMAIL
                .toLowerCase();


        this.saveCurrentUser();


        this.updateUI();


        return true;

    },


    /* =====================================================
       SAVE CURRENT USER
    ===================================================== */

    saveCurrentUser() {

        if (!this.currentUser) {
            return false;
        }


        const users =
            this.getUsers();


        const index =
            users.findIndex(
                user =>
                    user.id ===
                    this.currentUser.id
            );


        if (index === -1) {

            return false;

        }


        users[index] =
            JSON.parse(
                JSON.stringify(
                    this.currentUser
                )
            );


        this.saveUsers(
            users
        );


        this.saveSession();


        return true;

    },


    /* =====================================================
       USER DATA
    ===================================================== */

    getUsers() {

        try {

            const data =
                localStorage.getItem(
                    this.USERS_KEY
                );


            if (!data) {

                return [];

            }


            const users =
                JSON.parse(
                    data
                );


            return Array.isArray(
                users
            )
                ? users
                : [];

        }

        catch {

            return [];

        }

    },


    saveUsers(
        users
    ) {

        localStorage.setItem(
            this.USERS_KEY,
            JSON.stringify(
                users
            )
        );

    },


    /* =====================================================
       SESSION
    ===================================================== */

    saveSession() {

        if (!this.currentUser) {
            return;
        }


        sessionStorage.setItem(
            this.SESSION_KEY,
            JSON.stringify(
                this.currentUser
            )
        );

    },


    clearSession() {

        sessionStorage.removeItem(
            this.SESSION_KEY
        );


        localStorage.removeItem(
            this.SESSION_KEY
        );


        localStorage.removeItem(
            "quizforge_user"
        );

    },


    /* =====================================================
       CHECK LOGIN
    ===================================================== */

    isLoggedIn() {

        return !!this.currentUser;

    },


    /* =====================================================
       ADMIN
    ===================================================== */

    isAdmin() {

        if (!this.currentUser) {
            return false;
        }


        return (
            this.currentUser.email
                .toLowerCase() ===
            QUIZFORGE_ADMIN_EMAIL
                .toLowerCase()
        );

    },


    /* =====================================================
       CURRENT USER
    ===================================================== */

    getCurrentUser() {

        if (!this.currentUser) {
            return null;
        }


        return this.currentUser;

    },


    /* =====================================================
       VALIDATE EMAIL
    ===================================================== */

    isValidEmail(
        email
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

    },


    /* =====================================================
       GENERATE ID
    ===================================================== */

    createID() {

        if (
            window.crypto &&
            typeof crypto.randomUUID ===
            "function"
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

    },


    /* =====================================================
       RESET VISIBLE ACCOUNT UI
       -----------------------------------------------------
       This DOES NOT delete saved data.
    ===================================================== */

    resetVisibleAccountUI() {

        const username =
            document.getElementById(
                "accountUsername"
            );


        const coins =
            document.getElementById(
                "accountCoins"
            );


        const coinCount =
            document.getElementById(
                "coinCount"
            );


        if (username) {

            username.textContent =
                "Guest";

        }


        if (coins) {

            coins.textContent =
                "0";

        }


        if (coinCount) {

            coinCount.textContent =
                "0";

        }


        const settings =
            document.getElementById(
                "accountSettings"
            );


        if (settings) {

            settings.innerHTML = `

                <div class="card">

                    <h2>
                        🔐 Logged Out
                    </h2>

                    <p>
                        Log in to view your account.
                    </p>

                </div>

            `;

        }


        const passwordSettings =
            document.getElementById(
                "passwordSettings"
            );


        if (passwordSettings) {

            passwordSettings.innerHTML = "";

        }

    },


    /* =====================================================
       UPDATE HEADER/UI
    ===================================================== */

    updateUI() {

        const username =
            document.getElementById(
                "accountUsername"
            );


        const coins =
            document.getElementById(
                "accountCoins"
            );


        const coinCount =
            document.getElementById(
                "coinCount"
            );


        const loginButton =
            document.getElementById(
                "loginButton"
            );


        if (
            this.currentUser
        ) {

            if (username) {

                username.textContent =
                    this.currentUser.username;

            }


            if (coins) {

                coins.textContent =
                    this.currentUser.coins ||
                    0;

            }


            if (coinCount) {

                coinCount.textContent =
                    this.currentUser.coins ||
                    0;

            }


            if (loginButton) {

                loginButton.textContent =
                    "👤 " +
                    this.currentUser.username;

            }

        }

        else {

            if (username) {

                username.textContent =
                    "Guest";

            }


            if (coins) {

                coins.textContent =
                    "0";

            }


            if (coinCount) {

                coinCount.textContent =
                    "0";

            }


            if (loginButton) {

                loginButton.textContent =
                    "🔐 Login";

            }

        }

    },


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

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


/* =========================================================
   START AUTHENTICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Auth.init();

    }
);
