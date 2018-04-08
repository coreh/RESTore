import RESTore, { Path } from '.';

const store = new RESTore();

store.register('/users/:id', async function* (params, options, path) {
    switch (options.method) {
        case 'GET':
            return yield this.stored(path);
        default:
            throw new Error('Unsupported method');
    }
});

store.register('/users', async function (params, options) {
    switch (options.method) {
        case 'POST':
            return {
                [Path]: `/users/${options.body.id}`,
                ...options.body,
            };
        default:
            throw new Error('Unsupported method');
    }
});

(async () => {
    await store.post('/users', {
        id: 5,
        name: 'Foo',
    });

    const user = await store.get(`/users/${5}`);

    console.log(user);
})()
