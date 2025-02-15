import amqp from "amqplib";

export const produce = async (
	message: string,
	queue: string,
	exchange: string,
	routing_key: string,
) => {
	const connection = await amqp.connect("amqp://localhost:5672");
	const channel = await connection.createChannel();

	await channel.assertExchange(exchange, "direct", { durable: false });
	await channel.assertQueue(queue, { durable: false });
	await channel.bindQueue(queue, exchange, routing_key);

	const published = channel.publish(
		exchange,
		routing_key,
		Buffer.from(message),
	);

	console.log(
		`[x] Message sent with data: ${message} on routing key '${routing_key}' Publish status ${published}`,
	);

	setTimeout(async () => {
		await connection.close();
	}, 500);
};
