import uuid from 'uuid/v4';

export const SAMPLE_MESSAGE_PATHS = [
    `/messages/${uuid()}`,
    `/messages/${uuid()}`,
]

export const SAMPLE_MESSAGES = {
    [SAMPLE_MESSAGE_PATHS[0]]: {
        message: 'Hello',
        state: 'received',
    },
    [SAMPLE_MESSAGE_PATHS[1]]: {
        message: 'This is a test',
        state: 'received',
    },
};
