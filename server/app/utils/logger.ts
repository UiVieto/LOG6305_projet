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
}
