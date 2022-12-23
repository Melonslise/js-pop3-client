const FS = require("fs");
const POP3Client = require("./client");
const Config = require("./config.json");



// получает объект ответа от сервера. Если не ок, то выбрасывает ошибку. Иначе возращает остальную информацию из ответа
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

	// соединение
	handle(await client.connect(Config.host, Config.port, Config.tls));
	// логин
	handle(await client.user(Config.username));
	// пароль
	handle(await client.pass(Config.password));
	// читаем письмо
	const data = handle(await client.retrieve(Config.emailNumber));
	// перезаписываем файл на диске
	FS.writeFileSync(Config.emailFilePath, data.substring(data.indexOf("\r\n") + 2));
	// удаляем с сервера
	handle(await client.delete(Config.emailNumber));
	// выходим
	handle(await client.quit());

	console.log("Email retrieved and deleted!");
}

run().catch(error => console.log("Error:", error)).finally(client.close.bind(client));