import { Pixel } from 'common/pixel';
import * as fs from 'fs';
import Jimp, { read } from 'jimp';
import { Service } from 'typedi';

@Service()
export class AssetService {
    private readonly dataPath;

    constructor() {
        this.dataPath = process.cwd() + '/assets/games/data/';
    }

    /**
     * Asynchronously get game's differences by it's title in the server assets.
     * If no differences are found, the function returns undefined.
     *
     * @param title the game title
     * @returns Promise<Pixel[][] | undefined>
     */
    async getGameDifferences(title: string): Promise<Pixel[][] | undefined> {
        const dataPath = this.dataPath + title + '/diffs.json';
        return new Promise<Pixel[][]>((resolve) => {
            fs.readFile(dataPath, 'utf8', (error: NodeJS.ErrnoException | null, data: string) => {
                resolve(error ? undefined : JSON.parse(data));
            });
        });
    }

    /**
     * Asynchronously delete the data of a game in the server assets. If the game's data no longer
     * exists, nothing will be deleted.
     *
     * @param title the game title
     */
    async deleteGameData(title: string) {
        return fs.promises.rm(this.dataPath + title, { recursive: true });
    }

    /**
     * Add the data for a game in the server assets. This method should not be called if a game with the
     * same title already exists in the server assets, because it will override the old data.
     *
     * @param title
     * @param images
     * @param differences
     */
    async addGameData(title: string, images: { image1: string; image2: string }, differences: Pixel[][]) {
        const path: string = this.dataPath + title + '/';
        await fs.promises.mkdir(path, { recursive: true });
        await fs.promises.writeFile(path + 'diffs.json', JSON.stringify(differences));
        await this.writeImage(images.image1, path + '1.bmp');
        await this.writeImage(images.image2, path + '2.bmp');
    }

    /**
     * Checks if the data of a game exists by searching for any occurrence of it's title.
     *
     * @param title
     * @returns Promise<boolean>
     */
    async dataExists(title: string) {
        return new Promise<boolean>((resolve, reject) => {
            fs.readdir(this.dataPath, (error: NodeJS.ErrnoException | null, files: string[]) => {
                if (error) reject(error);
                else resolve(files.includes(title));
            });
        });
    }

    /**
     * Asynchronously write an image in bmp format at the specified path.
     *
     * @param image
     * @param path
     */
    private async writeImage(image: string, path: string): Promise<Jimp | Error> {
        const buffer: Buffer = Buffer.from(image.replace('data:image/png;base64,', ''), 'base64');
        return new Promise<Jimp | Error>((resolve, reject) => {
            read(buffer, (error, img) => {
                if (error) reject(error);
                else resolve(img.write(path));
            });
        });
    }
}
