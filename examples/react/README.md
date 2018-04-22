# React “Suspense” + RESTore Demo

[Try it live here!](https://restore-react-example.now.sh)

This example code showcases how to use RESTore with React 16.4+

It leverages the new “suspending” support in React to simplify the handling of asynchronous operations. It also showcases the use of:

- Async generators to `yield` multiple resources on a single request
- Optimistic yielding of a resource, then confirming
- The new Context API (Available on React 16.3+)
- `React.unstable_AsyncMode`
- `React.Timeout`

A high latency network is simulated using a random timeout function.

You can check the Web Inspector for a log of all RESTore requests and responses.

## What's RESTore?

RESTore is a data store library with RESTful semantics.

It is as a fully asynchronous alternative to Redux, that relies on a chain of **request handlers** instead of reducers.

### Request Handlers

Request handlers are asynchronous functions that process HTTP-like requests. A handler may either respond to the request or delegate that task to to the next handler in the chain. Request handlers can be global or scoped to a route. (e.g. `/messages`)

(In express/connect/koa terminology, request handlers are roughly equivalent to middleware)

### Async Generators

Request handlers can also be async generators, and therefore `yield` multiple resources—or the same resource multiple times.

This is ideal for preemptively loading related data (e.g. the `Organizations` a given `User` belongs to) or for optimistically yielding a resource in response to user input (e.g. a `Message` that was just sent) and later updating it once a remote server has confirmed it has been successfully received.

### Mounting Existing API Endpoints

The RESTful semantics and fully asynchronous nature of RESTore make it easy to mount existing REST API endpoints directly into your store:

```js
store.use(RESTore.endpoint('https://api.example.com/'))
```

(This functionality is not actually used by this example, it's fully local, and network requests are simply simulated)
