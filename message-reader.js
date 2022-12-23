const EventEmitter = require("events");

// парсер потока данных от сервера
module.exports = class MessageReader extends EventEmitter
{
	constructor(delimiter = "\r\n")
	{
		super();
		this._delimiter = Buffer.from(delimiter);

		this._accumulatedData = Buffer.alloc(0);
	}

	_read()
	{
		const delimiterIndex = this._accumulatedData.indexOf(this._delimiter);

		if (delimiterIndex >= 0)
		{
			let msgData = this._accumulatedData.subarray(0, delimiterIndex);
			this.emit("message", msgData.toString());

			this._accumulatedData = this._accumulatedData.subarray(delimiterIndex + this._delimiter.length);
			this._read();
		}
	}

	// принимает кусочки данных от сервера
	pipe(dataChunk)
	{
		// накапливает их
		this._accumulatedData = Buffer.concat([ this._accumulatedData, dataChunk ]);
		// ищет и достает из буфера строчки
		this._read();
	}
}