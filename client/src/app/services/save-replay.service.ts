import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SaveReplayService {
    private playbackMap: Map<number, { eventType: string; eventData: unknown }>;

    /**
     * Constructor of the SaveReplayService class.
     * Creates a new Map to store the game events and adds the first event to the map (time = 0).
     */
    constructor() {
        this.playbackMap = new Map<number, { eventType: string; eventData: unknown }>();
        this.playbackMap.set(0, { eventType: 'time', eventData: 0 });
    }

    /**
     * Getter for the playbackMap to allow the playback service to access its data.
     *
     * @returns the playbackMap
     */
    get playback(): Map<number, { eventType: string; eventData: unknown }> {
        return this.playbackMap;
    }

    /**
     * Saves an event to the playbackMap.
     * If the timestamp is already taken, the timestamp is incremented by 1 and the function is called again.
     * This is done to ensure that no two events have the same timestamp.
     * Otherwise, since maps are ordered by their keys, the playback would miss some events.
     *
     * @param timestamp the timestamp of the event
     * @param eventType the type of the event
     * @param eventData the data of the event, which varies depending on the event type
     */
    saveAction(timestamp: number, eventType: string, eventData: unknown): void {
        if (this.playbackMap.has(timestamp)) {
            this.saveAction(timestamp + 1, eventType, eventData);
        } else {
            this.playbackMap.set(timestamp, { eventType, eventData });
        }
    }
}
