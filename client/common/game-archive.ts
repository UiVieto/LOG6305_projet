import { GameType } from './game-instance';

export interface GameArchive {
    gameTitle: string; // game title or empty if mode 'Temps Limité'
    startDate: number; // starting time in ms of the game
    playingTime: number; // duration of the game
    endClock: number; // clock at the end of the game for best time / win 'Temps Limité'
    gameMode: GameType; // 'Classique' or 'Temps Limité'
    p1Name: string; // P1 name
    p2Name: string; // empty string if solo or P2 name
    isPlayer1: boolean; // true for p1, false for p2
    hasAbandoned: boolean; // if the reference player has abandoned
}
