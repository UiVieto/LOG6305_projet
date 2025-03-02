import { DataService } from '@app/services/data.service';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DataController {
    router: Router;

    constructor() {
        this.configureRouter();
    }

    private get dataService() {
        return DataService.getInstance();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/create', async (req, res) => {
            try {
                await (await this.dataService).createGame(req.body);
                res.status(StatusCodes.CREATED).json();
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json(error);
            }
        });

        this.router.get('/create/titleExists', async (req, res) => {
            try {
                const titleExists = await (await this.dataService).titleExists(req.query.title as string);
                res.status(StatusCodes.OK).json(titleExists);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json(error);
            }
        });

        this.router.get('/games', async (req, res) => {
            try {
                const page = await (await this.dataService).getPageGames(Number(req.query.pageIndex as string));
                res.status(StatusCodes.OK).json(page);
            } catch (error) {
                res.status(StatusCodes.NOT_FOUND).json(error);
            }
        });

        this.router.get('/game/file', (req, res) => {
            res.sendFile(process.cwd() + '/assets/games/data/' + req.query.title + '/' + req.query.image + '.bmp');
        });

        this.router.delete('/game', async (req, res) => {
            const title: string = req.query.title as string;
            try {
                await (await this.dataService).deleteGameByTitle(title);
                res.status(StatusCodes.OK).json();
            } catch (error) {
                res.status(StatusCodes.NOT_FOUND).json(error);
            }
        });

        this.router.delete('/games', async (req, res) => {
            try {
                const deleteResult = await (await this.dataService).deleteAllGames();
                if (deleteResult.acknowledged) res.status(StatusCodes.OK).json();
                else res.status(StatusCodes.NOT_FOUND).json();
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json(error);
            }
        });

        this.router.get('/history', async (req, res) => {
            try {
                const history = await (await this.dataService).getGameHistory();
                res.status(StatusCodes.OK).json(history.reverse());
            } catch (error) {
                res.status(StatusCodes.NOT_FOUND).json(error);
            }
        });

        this.router.delete('/history', async (req, res) => {
            try {
                await (await this.dataService).deleteHistory();
                res.status(StatusCodes.OK).json();
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json(error);
            }
        });
    }
}
