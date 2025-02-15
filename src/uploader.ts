import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "node:crypto"
import { produce } from "./rmq/producer"
import { readFileSync } from "node:fs"
import path from "node:path"

const client = new S3Client({
	region: "us-east-1",
	endpoint: "http://localhost:9090",
	forcePathStyle: true,
	credentials: {
		accessKeyId: "test",
		secretAccessKey: "test",
	},
})

const upload = async () => {
	const filePath = path.join(__dirname, "assets", "video.mp4")
	const fileStream = readFileSync(filePath)
	const Key = randomUUID()
	const command = new PutObjectCommand({
		Bucket: "temp",
		Key: Key,
		Body: fileStream,
		ContentType: "video/mp4",
	})
	await client.send(command)
	produce(
		JSON.stringify({ key: Key }),
		"upload_queue",
		"upload_exchange",
		"file.uploaded",
	)
}

upload()
