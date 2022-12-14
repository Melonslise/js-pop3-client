const EventEmitter = require("events");

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

	pipe(dataChunk)
	{
		this._accumulatedData = Buffer.concat([ this._accumulatedData, dataChunk ]);
		this._read();
	}
}