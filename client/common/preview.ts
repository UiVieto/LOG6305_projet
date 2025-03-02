export interface PreviewWithoutImage1 {
    title: string;
    bestTimes: {
        solo: { playerName: string; time: number }[];
        versus: { playerName: string; time: number }[];
    };
    isHard: boolean;
    isInitiallyVsActive: boolean;
}

export interface PageDetails {
    games: PreviewWithoutImage1[];
    isLastPage: boolean;
    pageIndex: number;
}
