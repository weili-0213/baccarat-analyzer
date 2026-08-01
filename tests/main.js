async function run() {

    console.clear();

    console.log("==========");

    console.log("Dealer");

    console.log("==========");

    await testDealer();

    console.log("");

    console.log("==========");

    console.log("Round");

    console.log("==========");

    await testRound();

    console.log("");

    console.log("==========");

    console.log("History");

    console.log("==========");

    await testHistory();

}

run();
