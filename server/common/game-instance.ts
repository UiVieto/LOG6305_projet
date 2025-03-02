export const enum GameType {
    Classic = 'Classique',
    LimitedTime = 'Temps Limité',
}
export interface GameInstance {
    title: string;
    isHard: boolean;
    nbDiff: number;
    players: string[];
    gameMode: GameType;
    hintPenalty: number;
}
