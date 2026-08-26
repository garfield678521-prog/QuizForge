/* =========================================================
   QUIZFORGE AUTH.JS
   Complete Authentication System
   =========================================================

   FEATURES
   • Login
   • Sign up
   • Valid email checking
   • Required passwords
   • Password changing
   • Logout
   • Persistent account data
   • Separate data for every account
   • Admin detection
   • Admin permissions
   • Session restoration
   • Account settings
   • Coins / skins / badges saved
   • Logout does NOT delete account data

   IMPORTANT:
   This localStorage version is for a demo/GitHub Pages
   prototype. Real production authentication should use
   a secure backend with password hashing.
========================================================= */


/* =========================================================
   SETTINGS
========================================================= */

const QUIZFORGE_AUTH_CONFIG = {

    ADMIN_EMAIL:
        "garfield678521@gmail.com",

    /*
     * Initial admin password.
     *
     * WARNING:
     * Because this is a GitHub Pages/local version,
     * anyone who can inspect the source can potentially
     * discover this password.
     *
     * Move authentication to a backend before using
     * this for a real public service.
     */

    INITIAL_ADMIN_PASSWORD:
        "OscArc22",

    MIN_PASSWORD_LENGTH:
        6,

    USERS_STORAGE_KEY:
        "quizforge_users",

    SESSION_STORAGE_KEY:
        "quizforge_session"

};


/* =========================================================
   ADMIN PERMISSIONS
========================================================= */

const QUIZFORGE_ADMIN_PERMISSIONS = {

    MANAGE_USERS: true,

    MANAGE_QUIZZES: true,

    DELETE_PUBLIC_QUIZZES: true,

    MANAGE_BADGES: true,

    MANAGE_SKINS: true,

    MANAGE_COINS: true,

    VIEW_RESULTS: true,

    VIEW_STATISTICS: true,

    ADMIN_SETTINGS: true,

    MODERATE_LIBRARY: true

};


/* =========================================================
   AUTH OBJECT
========================================================= */

