import amqp from "amqplib"
import Dockerode from "dockerode"

const docker = new Dockerode({
	host: "127.0.0.1",
	port: 2375,
	protocol: "http",
})

const startContainer = async (key: string): Promise<{ statusCode: number }> => {
	const container = await docker.createContainer({
		Image: "transcoder",
		HostConfig: {
			NetworkMode: "vt",
		},
		Tty: true,
		Env: [
			"S3_REGION=us-east-1",
			"S3_ENDPOINT=http://s3mock:9090",
			"S3_ACCESS_KEY_ID=test",
			"S3_ACCESS_SECRET=test",
			`KEY=${key}`,
			"TEMP_BUCKET=temp",
			"PROD_BUCKET=prod",
		],
	})

	await container.start()
	console.log("[x] Container started")

	return await container.wait()
}

export const consumeMessages = async (
	queue: string,
	exchange: string,
	routing_key: string,
) => {
	const connection = await amqp.connect("amqp://localhost:5672")
	const channel = await connection.createChannel()
	await channel.assertQueue(queue, { durable: false })

	console.log(
		`[*] Waiting for messages (Exchange: ${exchange}, Routing Key: ${routing_key})`,
	)

	channel.consume(
		queue,
		async (msg) => {
			if (msg) {
				console.log(`[x] Received ${msg.content}`)
				const data = JSON.parse(msg.content.toString()) as { key: string }

				try {
					const res = await startContainer(data.key)
					if (res.statusCode === 0) {
						channel.ack(msg)
					} else {
						channel.nack(msg)
					}
				} catch (err) {}
			}
		},
		{ noAck: false },
	)
}

// Usage
consumeMessages("upload_queue", "upload_exchange", "file.uploaded").catch(
	console.error,
)
