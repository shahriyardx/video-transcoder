import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs"
import { randomUUID } from "crypto";
import { produce } from "./rmq/producer";
import path from "path";


const client = new S3Client({
    region: "us-east-1",
    endpoint: 'http://localhost:9090',
    forcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
})

const upload = async () => {
    const filePath = path.join(__dirname, "assets", "video.mp4")
    const fileStream = readFileSync(filePath)
    const Key = randomUUID() + ".mp4"
    const command = new PutObjectCommand({
        Bucket: "temp",
        Key: Key,
        Body: fileStream,
        ContentType: 'video/mp4',
    })
    await client.send(command)
    produce(JSON.stringify({ key: Key }), "upload_queue", "upload_exchange", "file.uploaded")
}

upload()