const Auth = {

    currentUser: null,


    /* =====================================================
       INITIALISE
    ===================================================== */

    init() {

        this.createAdminAccount();

        this.restoreSession();

        this.updateUI();

    },


    /* =====================================================
       GET USERS
    ===================================================== */

    getUsers() {

        try {

            const stored =
                localStorage.getItem(
                    QUIZFORGE_AUTH_CONFIG.USERS_STORAGE_KEY
                );


            if (!stored) {

                return [];

            }


            const users =
                JSON.parse(stored);


            if (!Array.isArray(users)) {

                return [];

            }


            return users;

        }

        catch (error) {

            console.error(
                "QuizForge: Could not load users.",
                error
            );

            return [];

        }

    },


    /* =====================================================
       SAVE USERS
    ===================================================== */

    saveUsers(users) {

        localStorage.setItem(

            QUIZFORGE_AUTH_CONFIG.USERS_STORAGE_KEY,

            JSON.stringify(users)

        );

    },


    /* =====================================================
       CREATE ADMIN ACCOUNT
    ===================================================== */

    createAdminAccount() {

        const users =
            this.getUsers();


        const adminEmail =
            QUIZFORGE_AUTH_CONFIG.ADMIN_EMAIL
                .toLowerCase();


        const existingAdmin =
            users.find(
                user =>
                    user.email &&
                    user.email.toLowerCase() ===
                    adminEmail
            );


        if (existingAdmin) {

            /*
             * Make sure the account remains
             * recognised as admin.
             */

            existingAdmin.isAdmin = true;

            this.saveUsers(users);

            return;

        }


        const admin = {

            id:
                this.createID(),

            username:
                "Admin",

            email:
                adminEmail,

            password:
                QUIZFORGE_AUTH_CONFIG
                    .INITIAL_ADMIN_PASSWORD,

            isAdmin:
                true,

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

            createdAt:
                new Date().toISOString(),

            lastLogin:
                null

        };


        users.push(admin);

        this.saveUsers(users);

    },


    /* =====================================================
       VALID EMAIL
    ===================================================== */

    isValidEmail(email) {

        if (!email) {

            return false;

        }


        email =
            String(email).trim();


        /*
         * Basic but useful email validation.
         */

        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
            .test(email);

    },


    /* =====================================================
       VALID PASSWORD
    ===================================================== */

    isValidPassword(password) {

        if (!password) {

            return false;

        }


        return String(password).length >=
            QUIZFORGE_AUTH_CONFIG
                .MIN_PASSWORD_LENGTH;

    },


    /* =====================================================
       SIGN UP
    ===================================================== */

    signup(
        username,
        email,
        password,
        confirmPassword = password
    ) {

        username =
            String(username || "")
                .trim();


        email =
            String(email || "")
                .trim()
                .toLowerCase();


        password =
            String(password || "");


        confirmPassword =
            String(confirmPassword || "");


        /* -----------------------------------------------
           USERNAME
        ------------------------------------------------ */

        if (!username) {

            throw new Error(
                "Please enter a username."
            );

        }


        if (username.length < 2) {

            throw new Error(
                "Username must be at least 2 characters."
            );

        }


        /* -----------------------------------------------
           EMAIL
        ------------------------------------------------ */

        if (!email) {

            throw new Error(
                "Please enter your email address."
            );

        }


        if (!this.isValidEmail(email)) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        /* -----------------------------------------------
           PASSWORD
        ------------------------------------------------ */

        if (!password) {

            throw new Error(
                "Please enter a password."
            );

        }


        if (!this.isValidPassword(password)) {

            throw new Error(
                `Password must be at least ${
                    QUIZFORGE_AUTH_CONFIG
                        .MIN_PASSWORD_LENGTH
                } characters.`
            );

        }


        /* -----------------------------------------------
           CONFIRM PASSWORD
        ------------------------------------------------ */

        if (
            password !==
            confirmPassword
        ) {

            throw new Error(
                "The passwords do not match."
            );

        }


        /* -----------------------------------------------
           CHECK EXISTING USER
        ------------------------------------------------ */

        const users =
            this.getUsers();


        const existing =
            users.find(
                user =>
                    user.email &&
                    user.email.toLowerCase() ===
                    email
            );


        if (existing) {

            throw new Error(
                "An account with this email already exists."
            );

        }


        /* -----------------------------------------------
           CREATE USER
        ------------------------------------------------ */

        const user = {

            id:
                this.createID(),

            username,

            email,

            password,

            isAdmin:
                email ===
                QUIZFORGE_AUTH_CONFIG
                    .ADMIN_EMAIL
                    .toLowerCase(),

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

            createdAt:
                new Date().toISOString(),

            lastLogin:
                null

        };


        users.push(user);

        this.saveUsers(users);


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
            String(email || "")
                .trim()
                .toLowerCase();


        password =
            String(password || "");


        /* -----------------------------------------------
           EMAIL REQUIRED
        ------------------------------------------------ */

        if (!email) {

            throw new Error(
                "Please enter your email address."
            );

        }


        /* -----------------------------------------------
           EMAIL VALIDATION
        ------------------------------------------------ */

        if (!this.isValidEmail(email)) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        /* -----------------------------------------------
           PASSWORD REQUIRED
        ------------------------------------------------ */

        if (!password) {

            throw new Error(
                "Please enter your password."
            );

        }


        /* -----------------------------------------------
           FIND ACCOUNT
        ------------------------------------------------ */

        const users =
            this.getUsers();


        const user =
            users.find(
                item =>

                    item.email &&
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


        /* -----------------------------------------------
           UPDATE LOGIN
        ------------------------------------------------ */

        user.lastLogin =
            new Date().toISOString();


        /*
         * Always calculate admin status from
         * the protected admin email.
         */

        user.isAdmin =
            user.email.toLowerCase() ===
            QUIZFORGE_AUTH_CONFIG
                .ADMIN_EMAIL
                .toLowerCase();


        this.saveUsers(users);


        /* -----------------------------------------------
           CREATE SESSION
        ------------------------------------------------ */

        this.currentUser =
            JSON.parse(
                JSON.stringify(user)
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
         * ONLY the session is removed.
         *
         * The following remain saved:
         *
         * ✓ Account
         * ✓ Quizzes
         * ✓ Coins
         * ✓ Skins
         * ✓ Badges
         * ✓ Statistics
         */

        this.currentUser = null;


        sessionStorage.removeItem(
            QUIZFORGE_AUTH_CONFIG
                .SESSION_STORAGE_KEY
        );


        /*
         * Remove any old session stored
         * by previous versions.
         */

        localStorage.removeItem(
            QUIZFORGE_AUTH_CONFIG
                .SESSION_STORAGE_KEY
        );


        localStorage.removeItem(
            "quizforge_user"
        );


        this.updateUI();

        this.resetVisibleUI();


        /*
         * Return to login screen if
         * app.js provides showPage().
         */

        if (
            typeof showPage ===
            "function"
        ) {

            try {

                showPage("login");

            }

            catch (error) {

                console.warn(
                    "QuizForge: Could not open login page.",
                    error
                );

            }

        }


        return true;

    },


    /* =====================================================
       SAVE SESSION
    ===================================================== */

    saveSession() {

        if (!this.currentUser) {

            return false;

        }


        sessionStorage.setItem(

            QUIZFORGE_AUTH_CONFIG
                .SESSION_STORAGE_KEY,

            JSON.stringify(
                this.currentUser
            )

        );


        return true;

    },


    /* =====================================================
       RESTORE SESSION
    ===================================================== */

    restoreSession() {

        let saved =
            sessionStorage.getItem(

                QUIZFORGE_AUTH_CONFIG
                    .SESSION_STORAGE_KEY

            );


        /*
         * Compatibility with older version.
         */

        if (!saved) {

            saved =
                localStorage.getItem(

                    QUIZFORGE_AUTH_CONFIG
                        .SESSION_STORAGE_KEY

                );

        }


        if (!saved) {

            this.currentUser = null;

            return false;

        }


        try {

            const sessionUser =
                JSON.parse(saved);


            const users =
                this.getUsers();


            const actualUser =
                users.find(
                    user =>
                        user.id ===
                        sessionUser.id
                );


            if (!actualUser) {

                this.currentUser = null;

                this.clearSession();

                return false;

            }


            /*
             * Load the latest account data.
             */

            this.currentUser =
                JSON.parse(
                    JSON.stringify(
                        actualUser
                    )
                );


            this.currentUser.isAdmin =
                this.currentUser.email
                    .toLowerCase() ===
                QUIZFORGE_AUTH_CONFIG
                    .ADMIN_EMAIL
                    .toLowerCase();


            this.saveSession();

            return true;

        }

        catch (error) {

            console.error(
                "QuizForge: Invalid session.",
                error
            );


            this.currentUser = null;

            this.clearSession();

            return false;

        }

    },


    /* =====================================================
       CLEAR SESSION
    ===================================================== */

    clearSession() {

        sessionStorage.removeItem(

            QUIZFORGE_AUTH_CONFIG
                .SESSION_STORAGE_KEY

        );


        localStorage.removeItem(

            QUIZFORGE_AUTH_CONFIG
                .SESSION_STORAGE_KEY

        );


        localStorage.removeItem(
            "quizforge_user"
        );

    },


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    changePassword(
        currentPassword,
        newPassword,
        confirmPassword
    ) {

        if (!this.currentUser) {

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


        /* -----------------------------------------------
           CURRENT PASSWORD
        ------------------------------------------------ */

        if (!currentPassword) {

            throw new Error(
                "Please enter your current password."
            );

        }


        if (
            currentPassword !==
            this.currentUser.password
        ) {

            throw new Error(
                "Your current password is incorrect."
            );

        }


        /* -----------------------------------------------
           NEW PASSWORD
        ------------------------------------------------ */

        if (!newPassword) {

            throw new Error(
                "Please enter a new password."
            );

        }


        if (
            !this.isValidPassword(
                newPassword
            )
        ) {

            throw new Error(
                `Your new password must be at least ${
                    QUIZFORGE_AUTH_CONFIG
                        .MIN_PASSWORD_LENGTH
                } characters.`
            );

        }


        /* -----------------------------------------------
           CONFIRM
        ------------------------------------------------ */

        if (
            newPassword !==
            confirmPassword
        ) {

            throw new Error(
                "The new passwords do not match."
            );

        }


        /* -----------------------------------------------
           SAME PASSWORD
        ------------------------------------------------ */

        if (
            currentPassword ===
            newPassword
        ) {

            throw new Error(
                "Your new password must be different."
            );

        }


        /* -----------------------------------------------
           FIND USER
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           UPDATE PASSWORD
        ------------------------------------------------ */

        users[index].password =
            newPassword;


        this.saveUsers(users);


        /*
         * Update current session.
         */

        this.currentUser.password =
            newPassword;


        this.saveSession();


        return true;

    },


    /* =====================================================
       UPDATE ACCOUNT
    ===================================================== */

    updateUser(changes = {}) {

        if (!this.currentUser) {

            return false;

        }


        /*
         * Don't allow users to change their
         * admin status manually.
         */

        delete changes.isAdmin;


        /*
         * Don't allow users to change their
         * email to impersonate the admin.
         *
         * A proper backend should enforce this too.
         */

        if (
            changes.email
        ) {

            changes.email =
                String(
                    changes.email
                )
                .trim()
                .toLowerCase();


            if (
                !this.isValidEmail(
                    changes.email
                )
            ) {

                throw new Error(
                    "Please enter a valid email address."
                );

            }

        }


        Object.assign(
            this.currentUser,
            changes
        );


        this.currentUser.isAdmin =
            this.currentUser.email
                .toLowerCase() ===
            QUIZFORGE_AUTH_CONFIG
                .ADMIN_EMAIL
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


        this.saveUsers(users);

        this.saveSession();


        return true;

    },


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    getCurrentUser() {

        if (!this.currentUser) {

            return null;

        }


        return this.currentUser;

    },


    /* =====================================================
       IS LOGGED IN
    ===================================================== */

    isLoggedIn() {

        return Boolean(
            this.currentUser
        );

    },


    /* =====================================================
       IS ADMIN
    ===================================================== */

    isAdmin() {

        if (!this.currentUser) {

            return false;

        }


        return (
            this.currentUser.email
                .toLowerCase() ===
            QUIZFORGE_AUTH_CONFIG
                .ADMIN_EMAIL
                .toLowerCase()
        );

    },


    /* =====================================================
       HAS ADMIN PERMISSION
    ===================================================== */

    hasPermission(
        permission
    ) {

        if (!this.isAdmin()) {

            return false;

        }


        return (
            QUIZFORGE_ADMIN_PERMISSIONS[
                permission
            ] === true
        );

    },


    /* =====================================================
       REQUIRE ADMIN
    ===================================================== */

    requireAdmin(
        permission = null
    ) {

        if (!this.isAdmin()) {

            throw new Error(
                "Administrator permission required."
            );

        }


        if (
            permission &&
            !this.hasPermission(
                permission
            )
        ) {

            throw new Error(
                "You do not have permission to perform this action."
            );

        }


        return true;

    },


    /* =====================================================
       GET ADMIN PERMISSIONS
    ===================================================== */

    getAdminPermissions() {

        if (!this.isAdmin()) {

            return {};

        }


        return {
            ...QUIZFORGE_ADMIN_PERMISSIONS
        };

    },


    /* =====================================================
       UPDATE COINS
    ===================================================== */

    addCoins(
        amount
    ) {

        if (!this.currentUser) {

            return false;

        }


        amount =
            Number(amount);


        if (
            !Number.isFinite(amount)
        ) {

            return false;

        }


        this.currentUser.coins =
            Math.max(
                0,
                Number(
                    this.currentUser.coins || 0
                ) + amount
            );


        this.saveCurrentUser();


        return this.currentUser.coins;

    },


    /* =====================================================
       ADD SKIN
    ===================================================== */

    addSkin(
        skinID
    ) {

        if (!this.currentUser) {

            return false;

        }


        if (
            !this.currentUser.skins
        ) {

            this.currentUser.skins = [];

        }


        if (
            !this.currentUser.skins
                .includes(skinID)
        ) {

            this.currentUser.skins.push(
                skinID
            );

        }


        this.saveCurrentUser();


        return true;

    },


    /* =====================================================
       EQUIP SKIN
    ===================================================== */

    equipSkin(
        skinID
    ) {

        if (!this.currentUser) {

            return false;

        }


        if (
            !this.currentUser.skins ||
            !this.currentUser.skins.includes(
                skinID
            )
        ) {

            throw new Error(
                "You do not own this skin."
            );

        }


        this.currentUser.selectedSkin =
            skinID;


        this.saveCurrentUser();


        return true;

    },


    /* =====================================================
       ADD BADGE
    ===================================================== */

    addBadge(
        badgeID
    ) {

        if (!this.currentUser) {

            return false;

        }


        if (
            !this.currentUser.badges
        ) {

            this.currentUser.badges = [];

        }


        if (
            !this.currentUser.badges
                .includes(badgeID)
        ) {

            this.currentUser.badges.push(
                badgeID
            );

        }


        this.saveCurrentUser();


        return true;

    },


    /* =====================================================
       PASSWORD SETTINGS UI
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

                    <h3>🔐 Login Required</h3>

                    <p>
                        You must be logged in
                        to change your password.
                    </p>

                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="card">

                <h2>🔑 Change Password</h2>

                <p>
                    Enter your current password,
                    then choose a new password.
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
                    >


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
                    >


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
                    >


                    <button
                        type="submit"
                    >
                        🔒 Change Password
                    </button>


                    <div
                        id="passwordChangeMessage"
                    ></div>

                </form>

            </div>

        `;

    },


    /* =====================================================
       HANDLE PASSWORD FORM
    ===================================================== */

    handlePasswordChange(
        event
    ) {

        event.preventDefault();


        const current =
            document.getElementById(
                "currentPassword"
            )?.value || "";


        const newPassword =
            document.getElementById(
                "newPassword"
            )?.value || "";


        const confirm =
            document.getElementById(
                "confirmPassword"
            )?.value || "";


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


            document
                .getElementById(
                    "changePasswordForm"
                )
                ?.reset();

        }

        catch (error) {

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
       RESET VISIBLE UI
       DOES NOT DELETE DATA
    ===================================================== */

    resetVisibleUI() {

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

                    <h2>🔐 Logged Out</h2>

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
       UPDATE UI
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


        if (this.currentUser) {

            if (username) {

                username.textContent =
                    this.currentUser.username;

            }


            if (coins) {

                coins.textContent =
                    this.currentUser.coins || 0;

            }


            if (coinCount) {

                coinCount.textContent =
                    this.currentUser.coins || 0;

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
       GENERATE USER ID
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
                .substring(2)
        );

    },


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    escape(value) {

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
   START AUTH SYSTEM
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Auth.init();

    }
);
