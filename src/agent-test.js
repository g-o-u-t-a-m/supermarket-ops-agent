const {
    runAgent
} = require("./agent/agent");


async function main() {

    const message =
        process.argv
            .slice(2)
            .join(" ");


    if (!message) {

        console.log(
            'Usage: node src/agent-test.js "your message"'
        );

        return;
    }


    console.log(
        "\nOWNER:"
    );

    console.log(
        message
    );


    console.log(
        "\nAGENT:"
    );


    const result =
        await runAgent(
            message
        );


    console.log(
        result.text
    );
}


main();