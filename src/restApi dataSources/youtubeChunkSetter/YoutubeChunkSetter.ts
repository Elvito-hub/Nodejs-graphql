import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { Stream } from 'stream';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';
import { uploadContestAudioMedia } from '../../middleware/contestMediaS3';
import { ProgressCallbackInfo } from './youtubeChunkSetter.types';
const randomBytes = promisify(crypto.randomBytes);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

function secondsToTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.000`;
}

export const YoutubeChunkSetter=async(youtubeUrl: any, start: any, end: any)=>{
    try {
        ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');

        const duration = end-start;
        console.log('ok ok');
        const stream = ytdl(youtubeUrl, {
            quality: 'highestaudio',
        });
        const startTime = Date.now();
        const passthroughStream = new Stream.PassThrough();

        console.log(passthroughStream);
        const startSecond = secondsToTime(start);
        ffmpeg(stream)
            .format('mp3')
            .seekInput(startSecond)
            .duration(duration)
            .audioBitrate(128)
            .output(passthroughStream, { end: true })
            .on('error', function(err: any, stdout: any, stderr: any) {
                console.log(err.message);
            })
            .on('progress', function(info: ProgressCallbackInfo) {
                console.log(info);
                console.log('progress ' + info.percent + '%');
            })
        // .save(`${__dirname}/${url}.mp3`)
            .on('end', () => {
                console.log(`\ndone, thanks - ${(Date.now() - startTime) / 1000}s`);
            })
            .run();
        // const rawBytes = await randomBytes(16);
        // const imageName = rawBytes.toString('hex');
        // TODO encrypt the youtubeurl
        await uploadContestAudioMedia(youtubeUrl, passthroughStream)
        return `https://bwengearticles.s3.us-west-1.amazonaws.com/${youtubeUrl}`;
    } catch (error) {
        return error;
    }
};
