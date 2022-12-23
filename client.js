const NET = require("net");
const TLS = require("tls");
const MessageReader = require("./message-reader");



// обработчик сообщений
class MessageHandler
{
	constructor(socket, reader)
	{
		this.handlerQueue = [];

		socket.on("error", this._handleError.bind(this));
		socket.on("close", () => this._handleError("Socket closed"));
		reader.on("message", this._handleLine.bind(this));
	}

	// получает массив строк ответа и извлекает из них статус код (OK или ERR) и кладет в простой объект
	_parseMessage(data)
	{
		return {
			ok: data[0].startsWith("+"),
			info: [ data[0].split(" ").slice(1).join(" "), ...data.slice(1) ].join("\r\n")
		};
	}

	// каждый раз когда прихожит строка
	_handleLine(line)
	{
		const handler = this.handlerQueue[0];

		if(!handler)
		{
			console.log("Received message with no respective handler:", line);
			return;
		}

		// если она состоит .. то удаляем одну точку - .
		handler.data.push(line === ".." ? "." : line);

		// если прошлая команда ожидает многострочный ответ, то накапливаем строчки пока не придет .
		if(handler.multiline)
		{
			if(line !== ".")
			{
				return;
			}

			handler.data.pop();
		}

		// передаем ответ ожидающей функции
		this.handlerQueue.shift();
		handler.resolve(this._parseMessage(handler.data));
	}

	_handleError(error)
	{
		this.handlerQueue.splice(0).forEach(handler => handler.reject(error));
	}

	onNext(resolve, reject, multiline = false)
	{
		this.handlerQueue.push({ resolve, reject, multiline, data: [] });
	}
}



module.exports = class POP3Client
{
	connect(host, port, tlsEnabled = true)
	{
		return new Promise((resolve, reject) =>
		{
			// иницилизируем клиент, создаем сокет, парсер потока, и прикрепляем парсер к сокету
			const reader = new MessageReader();
			this.socket = (tlsEnabled ? TLS : NET).connect({ port, host, servername: host });
			this.socket.on("data", reader.pipe.bind(reader));

			// также создаем обработчик сообщений и прикрепляем его к парсеру
			this.handler = new MessageHandler(this.socket, reader);
			this.handler.onNext(resolve, reject);
		});
	}

	// отправляем команду и ждем ответа - либо однострочный, либо многострочный
	_send(args, multilineResponse)
	{
		return new Promise((resolve, reject) =>
		{
			if(this.socket.destroyed)
			{
				return reject("Socket closed");
			}

			this.socket.write(args.join(" ") + "\r\n");
			this.handler.onNext(resolve, reject, multilineResponse);
		});
	}

	_sendSingle(...args)
	{
		return this._send(args, false);
	}

	_sendMulti(...args)
	{
		return this._send(args, true);
	}

	/*
	Далее следуют функции для отдельных команд для простоты
	*/

	user(username)
	{
		return this._sendSingle("USER", username);
	}

	pass(password)
	{
		return this._sendSingle("PASS", password);
	}

	stats()
	{
		return this._sendSingle("STAT");
	}

	listing(index)
	{
		if(index)
		{
			return this._sendSingle("LIST", index);
		}
	
		return this._sendMulti("LIST");
	}

	retrieve(index)
	{
		return this._sendMulti("RETR", index);
	}

	delete(index)
	{
		return this._sendSingle("DELE", index);
	}

	quit()
	{
		return this._sendSingle("QUIT");
	}

	close()
	{
		if(this.socket)
		{
			this.socket.destroy();
		}
	}
}