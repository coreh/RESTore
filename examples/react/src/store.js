import RESTore from '@coreh/restore';
import uuid from 'uuid/v4';

import latency from './latency';
import { SAMPLE_MESSAGE_PATHS, SAMPLE_MESSAGES } from './sample-messages';

const store = new RESTore();

store.use('/messages', async function* (context, next) {
    switch (context.method) {
        case 'GET':
            await latency();
            return yield SAMPLE_MESSAGE_PATHS;
        case 'POST': {
            const path = `/messages/${uuid()}`;
            yield {
                [RESTore.Path]: path,
                ...context.body,
                state: 'sending',
            };
            yield [
                ...await this.get(context.path),
                path,
            ];
            await latency();
            return yield {
                [RESTore.Path]: path,
                ...context.body,
                state: 'sent',
            };
        }
        default:
            return yield next();
    }
});

store.use('/messages/:id', async function (context, next) {
    switch (context.method) {
        case 'GET':
            await latency();
            const sampleMessage = SAMPLE_MESSAGES[context.path];
            if (sampleMessage) {
                return sampleMessage;
            }
        default:
            return next();
    }
    return next();
});

export default store;
