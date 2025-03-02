export interface DatabaseGame {
    title: string;
    bestTimes: {
        solo: { playerName: string; time: number }[];
        versus: { playerName: string; time: number }[];
    };
    isHard: boolean;
}
