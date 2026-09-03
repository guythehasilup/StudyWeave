# SwWAI.contract

`SwWAI.contract` is the shared boundary between the StudyWeave API and `weaveworker`.
It owns versioned question-message schemas, public question DTOs, RabbitMQ topology, and the
generic RabbitMQ transport used by both processes.

The package deliberately does not contain Express controllers, MongoDB documents, or OpenAI
SDK types. Those details remain owned by the process that uses them.

## Delivery behavior

- Business queues and exchanges are durable.
- Publishers use persistent messages and publisher confirms.
- Consumers acknowledge only after their handler completes.
- Invalid or failed deliveries are dead-lettered instead of being immediately requeued.
- Contracts are runtime-validated with Zod at every consumer boundary.

Question input is represented as content parts. The POC supports the `text` part; a future image
part can be added to the discriminated union without replacing the surrounding message format.
