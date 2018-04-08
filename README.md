# RESTore

<p align="center">
<img src="https://github.com/coreh/RESTore/raw/master/logo.png" width="256" height="256"><br>
<strong>RESTful Data Store</strong>
</p>

## Introduction

**RESTore** combines the unidirectional data flow model found in libraries like [Redux](https://redux.js.org) with familiar HTTP semantics.

Its design is informed by field experience with mantaining large Redux applications, with the key realization that despite the fact that almost any useful Redux application will end up interfacing with a REST API, it is currently not very ergonomic to do so.

RESTore's API is fully asynchronous, and meant to go hand-in-hand with the new suspending strategy found in React.

### Development Status

This library is still on its early days, and is certainly not suitable for production. Expect significant changes as the API gets polished.

### Key inspirations

RESTore is inspired by the following APIs/concepts:

- Redux
- React Suspense
- REST
- Fetch API
- Express/Connect/Koa
- Service Workers

## Conceptual Comparison (Redux)

| Redux          | RESTore                                                  |
|----------------|----------------------------------------------------------|
| Store          | Store                                                    |
| Action         | Request                                                  |
| Reducer        | Handler                                                  |
| `.dispatch()`  | `.fetch()`                                               |
| Action Type    | HTTP Verb (`GET`, `POST`, `PUT`, ...)                    |
| Action Creator | Convenience Methods (`.get()`, `.post()`, `.put()`, ...) |
| Selector       | Path                                                     |

## Sample Application

### Store Definition

```js
import RESTore from '@coreh/restore';

const store = new RESTore();

store.use('/users/:id', async function(params, options, path, next) {
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

store.use('/users', async function(params, options, path, next) {
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
```

### Store Usage

```js
await store.post('/users', {
    username: 'coreh',
    likes: ['Chocolate', 'Coffee'],
});

await store.patch('/users/coreh', { singing: true });

const user = await store.get('/users/coreh');
console.log(user); // { username: 'coreh', likes: ['Chocolate', 'Coffee'], singing: true }
```

### Mounting existing REST API endpoints

```js
// Declaration
store.use(RESTore.endpoint('https://api.example.com/'));

// Usage
store.get(`/flights/${airport}`)
```

### Integrating with React "Suspense"

```jsx
const Weather = (props) => {
    // TAKE -> GET, but will throw promise if not fetched
    const weather = store.take(`/weather/${props.location}`);
    return (
        <div>
            <p>Temperature: {weather.temperature}</p>
            <p>Humidity: {weather.humidity}</p>
        </div>
    )
```

### Yield multiple resources (Async Generators)

TODO

### Caching

TODO

### Optimistic Loading / Progress Reporting

TODO

## License

MIT, see [LICENSE](LICENSE).
