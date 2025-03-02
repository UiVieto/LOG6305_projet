export const enum ImageConstants {
    DefaultWidth = 640,
    DefaultHeight = 480,
    RgbaComponentsPerPixel = 4,
    RgbaTolerance = 30,
    NbDifferencesMin = 3,
    NbDifferencesMax = 9,
    DifficultyPercentage = 0.15,
    NbDifferencesHardDifficulty = 7,
    BitDepthOffset = 28,
    BitDepth24 = 24,
    BmpFormat0 = 66,
    BmpFormat1 = 77,
}

export const QUADRANT_SIZES = [
    // The number 4 is only needed to divide the width and length of the image, sp we allow it in a constants file directly
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    { width: ImageConstants.DefaultWidth / 4, height: ImageConstants.DefaultHeight / 4 },
    { width: ImageConstants.DefaultWidth / 2, height: ImageConstants.DefaultHeight / 2 },
];

export enum GameFeedbackConstants {
    NbFlickers = 10,
    CheatFlickerDelay = 125,
    FlickerDelay = 50,
    FlickerAnimationFactor = 0.25,
}

export const enum SliderConstants {
    Value0 = 0,
    Value1 = 3,
    Value2 = 9,
    Value3 = 15,
    Step0 = 0,
    Step1 = 1,
    Step2 = 2,
    Step3 = 3,
}

export const enum HTTPConstants {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    NotFound = 404,
}

export const enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

export const enum DrawConstants {
    DefaultColor = 'black',
    DefaultWidth = 10,
    NegativeStep = -1,
    EraseSteps = 4,
}

export const enum ResizingConstants {
    MinHeight = 775,
    MaxWidth = 1410,
}

export const enum ChatColor {
    Server = '#FFFFFF',
    Sent = '#F0F81E',
    Received = '#50FEAE',
    BestTime = '#50E9FE',
}

export const enum Time {
    MinToMs = 60000,
    SecToMs = 1000,
    Delay = 100,
    MinToSec = 60,
}

export const enum TestingValues {
    ServerTimeMock = 125,
    ServerTimeMockFormatted = '02:05',
    LowLimitTest1 = 5,
    LowLimitTest2 = 40,
    HighLimitTest = 50,
    FlickerSpeed = 0.5,
    CheatingSpeed = 1.25,
    SuccessToValidateTimeout = 2000,
}

export const enum SettingsConsts {
    MinIncrement = 0,
    MaxIncrement = 30,
    MaxCountdown = 120,
    MinCountdown = 30,
    DefaultIncrement = 5,
    DefaultCountDown = 30,
    ValidateTimeout = 1500,
}

export const enum Base {
    Ten = 10,
}

export const enum InputSettings {
    MaxUsernameLength = 15,
}

export const enum PlaybackConstants {
    RefreshSpeed = 100,
    MsInSec = 1000,
}
