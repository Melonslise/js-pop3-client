const NET = require("net");
const TLS = require("tls");
const MessageReader = require("./message-reader");



class MessageHandler
{
	constructor(socket, reader)
	{
		this.handlerQueue = [];

		socket.on("error", this._handleError.bind(this));
		socket.on("close", () => this._handleError("Socket closed"));
		reader.on("message", this._handleLine.bind(this));
	}

	_parseMessage(data)
	{
		return {
			ok: data[0].startsWith("+"),
			info: [ data[0].split(" ").slice(1).join(" "), ...data.slice(1) ].join("\r\n")
		};
	}

	_handleLine(line)
	{
		const handler = this.handlerQueue[0];

		if(!handler)
		{
			console.log("Received message with no respective handler:", line);
			return;
		}

		handler.data.push(line);

		if(handler.multiline && line !== ".")
		{
			return;
		}

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
			const reader = new MessageReader();
			this.socket = (tlsEnabled ? TLS : NET).connect({ port, host, servername: host });
			this.socket.on("data", reader.pipe.bind(reader));

			this.handler = new MessageHandler(this.socket, reader);
			this.handler.onNext(resolve, reject);
		});
	}

	_send(cmd, multilineResponse = false)
	{
		return new Promise((resolve, reject) =>
		{
			if(this.socket.destroyed)
			{
				return reject("Socket closed");
			}

			this.socket.write(cmd + "\r\n");
			this.handler.onNext(resolve, reject, multilineResponse);
		});
	}

	user(username)
	{
		return this._send("USER " + username);
	}

	pass(password)
	{
		return this._send("PASS " + password);
	}

	stats()
	{
		return this._send("STAT");
	}

	listing(index)
	{
		if(index)
		{
			return this._send("LIST " + index);
		}
	
		return this._send("LIST", true);
	}

	retrieve(index)
	{
		return this._send("RETR " + index, true);
	}

	quit()
	{
		return this._send("QUIT");
	}

	close()
	{
		if(this.socket)
		{
			this.socket.destroy();
		}
	}
}