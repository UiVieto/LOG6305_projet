import { BEST_TIME_PLACEHOLDER, DatabaseConstants, NB_SHEETS_PER_PAGE, NOT_TOP_THREE } from '@app/constants/constants';
import { DatabaseGame } from '@app/interfaces/database-game';
import { GameInfo } from '@app/interfaces/game-info';
import { Game } from 'common/game';
import { GameArchive } from 'common/game-archive';
import { GameType } from 'common/game-instance';
import { PreviewWithoutImage1 } from 'common/preview';
import { Db, DeleteResult, Document, InsertOneResult, MongoClient, UpdateResult } from 'mongodb';
import { Service } from 'typedi';
import { AssetService } from './asset.service';
import { GameManagerService } from './game-manager.service';

@Service()
export class DataService {
    private static instance?: DataService;
    private database: Db;

    private constructor(private assetService: AssetService) {}

    /**
     * Returns a static instance of DataService. If the instance does not exist,
     * one will be created.
     *
     * @returns the instance of DataService
     */
    static async getInstance(): Promise<DataService> {
        if (!DataService.instance) {
            DataService.instance = new DataService(new AssetService());
            await DataService.instance.connectToServer(DatabaseConstants.DatabaseUrl);
        }
        return DataService.instance;
    }

    /**
     * Asynchronously checks if the game title exists in the game data directory and in the mongoDB database.
     *
     * @param title the game title
     * @returns boolean
     */
    async titleExists(title: string): Promise<boolean> {
        return (await this.database.collection(DatabaseConstants.GameCollection).findOne({ title })) ? this.assetService.dataExists(title) : false;
    }

