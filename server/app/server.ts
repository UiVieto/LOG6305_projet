import { Application } from '@app/app';
import { LOCAL_HOST_PORT } from '@app/constants/constants';
import { GameManagerService } from '@app/services/game-manager.service';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { DataController } from './controllers/data.controller';

@Service()
export class Server {
    static server: http.Server;
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseDix: number = 10;
    private application: Application;

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    init(): void {
        this.application = new Application(new DataController());

        this.application.app.set('port', Server.appPort);

        Server.server = http.createServer(this.application.app);

        const gameManager = GameManagerService.getInstance();
        gameManager.handleSockets();

        Server.server.listen(LOCAL_HOST_PORT);
        Server.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        Server.server.on('listening', () => this.onListening());
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = Server.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
