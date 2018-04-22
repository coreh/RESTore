import RESTore from '@coreh/restore';
import uuid from 'uuid/v4';

import latency from './latency';
import { SAMPLE_MESSAGE_PATHS, SAMPLE_MESSAGES } from './sample-messages';

const store = new RESTore();

store.use('/messages', async function* ({ method, body, path }, next) {
    switch (method) {
        case 'GET':
            await latency();
            return yield SAMPLE_MESSAGE_PATHS;

        case 'POST': {
            const existingMessagePaths = await this.get(path);
            const messagePath = `/messages/${uuid()}`;

            // Yield the message object at the generated path
            // Marking it as 'sending'
            yield {
                [RESTore.Path]: messagePath,
                ...body,
                state: 'sending',
            };

            // Yield a new message list with the newly generated
            // message path included
            yield [
                ...existingMessagePaths,
                messagePath,
            ];

            // Simulate network latency
            await latency();

            // Yield the message object at the generated path again,
            // This time marked as 'sent'
            return yield {
                [RESTore.Path]: messagePath,
                ...body,
                state: 'sent',
            };
        }

        default:
            return yield next();
    }
});

store.use('/messages/:id', async function ({ method, path }, next) {
    switch (method) {
        case 'GET': {
            // Lookup message in built-in sample messages
            const sampleMessage = SAMPLE_MESSAGES[path];

            // With latency to simulate a network request
            await latency();

            // If it exists, return it
            if (sampleMessage) {
                return sampleMessage;
            }

            // Otherwise delegate to the next handler in the chain
            return next();
        }

        default:
            return next();
    }
});

export default store;
