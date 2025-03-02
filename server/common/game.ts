import { Pixel } from './pixel';

export interface Game {
    title: string;
    image1: string;
    image2: string;
    differences: Pixel[][];
    bestTimes: {
        solo: { playerName: string; time: number }[];
        versus: { playerName: string; time: number }[];
    };
    isHard: boolean;
}
