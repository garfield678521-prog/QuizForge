/* =====================================
   QUIZFORGE QZ FILE SYSTEM
===================================== */

const QZ_VERSION = 2;


/* Create a blank quiz */

function createBlankQuiz() {

    return {

        format: "QuizForge",

        formatVersion: QZ_VERSION,

        id: crypto.randomUUID(),

        title: "",

        description: "",

        category: "Other",

        difficulty: "Medium",

        creator: "Local Player",

        createdAt:
            new Date().toISOString(),

        questions: []

    };

}


/* Validate a quiz */

function validateQZ(data) {

    if (!data) {

        throw new Error(
            "The file is empty."
        );

    }


    if (
        data.format !== "QuizForge"
    ) {

        throw new Error(
            "This is not a QuizForge file."
        );

    }


    if (
        !Array.isArray(data.questions)
    ) {

        throw new Error(
            "Questions are missing."
        );

    }


    data.questions.forEach(
        (question, index) => {

            if (
                typeof question.question !==
                "string"
            ) {

                throw new Error(
                    `Question ${index + 1} is invalid.`
                );

            }


            if (
                !Array.isArray(
                    question.answers
                ) ||
                question.answers.length !== 4
            ) {

                throw new Error(
                    `Question ${index + 1} must have exactly 4 answers.`
                );

            }


            if (
                !Number.isInteger(
                    question.correct
                ) ||
                question.correct < 0 ||
                question.correct > 3
            ) {

                throw new Error(
                    `Question ${index + 1} has an invalid correct answer.`
                );

            }

        }
    );


    return true;

}


/* Export */

function downloadQZ(data) {

    validateQZ(data);


    const json =
        JSON.stringify(
            data,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        makeSafeFilename(
            data.title || "Quiz"
        ) + ".qz";


    document.body.appendChild(link);


    link.click();


    link.remove();


    setTimeout(
        () =>
            URL.revokeObjectURL(url),
        1000
    );

}


/* Import */

function importQZFile(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                reject(
                    new Error(
                        "No file selected."
                    )
                );

                return;
            }


            const reader =
                new FileReader();


            reader.onerror = () => {

                reject(
                    new Error(
                        "Could not read the file."
                    )
                );

            };


            reader.onload = () => {

                try {

                    let text =
                        reader.result;


                    /*
                        Remove accidental
                        BOM characters.
                    */

                    text =
                        text.replace(
                            /^\uFEFF/,
                            ""
                        );


                    const data =
                        JSON.parse(text);


                    validateQZ(data);


                    if (!data.id) {

                        data.id =
                            crypto.randomUUID();

                    }


                    resolve(data);

                }

                catch(error) {

                    reject(error);

                }

            };


            reader.readAsText(file);

        }
    );

}


/* Safe filename */

function makeSafeFilename(name) {

    return String(name)

        .replace(
            /[^a-z0-9_\- ]/gi,
            ""
        )

        .trim()

        .replace(
            /\s+/g,
            "_"
        )

        .substring(
            0,
            60
        )

        || "Quiz";

}
