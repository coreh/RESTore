import RESTore from '.';

const store = new RESTore();

store.use('/users/:id', async function ({ method, body, path }, next) {
    switch (method) {
        case 'PATCH':
            const stored = this.stored(path);
            if (stored === undefined) {
                throw new Error('User does not exist');
            }
            return {
                ...stored,
                ...body,
            };
        default:
            return next();
    }
});

store.use('/users', async function ({ method, body, path }, next) {
    switch (method) {
        case 'POST':
            return {
                [RESTore.Path]: ['users', body.username], // Same as `/users/${body.username}`
                ...body,
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

    await store.patch('/users/coreh', {
        singing: true,
    });

    console.log(await store.get('/users/coreh'));
    // { username: 'coreh',
    //   likes: ['Chocolate', 'Coffee'],
    //   singing: true }
}

main();
