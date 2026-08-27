/* =========================================================
   QUIZFORGE AUTH.JS
   Supabase Authentication
========================================================= */

const SUPABASE_URL =
    "https://hlnrnnolzlvkwuilwfky.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_POI4OqPx3GIX59rMfct_oA_JuWdss3v";


/* =========================================================
   CREATE SUPABASE CLIENT
========================================================= */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   QUIZFORGE AUTH
========================================================= */

const Auth = {

    currentUser: null,
    profile: null,


    /* =====================================================
       INITIALISE
    ===================================================== */

    async init() {

        try {

            const {
                data
            } =
                await supabaseClient.auth.getSession();


            if (data.session) {

                await this.loadUser(
                    data.session.user
                );

            }


            /*
             * Listen for login/logout/email
             * verification events.
             */

            supabaseClient.auth.onAuthStateChange(
                async (
                    event,
                    session
                ) => {

                    console.log(
                        "Auth event:",
                        event
                    );


                    if (session?.user) {

                        await this.loadUser(
                            session.user
                        );

                    }

                    else {

                        this.currentUser =
                            null;

                        this.profile =
                            null;

                    }


                    this.updateUI();

                }
            );


            this.updateUI();

        }

        catch (error) {

            console.error(
                "QuizForge authentication error:",
                error
            );

        }

    },


    /* =====================================================
       SIGN UP
    ===================================================== */

    async signup(
        username,
        email,
        password,
        confirmPassword
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


        confirmPassword =
            String(
                confirmPassword || ""
            );


        /* -----------------------------------------------
           VALIDATION
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


        if (!this.isValidEmail(email)) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        if (password.length < 6) {

            throw new Error(
                "Password must be at least 6 characters."
            );

        }


        if (
            password !==
            confirmPassword
        ) {

            throw new Error(
                "The passwords do not match."
            );

        }


        /* -----------------------------------------------
           SUPABASE SIGN UP
        ------------------------------------------------ */

        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        username

                    },

                    emailRedirectTo:
                        window.location.origin +
                        window.location.pathname

                }

            });


        if (error) {

            throw error;

        }


        /*
         * If email confirmation is enabled,
         * session may be null here.
         */

        if (!data.user) {

            throw new Error(
                "Account could not be created."
            );

        }


        /*
         * If confirmation is required,
         * show the verification message.
         */

        if (!data.session) {

            this.showMessage(
                "signupMessage",
                "📧 Account created! Check your email and click the verification link before logging in.",
                "success"
            );

            return {

                user:
                    data.user,

                needsVerification:
                    true

            };

        }


        /*
         * If email confirmation isn't required,
         * create/load the profile.
         */

        await this.createProfile(
            data.user,
            username
        );


        await this.loadUser(
            data.user
        );


        this.updateUI();


        return {

            user:
                data.user,

            needsVerification:
                false

        };

    },


    /* =====================================================
       LOGIN
    ===================================================== */

    async login(
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


        if (!this.isValidEmail(email)) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        if (!password) {

            throw new Error(
                "Please enter your password."
            );

        }


        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({

                email,

                password

            });


        if (error) {

            throw new Error(
                "Incorrect email or password."
            );

        }


        if (!data.user) {

            throw new Error(
                "Login failed."
            );

        }


        /*
         * Check email verification.
         */

        if (
            !data.user.email_confirmed_at
        ) {

            await supabaseClient.auth.signOut();

            throw new Error(
                "Please verify your email address before logging in."
            );

        }


        await this.loadUser(
            data.user
        );


        this.updateUI();


        return this.currentUser;

    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    async logout() {

        /*
         * Supabase signs out the session.
         *
         * Profile/database data is NOT deleted.
         */

        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

        }


        this.currentUser =
            null;

        this.profile =
            null;


        this.updateUI();


        /*
         * Return to login page.
         */

        if (
            typeof showPage ===
            "function"
        ) {

            try {

                showPage(
                    "login"
                );

            }

            catch {

                // Login page unavailable.

            }

        }


        return true;

    },


    /* =====================================================
       LOAD USER
    ===================================================== */

    async loadUser(
        user
    ) {

        if (!user) {

            this.currentUser =
                null;

            this.profile =
                null;

            return;

        }


        this.currentUser =
            user;


        /*
         * Load profile.
         */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            return;

        }


        if (!data) {

            /*
             * Profile doesn't exist yet.
             */

            await this.createProfile(
                user,
                user.user_metadata?.username ||
                user.email?.split("@")[0] ||
                "Player"
            );


            return this.loadUser(
                user
            );

        }


        this.profile =
            data;


        /*
         * Combine user + profile.
         */

        this.currentUser = {

            ...user,

            ...data

        };

    },


    /* =====================================================
       CREATE PROFILE
    ===================================================== */

    async createProfile(
        user,
        username
    ) {

        const email =
            user.email?.toLowerCase() || "";


        const isAdmin =
            email ===
            "garfield678521@gmail.com";


        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id:
                        user.id,

                    username:
                        username,

                    coins:
                        100,

                    skins:
                        ["default"],

                    selected_skin:
                        "default",

                    badges:
                        [],

                    quizzes_created:
                        0,

                    quizzes_played:
                        0,

                    total_score:
                        0,

                    is_admin:
                        isAdmin

                })
                .select()
                .single();


        if (error) {

            /*
             * Profile might already exist.
             */

            if (
                error.code !==
                "23505"
            ) {

                console.error(
                    "Profile creation error:",
                    error
                );

            }

            return null;

        }


        this.profile =
            data;


        return data;

    },


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    async changePassword(
        newPassword,
        confirmPassword
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        if (
            !newPassword ||
            newPassword.length < 6
        ) {

            throw new Error(
                "Password must be at least 6 characters."
            );

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            throw new Error(
                "The passwords do not match."
            );

        }


        const {
            error
        } =
            await supabaseClient.auth
                .updateUser({

                    password:
                        newPassword

                });


        if (error) {

            throw error;

        }


        return true;

    },


    /* =====================================================
       SEND PASSWORD RESET EMAIL
    ===================================================== */

    async sendPasswordReset(
        email
    ) {

        email =
            String(
                email || ""
            )
            .trim()
            .toLowerCase();


        if (!this.isValidEmail(email)) {

            throw new Error(
                "Please enter a valid email address."
            );

        }


        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {

                        redirectTo:
                            window.location.origin +
                            window.location.pathname

                    }
                );


        if (error) {

            throw error;

        }


        return true;

    },


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    getCurrentUser() {

        return this.currentUser;

    },


    /* =====================================================
       GET PROFILE
    ===================================================== */

    getProfile() {

        return this.profile;

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
                ?.toLowerCase() ===
            "garfield678521@gmail.com"
        );

    },


    /* =====================================================
       ADMIN PERMISSION
    ===================================================== */

    hasPermission(
        permission
    ) {

        if (!this.isAdmin()) {

            return false;

        }


        const permissions = {

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


        return permissions[
            permission
        ] === true;

    },


    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    async updateProfile(
        changes = {}
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        /*
         * Never allow client-side code to
         * make itself admin.
         */

        delete changes.is_admin;


        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .update(changes)
                .eq(
                    "id",
                    this.currentUser.id
                )
                .select()
                .single();


        if (error) {

            throw error;

        }


        this.profile =
            data;


        this.currentUser = {

            ...this.currentUser,

            ...data

        };


        this.updateUI();


        return data;

    },


    /* =====================================================
       ADD COINS
    ===================================================== */

    async addCoins(
        amount
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        amount =
            Number(amount);


        if (
            !Number.isFinite(amount)
        ) {

            throw new Error(
                "Invalid coin amount."
            );

        }


        const newCoins =
            Math.max(
                0,
                Number(
                    this.profile?.coins || 0
                ) + amount
            );


        return this.updateProfile({

            coins:
                newCoins

        });

    },


    /* =====================================================
       ADD SKIN
    ===================================================== */

    async addSkin(
        skinID
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        const skins =
            Array.isArray(
                this.profile?.skins
            )
                ? [
                    ...this.profile.skins
                ]
                : [
                    "default"
                ];


        if (
            !skins.includes(
                skinID
            )
        ) {

            skins.push(
                skinID
            );

        }


        return this.updateProfile({

            skins

        });

    },


    /* =====================================================
       EQUIP SKIN
    ===================================================== */

    async equipSkin(
        skinID
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        const skins =
            this.profile?.skins || [];


        if (
            !skins.includes(
                skinID
            )
        ) {

            throw new Error(
                "You don't own this skin."
            );

        }


        return this.updateProfile({

            selected_skin:
                skinID

        });

    },


    /* =====================================================
       ADD BADGE
    ===================================================== */

    async addBadge(
        badgeID
    ) {

        if (!this.currentUser) {

            throw new Error(
                "You must be logged in."
            );

        }


        const badges =
            Array.isArray(
                this.profile?.badges
            )
                ? [
                    ...this.profile.badges
                ]
                : [];


        if (
            !badges.includes(
                badgeID
            )
        ) {

            badges.push(
                badgeID
            );

        }


        return this.updateProfile({

            badges

        });

    },


    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    isValidEmail(
        email
    ) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
            .test(
                String(
                    email || ""
                ).trim()
            );

    },


    /* =====================================================
       SHOW MESSAGE
    ===================================================== */

    showMessage(
        elementID,
        message,
        type = "info"
    ) {

        const element =
            document.getElementById(
                elementID
            );


        if (!element) {

            alert(message);

            return;

        }


        element.textContent =
            message;


        element.className =
            `auth-message ${type}`;

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


        if (this.currentUser) {

            const name =
                this.profile?.username ||
                this.currentUser.user_metadata
                    ?.username ||
                "Player";


            const coinValue =
                this.profile?.coins ||
                0;


            if (username) {

                username.textContent =
                    name;

            }


            if (coins) {

                coins.textContent =
                    coinValue;

            }


            if (coinCount) {

                coinCount.textContent =
                    coinValue;

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

        }

    }

};


