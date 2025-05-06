import { createWriteStream, WriteStream } from 'fs';

export class Logger {
    private readonly fileWriter: WriteStream;

    constructor(path: string) {
        this.fileWriter = createWriteStream(path);
    }

    log(msg: any): void {
        this.fileWriter.write(String(msg));
        this.fileWriter.write('\n');
    }

    logArray(msgArray: any[]) {
        let messageToWrite = '[\n';

        for (const msg of msgArray) {
            if (typeof msg === typeof {}) {
                messageToWrite += '{\n';
                for (const attribute in msg) {
                    messageToWrite += `${attribute}: ${String(msg[attribute])}\n`;
                }
                messageToWrite += '}\n';
            } else {
                messageToWrite += `${String(msg)}\n`;
            }
        }

        messageToWrite += ']';

        this.fileWriter.write(String(messageToWrite));
        this.fileWriter.write('\n');
    }
}
