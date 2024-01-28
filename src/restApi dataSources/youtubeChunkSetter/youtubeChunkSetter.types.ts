export interface ProgressCallbackInfo {
    frames: number;
    currentFps: number;
    currentKbps: number;
    targetSize: number;
    timemark: string;
    percent: number;
    totalSize: number;
    bitrate: number;
}
