const POP3Client = require("./client");

const ReadLine = require("readline");



const prompter = ReadLine.createInterface({ input: process.stdin, output: process.stdout });

function ask(query)
{
	return new Promise(resolve => prompter.question(query, resolve));
}

function delay(time)
{
	return new Promise(resolve => setTimeout(resolve, time));
}



async function run()
{
	const [ host, port ] = (await ask("Enter host and port (e.g. pop.gmail.com:995): ")).split(":");

	const client = new POP3Client();

	console.log("connected: ", await client.connect(host, port));

	await delay(5000);

	console.log("closed connection: ", await client.quit());

	prompter.close();
}

run();