    /**
     * Create asynchronously a game. The game's images and differences are added in the game data directory, and
     * the game's title, bestTimes and isHard values are added in MongoDB database.
     *
     * @param game
     */
    async createGame(game: Game): Promise<void> {
        const { differences, image1, image2, ...gameInfo } = game;
        gameInfo.bestTimes = BEST_TIME_PLACEHOLDER;
        await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).insertOne(gameInfo);
        return this.assetService.addGameData(game.title, { image1, image2 }, differences);
    }

    /**
     * Asynchronously add a game to the games history in the MongoDB database.
     *
     * @param game the game's history
     */
    async addGameHistory(game: GameArchive): Promise<InsertOneResult> {
        await this.updateBestTimes(game);
        GameManagerService.getInstance().emitTo('gameHistoryAdded');
        return this.database.collection<GameArchive>(DatabaseConstants.GameHistory).insertOne(game);
    }

    /**
     * Asynchronously delete all of the game history collection in the mongoDB database.
     *
     * @returns the delete result
     */
    async deleteHistory() {
        GameManagerService.getInstance().emitTo('deleteHistory');
        return this.database.collection<GameArchive>(DatabaseConstants.GameHistory).deleteMany({});
    }

    /**
     * Asynchronously get a game by it's title. Returns undefined if game does not exists.
     *
     * Although there should be no game with the same title in the MongoDB database, when there are many games with the same title,
     * getGame will return the first game that matches the given title, which should be the oldest one.
     *
     * @param title the game title
     * @returns Promise<GameInfo | undefined>
     */
    async getGame(title: string): Promise<GameInfo | undefined> {
        const game: DatabaseGame | null = await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).findOne({ title });
        const gameDifferences = await this.assetService.getGameDifferences(title);
        return game && gameDifferences ? { title: game.title, isHard: game.isHard, differences: gameDifferences } : undefined;
    }

    /**
     * Get all the games asynchronously in the MongoDB database. An empty array will be returned if there are no game in the database.
     *
     * @returns Promise<WithId<DatabaseGame>[]>
     */
    async getGames(): Promise<DatabaseGame[]> {
        return (await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).find({}).toArray()).map((game) => {
            return { title: game.title, bestTimes: game.bestTimes, isHard: game.isHard };
        });
    }

    /**
     * Asynchronously get the best times of the given game title. If there are no matching game in the MongoDB
     * database, undefined is returned.
     *
     * @param title
     * @returns the best times or undefined
     */
    async getBestTimesByGame(title: string): Promise<DatabaseGame['bestTimes'] | undefined> {
        const game: DatabaseGame | null = await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).findOne({ title });
        return game ? game.bestTimes : undefined;
    }

    /**
     * Asynchronously get all of the game history in the mongoDB database.
     *
     * @returns the game history
     */
    async getGameHistory(): Promise<GameArchive[]> {
        return this.database.collection<GameArchive>(DatabaseConstants.GameHistory).find({}).toArray();
    }

    /**
     * Asynchronously get all of the game titles in the MongoDB database.
     *
     * @returns the game titles
     */
    async getGameTitles() {
        return (await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).find({}).project({ title: 1, _id: 0 }).toArray()).map(
            (game) => game.title,
        );
    }

    /**
     * Get games for the game sheets of a page in the selection page based on the page index given.
     * The amount of games can vary from one to four inclusively.
     *
     * @param pageIndex
     * @returns the game sheet page
     */
    async getPageGames(pageIndex: number) {
        const games = await this.getGames();
        const firstGameIndex = Math.min(pageIndex * NB_SHEETS_PER_PAGE, games.length - 1 - ((games.length - 1) % NB_SHEETS_PER_PAGE));
        const lastGameIndex = Math.min(firstGameIndex + NB_SHEETS_PER_PAGE, games.length);
        const detailedGames: PreviewWithoutImage1[] = [];
        games.slice(firstGameIndex, lastGameIndex).forEach((game: DatabaseGame) => {
            detailedGames.push({ ...game, isInitiallyVsActive: GameManagerService.getInstance().isActiveTitle(game.title) });
        });
        return { games: detailedGames, pageIndex: firstGameIndex / NB_SHEETS_PER_PAGE, isLastPage: lastGameIndex === games.length };
    }

    /**
     * Asynchronously update the best times for a game for both the client side and the server side.
     *
     * @param gameArchive
     */
    async updateBestTimes(gameArchive: GameArchive) {
        if (gameArchive.gameMode === GameType.Classic && !gameArchive.hasAbandoned) {
            await this.setBestTimes(
                gameArchive.gameTitle,
                {
                    playerName: gameArchive.isPlayer1 ? gameArchive.p1Name : gameArchive.p2Name,
                    time: gameArchive.endClock,
                },
                gameArchive.p2Name !== '',
            );
        }
    }

    /**
     * Asynchronously reset all best times in the mongoDB database with a placeholder value.
     *
     * @returns the update result
     */
    async resetAllBestTimes(): Promise<UpdateResult | Document> {
        return this.database
            .collection<DatabaseGame>(DatabaseConstants.GameCollection)
            .updateMany({}, { $set: { bestTimes: BEST_TIME_PLACEHOLDER } });
    }

    /**
     * Asynchronously reset a game's best times with a placeholder value.
     * If there are no matching game, nothing will be reset.
     *
     * @param gameTitle
     * @returns the update result
     */
    async resetGameBestTime(title: string) {
        return this.database
            .collection<DatabaseGame>(DatabaseConstants.GameCollection)
            .updateOne({ title }, { $set: { bestTimes: BEST_TIME_PLACEHOLDER } });
    }

    /**
     * Asynchronously delete game in both the MongoDB database and game data directory.
     *
     * @param title the game title
     */
    async deleteGameByTitle(title: string) {
        GameManagerService.getInstance().kickPlayers(title);
        await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).deleteOne({ title });
        return this.assetService.deleteGameData(title);
    }

    /**
     * Delete all games in the MongoDB database and all asset data.
     * Since the deletion of the games data uses the game titles in the mongoDB database,
     * it is possible that not all asset data will be deleted. This is to avoid deleting the test data used
     * in tests.
     *
     * @returns the delete result
     */
    async deleteAllGames(): Promise<DeleteResult> {
        const gameTitles = await this.getGameTitles();
        for (const title of gameTitles) await this.assetService.deleteGameData(title);
        return this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).deleteMany({});
    }

    /**
     * Return the position from the given time. If the given time is not among the top three times,
     * -1 is returned.
     *
     * @returns the position
     */
    async getPositionFromTime(gameTitle: string, time: number, isVersus: boolean): Promise<number> {
        const gameBestTimes = await this.getBestTimesByGame(gameTitle);
        if (gameBestTimes) {
            const bestTimes = isVersus ? gameBestTimes.versus : gameBestTimes.solo;
            const times: number[] = bestTimes.map((bestTime) => bestTime.time);
            let position = 0;

            times.forEach((bestTime) => {
                if (time >= bestTime) position++;
            });

            if (position < 3) return position + 1;
        }
        return NOT_TOP_THREE;
    }

    /**
     * Asynchronously connect to MongoDB database, and initialize the database to be used on completion.
     *
     * @param url the connection url
     */
    private async connectToServer(url: string): Promise<void> {
        return new MongoClient(url).connect().then((client: MongoClient) => {
            this.database = client.db(DatabaseConstants.Database);
        });
    }

    /**
     * Asynchronously set the best times in the MongoDB database, update the new best times
     * for all clients and send a new message to all rooms if the new best time is among the top three.
     *
     * @param gameTitle
     * @param playerName
     * @param time
     * @param isVersus
     */
    private async setBestTimes(gameTitle: string, bestTime: { playerName: string; time: number }, isVersus: boolean) {
        const gameBestTimes = await this.getBestTimesByGame(gameTitle);
        if (gameBestTimes) {
            const bestTimesArray = isVersus ? gameBestTimes.versus : gameBestTimes.solo;
            bestTimesArray.push(bestTime);
            bestTimesArray.sort((a, b) => a.time - b.time);
            bestTimesArray.splice(3);
            const bestTimes = isVersus
                ? { versus: bestTimesArray, solo: gameBestTimes.solo }
                : { versus: gameBestTimes.versus, solo: bestTimesArray };

            const position = await this.getPositionFromTime(gameTitle, bestTime.time, isVersus);
            await this.database.collection<DatabaseGame>(DatabaseConstants.GameCollection).updateOne({ title: gameTitle }, { $set: { bestTimes } });
            await this.sendBestTimeMessage(gameTitle, bestTime.playerName, position, isVersus);
            GameManagerService.getInstance().emitTo('updateBestTime', { title: gameTitle, bestTimes });
        }
    }

    /**
     * Send a message to the all the rooms in the server that a new best time has been achieved.
     * The message contains the game title, the player name, the position of the new best time and if
     * the game played was in 1v1 (versus).
     *
     * @param gameTitle
     * @param playerName
     * @param position
     * @param isVersus
     */
    // Passing all the needed parameters is more simple and makes the call easier to understand than passing a object
    // eslint-disable-next-line max-params
    private async sendBestTimeMessage(gameTitle: string, playerName: string, position: number, isVersus: boolean) {
        const date = new Date().toLocaleTimeString('it-IT');
        const positionString = position + (position === 1 ? 're' : 'e');

        if (position !== NOT_TOP_THREE) {
            const message = `${date} - ${playerName} obtient la ${positionString} place dans les meilleurs temps du jeu ${gameTitle} en ${
                isVersus ? 'multijoueur' : 'solo'
            }`;
            GameManagerService.getInstance().emitTo('newBestTimeMessage', message);
        }
    }
}
