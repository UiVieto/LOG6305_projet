import { GameSettings } from 'common/settings';

export const SECONDS_TO_MILLISECONDS = 1000;
export const TENTH_OF_SECOND = 0.1;
export const MAX_TIME = 120;
export const NB_SHEETS_PER_PAGE = 4;
export const LOCAL_HOST_PORT = 3000;
export const NOT_TOP_THREE = -1;
export const GAME_CONSTANTS = { initialTime: 30, penaltyTime: 5, bonusTime: 5 } as GameSettings;

export const BEST_TIME_PLACEHOLDER = {
    solo: [
        { playerName: 'Matteo', time: 100 },
        { playerName: 'Gabriel', time: 200 },
        { playerName: 'Edouard', time: 300 },
    ],
    versus: [
        { playerName: 'Matteo', time: 100 },
        { playerName: 'Gabriel', time: 200 },
        { playerName: 'Edouard', time: 300 },
    ],
};

export enum DatabaseConstants {
    Database = 'projet',
    GameCollection = 'games',
    GameHistory = 'gameHistory',
    DatabaseUrl = "mongodb+srv://hv:gadl-6dbz@cluster0.5m5e9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
}
