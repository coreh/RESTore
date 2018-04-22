import uuid from 'uuid/v4';

export const SAMPLE_MESSAGE_PATHS = [
    `/messages/${uuid()}`,
    `/messages/${uuid()}`,
    `/messages/${uuid()}`,
    `/messages/${uuid()}`,
    `/messages/${uuid()}`,
]

export const SAMPLE_MESSAGES = {
    [SAMPLE_MESSAGE_PATHS[0]]: {
        message: 'What\'s this?',
        state: 'sent',
    },
    [SAMPLE_MESSAGE_PATHS[1]]: {
        message: 'This example showcases how to use RESTore with React 16.4+',
        state: 'received',
    },
    [SAMPLE_MESSAGE_PATHS[2]]: {
        message: 'Hmm… 🤔',
        state: 'sent',
    },
    [SAMPLE_MESSAGE_PATHS[3]]: {
        message: 'It leverages the new “suspending” support in React to simplify the handling of asynchronous operations.',
        state: 'received',
    },
    [SAMPLE_MESSAGE_PATHS[4]]: {
        message: 'Try typing something below and hitting ‘Send’',
        state: 'received',
    },
};
