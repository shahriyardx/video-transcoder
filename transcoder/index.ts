import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile } from "fs/promises"
import ffmpeg_installer from "@ffmpeg-installer/ffmpeg"
import ffmpeg from "fluent-ffmpeg"
import path from "node:path"
import fs from "node:fs"

ffmpeg.setFfmpegPath(ffmpeg_installer.path)


const client = new S3Client({
    region: process.env.S3_REGION as string,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_ACCESS_SECRET as string
    }
})


const FILE_KEY = process.env.KEY as string
const ROOT_FOLDER = __dirname

export const downloadFile = async () => {
    const command = new GetObjectCommand({
        Bucket: process.env.TEMP_BUCKET as string,
        Key: FILE_KEY
    })

    const data = await client.send(command)
    const savePath = `${ROOT_FOLDER}/temp/video.mp4`;

    if (data.Body) {
        // @ts-ignore
        await writeFile(savePath, data.Body)
        console.log("File has been downloaded")
        await transcodeVideo(FILE_KEY)
    }
}

const transcodeVideo = async (key: string) => {
    const originalVideo = path.resolve(`${ROOT_FOLDER}/temp/video.mp4`)

    const RESOLUTIONS = [
        { name: "360p", width: 480, height: 360 },
        { name: "480p", width: 854, height: 480 },
        { name: "720p", width: 1280, height: 720 },
        { name: "1080p", width: 1920, height: 1080 },
        { name: "2160p", width: 3840, height: 2160 },
    ]

    const promises = RESOLUTIONS.map(resolution => {
        const outputPath = `${ROOT_FOLDER}/transcoded/video-${resolution.name}.mp4`
        return new Promise((resolve) => {
            ffmpeg(originalVideo)
                .output(outputPath)
                .withVideoCodec("libx264")
                .withAudioCodec("aac")
                .withSize(`${resolution.width}x${resolution.height}`)
                .format('mp4')
                .on('end', () => {
                    console.log(`Transcoded ${resolution.name}`)
                    resolve({path: outputPath, key, resolution: resolution.name})
                })
                .run()
        })
    })

    const files = await Promise.all(promises) as { path: string; resolution: string, key: string }[]

    files.map(async (file) => {
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.PROD_BUCKET,
            Key: `${key}/${file.resolution}.mp4`,
            Body: fs.readFileSync(file.path),
        })

        await client.send(uploadCommand)
    })
}

downloadFile()