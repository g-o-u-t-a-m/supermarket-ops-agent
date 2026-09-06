const {
    generateSalesDeck
} = require("./tools/documents/salesDeck");


async function main() {

    const result =
        await generateSalesDeck();


    console.log(result);
}


main();