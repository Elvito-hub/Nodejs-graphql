import { Upload } from '@aws-sdk/lib-storage';
import AWS_S3, { GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import internal, { Stream } from 'stream';
import crypto from 'crypto';
import { promisify } from 'util';
const randomBytes = promisify(crypto.randomBytes);

dotenv.config();
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY || 'AKIA5UQTACAKXRCWSHMG';
const secretAccessKey = process.env.AWS_SECRET_KEY || 'okok';

const s3 = new S3({
    region,
    credentials:{
        accessKeyId,
        secretAccessKey,
    },
    // region,
    // accessKeyId,
    // secretAccessKey,
    // signatureVersion: 'v4',
});

export async function uploadContestAudioMedia(imgName: string, audioPassthrough: internal.PassThrough){
    if (bucketName) {
        const uploadParams: AWS_S3.PutObjectCommandInput = {
            Bucket: bucketName,
            Body: audioPassthrough,
            Key: imgName,
        };

        return await new Upload({
            client: s3,
            params: uploadParams,
        }).done();
    }
}

export async function generateUploadURL() {
    const rawBytes = await randomBytes(16);
    const imageName = rawBytes.toString('hex');
    const params = {
        Bucket: bucketName,
        Key: imageName,
        Expires: 60,
    };
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: imageName,
    });

    return await getSignedUrl(s3, command, { expiresIn: 3600 });
}
