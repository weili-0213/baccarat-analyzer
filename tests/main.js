import dealerTest from "./dealer.test.js";

async function run() {

    console.clear();

    console.log("=================================");
    console.log(" Baccarat Analyzer Test Runner");
    console.log("=================================");

    try {

        await dealerTest();

    }
    catch (error) {

        console.error("");

        console.error("❌ Dealer Test FAIL");

        console.error(error);

    }

}

run();
