# React + RESTore Demo

[Try it live here!](https://react-qwmcmhvzdc.now.sh)

This example code showcases how to use RESTore with React 16.4+

It leverages the new “suspending” support in React to simplify the handling of asynchronous operations. It also showcases the use of:

- Async generators to `yield` multiple resources on a single request
- Optimistic yielding of a resource, then confirming
- The new Context API (Available on React 16.3+)
- `React.unstable_AsyncMode`
- `React.Timeout`

A high latency network is simulated using a simple random timeout function.

You can check the Web Inspector for a log of all RESTore requests and responses.