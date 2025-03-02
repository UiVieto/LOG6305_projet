import { Game } from '@app/classes/game';
import { GameClassic } from '@app/classes/game-classic';
import { GameLimitedTime } from '@app/classes/game-limited-time';
import { BEST_TIME_PLACEHOLDER, GAME_CONSTANTS } from '@app/constants/constants';
import { DatabaseGame } from '@app/interfaces/database-game';
import { Player } from '@app/interfaces/player';
import { Server } from '@app/server';
import { Pixel } from 'common/pixel';
import { PlayingUser } from 'common/playing-user';
import { GameSettings } from 'common/settings';
import * as http from 'http';
import * as io from 'socket.io';
import { Service } from 'typedi';
import { DataService } from './data.service';

@Service()
export class GameManagerService {
    private static instance: GameManagerService;
    private waitingRooms: { gameTitle: string; users: Player[] }[];
    private limitedTimeWaitingRoom: Player[];
    private activeGames: Game[];
    private usersRoom: Map<string, string>;
    private gameConstants: GameSettings;
    private sio: io.Server;

    private constructor(server: http.Server) {
        this.sio = new io.Server(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });

        this.waitingRooms = [];
        this.activeGames = [];
        this.limitedTimeWaitingRoom = [];
        this.usersRoom = new Map();
        this.gameConstants = GAME_CONSTANTS;
    }

    private get dataService(): Promise<DataService> {
        return DataService.getInstance();
    }

    static getInstance(): GameManagerService {
        if (!GameManagerService.instance) GameManagerService.instance = new GameManagerService(Server.server);
        return GameManagerService.instance;
    }

    isActiveTitle(title: string) {
        return this.waitingRooms.some((room) => room.gameTitle === title);
    }

    /**
     * Handle all the socket events
     */
    handleSockets(): void {
        this.sio.on('connection', async (socket: io.Socket) => {
            this.sio.emit('initSettings', this.gameConstants);
            socket.on('startGameVs', async (player: PlayingUser) => {
                if (!(await (await this.dataService).titleExists(player.gameTitle))) {
                    socket.emit('kicked');
                    return;
                }
                this.usersRoom.set(socket.id, player.gameTitle);
                const waitingRoom = this.waitingRooms.find((room) => room.gameTitle === player.gameTitle);
                if (!waitingRoom) {
                    this.waitingRooms.push({ gameTitle: player.gameTitle, users: [{ name: player.username, socket: socket.id }] });
                    this.sio.to('selectionRoom').emit(`joinWaitingRoom${player.gameTitle}`);
                } else {
                    waitingRoom.users.push({ name: player.username, socket: socket.id });
                    if (waitingRoom.users.length === 2) this.sio.to(waitingRoom.users[0].socket).emit('playerRequestJoin', player);
                }
            });

            socket.on('refusePlayer2', () => {
                this.refusePlayer(socket.id);
            });

            socket.on('acceptPlayer2', async () => {
                const gameTitle = this.usersRoom.get(socket.id);
                const waitingRoom = this.waitingRooms.find((room) => room.gameTitle === gameTitle); // Checks for waiting room
                const socket2 = (await this.sio.fetchSockets()).find((s) => s.id === waitingRoom?.users[1]?.socket); // Checks for player 2 socket
                const gameInfo = waitingRoom && (await (await this.dataService).getGame(waitingRoom.gameTitle)); // Checks for game in database

                // Notifies host if previous checks fail
                if (!socket2 || !gameInfo) {
                    socket.emit('kicked');
                    if (socket2) socket2.emit('kicked');
                    this.waitingRooms = this.waitingRooms.filter((room) => room !== waitingRoom);
                    return;
                }

                // Creates game for players
                const players = waitingRoom.users.splice(0, 2);
                const game = new GameClassic(gameInfo, players, this.gameConstants.penaltyTime);

                // Transfers players to their game's room
                [socket, socket2].forEach((s) => {
                    s.join(game.room);
                    s.leave('selectionRoom');
                    this.usersRoom.delete(s.id);
                });

                this.sio.to(game.room).emit('gameTimeUpdated', 0);
                this.sio.to(game.room).emit('gameCreated', game.data); // Notifies players to navigate to their game
                this.activeGames.push(game); // Tracks the game as ongoing
                this.queueNextPlayers(waitingRoom); // Queues next players in the waiting room
            });

            socket.on('cancelWaitingRoom', () => {
                const gameTitle = this.usersRoom.get(socket.id);
                this.usersRoom.delete(socket.id);
                const waitingRoom = this.waitingRooms.find((room) => room.gameTitle === gameTitle);
                if (waitingRoom) {
                    waitingRoom.users = waitingRoom.users.filter((user) => user.socket !== socket.id);
                    this.queueNextPlayers(waitingRoom);
                } else this.limitedTimeWaitingRoom = this.limitedTimeWaitingRoom.filter((player) => player.socket !== socket.id);
            });

            socket.on('sendClick', async (p: Pixel) => {
                await this.activeGames.find((game) => game.isPlayerInGame(socket.id))?.checkClick(p, socket.id);
            });

            socket.on('useClue', () => {
                this.activeGames.find((game) => game.isPlayerInGame(socket.id))?.useClue(socket.id);
            });

            socket.on('abandonGame', () => {
                const affectedGame = this.activeGames.find((g) => g.isPlayerInGame(socket.id));
                if (affectedGame) {
                    socket.leave(affectedGame.room);
                    affectedGame.abandon(socket.id);
                }
            });

            socket.on('joinSelectionRoom', async () => {
                socket.join('selectionRoom');
            });

            socket.on('startGameSolo', async (player: PlayingUser) => {
                const gameInfo = await (await this.dataService).getGame(player.gameTitle);
                if (gameInfo) {
                    const game = new GameClassic(gameInfo, [{ socket: socket.id, name: player.username }], this.gameConstants.penaltyTime);
                    this.activeGames.push(game);
                    socket.join(game.room);
                    this.sio.to(game.room).emit('gameTimeUpdated', 0);
                    socket.emit('gameCreated', game.data);
                } else socket.emit('kicked');
            });

            socket.on('startGameLimitedTimeCoop', async (username: string) => {
                this.limitedTimeWaitingRoom.push({ name: username, socket: socket.id });
                if (this.limitedTimeWaitingRoom.length === 2) {
                    const players = this.limitedTimeWaitingRoom.splice(0, 2);
                    const gameTitles = await (await this.dataService).getGameTitles();
                    const socket1 = (await this.sio.fetchSockets()).find((s) => s.id === players[0].socket);
                    if (!socket1 || gameTitles.length === 0) {
                        socket.emit('kicked');
                        if (socket1) socket1.emit('kicked');
                        return;
                    }

                    const game = new GameLimitedTime(gameTitles, players, this.gameConstants);
                    [socket1, socket].forEach((s) => s.join(game.room));
                    this.startGameLimitedTime(game);
                }
            });

            socket.on('startGameLimitedTimeSolo', async (username: string) => {
                const gameTitles = await (await this.dataService).getGameTitles();

                const game = new GameLimitedTime(gameTitles, [{ name: username, socket: socket.id }], this.gameConstants);
                socket.join(game.room);
                this.startGameLimitedTime(game);
            });

            socket.on('chatMessage', (message: string) => {
                const game = this.activeGames.find((g) => g.isPlayerInGame(socket.id));
                if (game?.isMultiplayer) {
                    game.sendMessage(socket.id, message);
                }
            });

            socket.on('disconnect', () => {
                const affectedGame = this.activeGames.find((game) => game.isPlayerInGame(socket.id));
                if (affectedGame) {
                    socket.leave(affectedGame.room);
                    affectedGame.abandon(socket.id);
                } else {
                    const affectedRoom = this.waitingRooms.find((room) => room.gameTitle === this.usersRoom.get(socket.id));
                    this.usersRoom.delete(socket.id);
                    if (affectedRoom) {
                        affectedRoom.users = affectedRoom.users.filter((user) => user.socket !== socket.id);
                        this.queueNextPlayers(affectedRoom);
                    }
                }
            });

            socket.on('validateUsername', (username: string) => {
                const available = !this.waitingRooms.find((room) => room.users.some((user) => user.name === username));
                socket.emit('usernameValidity', available);
            });

            socket.on('updateSettings', (settings: GameSettings) => {
                this.gameConstants = settings;
                this.sio.emit('settingsChanged', settings);
            });

            socket.on('resetGameBestTimes', async (gameTitle: string) => {
                await (await DataService.getInstance()).resetGameBestTime(gameTitle);
                const game: Partial<DatabaseGame> = {
                    title: gameTitle,
                    bestTimes: BEST_TIME_PLACEHOLDER,
                };
                this.sio.emit('updateBestTime', game);
            });

            socket.on('resetAllBestTimes', async () => {
                (await this.dataService).resetAllBestTimes();
                this.sio.emit('updateAllBestTimes', BEST_TIME_PLACEHOLDER);
            });
        });
    }

    kickPlayers(gameTitle: string) {
        const waitingRoom = this.waitingRooms.find((room) => room.gameTitle === gameTitle);
        if (!waitingRoom) return;
        waitingRoom.users.forEach((user) => this.sio.to(user.socket).emit('kicked'));
        this.waitingRooms = this.waitingRooms.filter((rooms) => rooms.gameTitle !== waitingRoom.gameTitle);
    }

    // this function is used by the games to emit events to rooms
    // payload is any because the different events require different structures of payloads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitTo(event: string, payload?: any, room?: string) {
        if (room) this.sio.to(room).emit(event, payload);
        else this.sio.emit(event, payload);
    }

    async removeGame(game: Game) {
        this.sio.socketsLeave(game.room);
        this.activeGames = this.activeGames.filter((g) => g !== game);
        await (await this.dataService).addGameHistory(game.history);
    }

    private queueNextPlayers(waitingRoom: { gameTitle: string; users: { name: string; socket: string }[] }) {
        if (waitingRoom.users.length !== 0) {
            this.sio.to(waitingRoom.users[0].socket).emit('becameHost');
            if (waitingRoom.users.length > 1)
                this.sio
                    .to(waitingRoom.users[0].socket)
                    .emit('playerRequestJoin', { gameTitle: waitingRoom.gameTitle, username: waitingRoom.users[1].name });
        } else {
            this.waitingRooms = this.waitingRooms.filter((rooms) => rooms.gameTitle !== waitingRoom.gameTitle);
            this.sio.to('selectionRoom').emit(`leaveWaitingRoom${waitingRoom.gameTitle}`);
        }
    }

    private refusePlayer(socketId: string): void {
        const gameTitle = this.usersRoom.get(socketId);
        const waitingRoom = this.waitingRooms.find((room) => room.gameTitle === gameTitle);
        if (waitingRoom && waitingRoom.users.length > 1) {
            const refusedUserSocket = waitingRoom.users.splice(1, 1)[0].socket;
            this.usersRoom.delete(refusedUserSocket);
            this.sio.to(refusedUserSocket).emit('playerRefused');
            if (waitingRoom.users.length > 1)
                this.sio.to(waitingRoom.users[0].socket).emit('playerRequestJoin', { gameTitle, username: waitingRoom.users[1].name });
        }
    }

    private async startGameLimitedTime(game: GameLimitedTime) {
        const gameData = await game.start();
        if (gameData) {
            this.activeGames.push(game);
            this.sio.to(game.room).emit('gameCreated', gameData);
        } else {
            this.sio.to(game.room).emit('kicked');
            this.sio.socketsLeave(game.room);
        }
    }
}
