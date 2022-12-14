const POP3Client = require("./client");

const ReadLine = require("readline/promises");



const prompter = ReadLine.createInterface({ input: process.stdin, output: process.stdout });



let client;

async function run()
{
	const [ host, port ] = (await prompter.question("Enter host and port (e.g. pop.yandex.com:995): ")).split(":");
	const tlsEnabled = await prompter.question("Enable TLS/SSL? (y/n) ") === "y";

	client = new POP3Client();

	console.log("connected:", await client.connect(host, port, tlsEnabled));

	const username = await prompter.question("Enter email address: ");
	console.log("user:", await client.user(username));

	const password = await prompter.question("Enter password: ");
	console.log("pass:", await client.pass(password));

	console.log("Statistics:", await client.stats());

	console.log("Listing 1:", await client.listing(1)); 

	console.log("All listings:", await client.listing());

	console.log("Email 1:", await client.retrieve(1));

	console.log("closed connection:", await client.quit());
}

run()
.catch(console.log)
.finally(() =>
{
	client.close();
	prompter.close();
});