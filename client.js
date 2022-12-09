const TLS = require("tls");
const MessageReader = require("./message-reader");

/*
const states = [ "AUTHORIZATION", "TRANSACTION", "UPDATE" ];

let state = states[0];
*/

const CRLF = "\r\n";



module.exports = class POP3Client
{
	connect(host, port)
	{
		return new Promise(resolve =>
		{
			this.reader = new MessageReader();
			this.reader.once("message", resolve);
			//this.reader.on("message", console.log);

			this.socket = TLS.connect({ port, host, servername: host });
			//this.socket.on("connect", () => console.log("connected to", socket.remoteAddress + ":" + socket.remotePort));
			this.socket.on("data", this.reader.pipe.bind(this.reader));
			//this.socket.on("error", console.log);
			//this.socket.on("close", () => console.log("connection closed"));
		});
	}

	_send(cmd)
	{
		return new Promise(resolve =>
		{
			this.socket.write(cmd + CRLF);

			this.reader.once("message", resolve);
		});
	}

	quit()
	{
		return this._send("QUIT");
	}
}