/* =========================================================
   LOGIN FORM
========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();


    const email =
        document.getElementById(
            "loginEmail"
        )?.value || "";


    const password =
        document.getElementById(
            "loginPassword"
        )?.value || "";


    try {

        await Auth.login(
            email,
            password
        );


        Auth.showMessage(
            "loginMessage",
            "✅ Login successful!",
            "success"
        );


        if (
            typeof showPage ===
            "function"
        ) {

            showPage(
                "home"
            );

        }

    }

    catch (error) {

        Auth.showMessage(
            "loginMessage",
            "❌ " +
            error.message,
            "error"
        );

    }

}


/* =========================================================
   SIGNUP FORM
========================================================= */

async function handleSignup(
    event
) {

    event.preventDefault();


    const username =
        document.getElementById(
            "signupUsername"
        )?.value || "";


    const email =
        document.getElementById(
            "signupEmail"
        )?.value || "";


    const password =
        document.getElementById(
            "signupPassword"
        )?.value || "";


    const confirmPassword =
        document.getElementById(
            "signupConfirmPassword"
        )?.value || "";


    try {

        const result =
            await Auth.signup(

                username,

                email,

                password,

                confirmPassword

            );


        if (
            result.needsVerification
        ) {

            Auth.showMessage(

                "signupMessage",

                "📧 We've sent you a verification email. Check your inbox and click the verification link.",

                "success"

            );


            return;

        }


        Auth.showMessage(

            "signupMessage",

            "✅ Account created successfully!",

            "success"

        );


        if (
            typeof showPage ===
            "function"
        ) {

            showPage(
                "home"
            );

        }

    }

    catch (error) {

        Auth.showMessage(

            "signupMessage",

            "❌ " +
            error.message,

            "error"

        );

    }

}


/* =========================================================
   CHANGE PASSWORD FORM
========================================================= */

async function handlePasswordChange(
    event
) {

    event.preventDefault();


    const newPassword =
        document.getElementById(
            "newPassword"
        )?.value || "";


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        )?.value || "";


    try {

        await Auth.changePassword(

            newPassword,

            confirmPassword

        );


        Auth.showMessage(

            "passwordMessage",

            "✅ Password changed successfully!",

            "success"

        );


        document
            .getElementById(
                "changePasswordForm"
            )
            ?.reset();

    }

    catch (error) {

        Auth.showMessage(

            "passwordMessage",

            "❌ " +
            error.message,

            "error"

        );

    }

}


/* =========================================================
   PASSWORD RESET FORM
========================================================= */

async function handlePasswordReset(
    event
) {

    event.preventDefault();


    const email =
        document.getElementById(
            "resetEmail"
        )?.value || "";


    try {

        await Auth.sendPasswordReset(
            email
        );


        Auth.showMessage(

            "resetMessage",

            "📧 Password reset email sent!",

            "success"

        );

    }

    catch (error) {

        Auth.showMessage(

            "resetMessage",

            "❌ " +
            error.message,

            "error"

        );

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        Auth.init();

    }
);
