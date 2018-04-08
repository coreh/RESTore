import RESTore from '.';

const store = new RESTore();

store.use('/users/:id', async function (params, options, path, next) {
    switch (options.method) {
        case 'GET':
            return this.stored(path);
        case 'PATCH':
            const stored = this.stored(path);
            return {
                ...stored,
                ...options.body,
            };
        default:
            return next();
    }
});

store.use('/users', async function (params, options, path, next) {
    switch (options.method) {
        case 'POST':
            return {
                [RESTore.Path]: `/users/${options.body.username}`,
                ...options.body,
            };
        default:
            return next();
    }
});

async function main() {
    await store.post('/users', {
        username: 'coreh',
        likes: ['Chocolate', 'Coffee'],
    });

    await store.patch('/users/coreh', { singing: true });

    const user = await store.get('/users/coreh');
    console.log(user); // { username: 'coreh', likes: ['Chocolate', 'Coffee'], singing: true }
}

main();
