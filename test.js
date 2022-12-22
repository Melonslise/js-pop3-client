const FS = require("fs");
const POP3Client = require("./client");
const Config = require("./config.json");



function handle(response)
{
	if(!response.ok)
	{
		throw response.info;
	}

	return response.info;
}

let client;

async function run()
{
	client = new POP3Client();

	handle(await client.connect(Config.host, Config.port, Config.tls));
	handle(await client.user(Config.username));
	handle(await client.pass(Config.password));
	const data = handle(await client.retrieve(Config.emailNumber));
	FS.writeFileSync(Config.emailFilePath, data.substring(data.indexOf("\r\n") + 2));
	handle(await client.delete(Config.emailNumber));
	handle(await client.quit());

	console.log("Email retrieved and deleted!");
}

run().catch(error => console.log("Error:", error)).finally(client.close.bind(client));