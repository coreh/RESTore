import UrlPattern from 'url-pattern';
import { Content, Path, RESTore } from '../';

it('should create the store', async () => {
    const store = new RESTore();
    expect(store).toBeInstanceOf(RESTore);
});

it('should expose symbols', async () => {
    expect(typeof Path).toEqual('symbol');
    expect(typeof Content).toEqual('symbol');
    expect(typeof RESTore.Path).toEqual('symbol');
    expect(typeof RESTore.Content).toEqual('symbol');
});

it('should provide a default handler function', async () => {
    const store = new RESTore();
    expect((store as any).rules[0].handler).toBeInstanceOf(Function);
    expect((store as any).rules[0].pattern).toBeInstanceOf(UrlPattern);
});

it('should accept a handler function', async () => {
    const store = new RESTore();
    let handlerFunction;
    store.use('/route', handlerFunction = async function (context, next) {
        return next();
    });
    expect((store as any).rules[0].handler).toEqual(handlerFunction);
    expect((store as any).rules[0].pattern).toBeInstanceOf(UrlPattern);
    expect((store as any).rules[0].pattern.match('/route')).toBeTruthy();
});

it('should throw when passing undefined as a handler function', async () => {
    const store = new RESTore();
    expect(() => {
        store.use(undefined as any);
    }).toThrow();
});

it('should accept a handler function without a route string', async () => {
    const store = new RESTore();
    let handlerFunction;
    store.use(handlerFunction = async function (context, next) {
        return next();
    });
    expect((store as any).rules[0].handler).toEqual(handlerFunction);
    expect((store as any).rules[0].pattern).toBeInstanceOf(UrlPattern);
    expect((store as any).rules[0].pattern.match('/whatever/route')).toBeTruthy();
});

it('should call the handler function', async () => {
    const store = new RESTore();
    let called = false;
    store.use(async function (context, next) {
        called = true;
    });
    const response = await store.get('/');
    expect(called).toBeTruthy();
});

it('should call the next handler function when next() is called', async () => {
    const store = new RESTore();
    let called = false;
    store.use(async function (context, next) {
        return next();
    });
    store.use(async function (context, next) {
        called = true;
    });
    const response = await store.get('/');
    expect(called).toBeTruthy();
});

it('should NOT call the next handler function when next() is NOT called', async () => {
    const store = new RESTore();
    let called = false;
    store.use(async function (context, next) {
        return;
    });
    store.use(async function (context, next) {
        called = true;
    });
    const response = await store.get('/');
    expect(called).toBeFalsy();
});

it('should return a promise', async () => {
    const store = new RESTore();
    expect(store.get('/')).toBeInstanceOf(Promise);
});

it('should resolve to the value provided by the return function', async () => {
    const store = new RESTore();
    store.use(async function (context, next) {
        return { message: 'hello' };
    });
    const response = await store.get('/');
    expect(response).toEqual({ message: 'hello' });
});

it('should retrieve GET requests to the same path from the store without calling the handler twice', async () => {
    const store = new RESTore();
    let count = 0;
    store.use(async function (context, next) {
        count++;
        return { message: 'Hello' };
    });
    await store.get('/some-path');
    await store.get('/some-path');
    await store.get('/other-path');
    expect(count).toEqual(2);
});

it('should NOT retrieve POST | PUT | DELETE | PATCH requests to the same path from the store without calling the handler twice', async () => {
    const store = new RESTore();
    let count = 0;
    store.use(async function (context, next) {
        count++;
        return { message: 'Hello' };
    });
    await store.put('/some-path', {});
    await store.put('/some-path', {});
    await store.post('/some-path', {});
    await store.post('/some-path', {});
    await store.delete('/some-path');
    await store.delete('/some-path');
    await store.patch('/some-path', {});
    await store.patch('/some-path', {});
    expect(count).toEqual(8);
});

it('should return a promise for multiple concurrent GET requests without calling the handler twice', async () => {
    const store = new RESTore();
    let count = 0;
    store.use(async function (context, next) {
        count++;
        await new Promise(() => { /* forever */ });
    });
    const promiseA = store.get('/some-path');
    const promiseB = store.get('/some-path');
    expect(promiseA).toBeInstanceOf(Promise);
    expect(promiseB).toBeInstanceOf(Promise);
    expect(count).toBe(1);
});

it('should include the correct method in the context object', async () => {
    const store = new RESTore();
    store.use('/a', async function (context, next) {
        expect(context.method).toEqual('GET');
        return {};
    });
    store.use('/b', async function (context, next) {
        expect(context.method).toEqual('POST');
        return {};
    });
    store.use('/c', async function (context, next) {
        expect(context.method).toEqual('PUT');
        return {};
    });
    store.use('/d', async function (context, next) {
        expect(context.method).toEqual('DELETE');
        return {};
    });
    store.use('/e', async function (context, next) {
        expect(context.method).toEqual('PATCH');
        return {};
    });
    await store.get('/a');
    await store.fetch('/a');
    await store.fetch('/a', { method: 'GET' });
    await store.post('/b', {});
    await store.fetch('/b', { method: 'POST', body: {} });
    await store.put('/c', {});
    await store.fetch('/c', { method: 'PUT', body: {} });
    await store.delete('/d');
    await store.fetch('/d', { method: 'DELETE', body: {} });
    await store.patch('/e', {});
    await store.fetch('/e', { method: 'PATCH', body: {} });
});

it('should include the correct path in the context object', async () => {
    const store = new RESTore();
    store.use('/a', async function (context, next) {
        expect(context.path).toEqual('/a');
        return {};
    });
    store.use('/b', async function (context, next) {
        expect(context.path).toEqual('/b');
        return {};
    });
    store.use('/c', async function (context, next) {
        expect(context.path).toEqual('/c');
        return {};
    });
    await store.get('/a');
    await store.get('/b');
    await store.get('/c');
});

it('should throw on the default handler when calling unsupported methods other than GET', async () => {
    const store = new RESTore();
    await expect(store.post('/some-path', {})).rejects.toThrow();
    await expect(store.fetch('/some-path', { method: 'POST' })).rejects.toThrow();
    await expect(store.put('/some-path', {})).rejects.toThrow();
    await expect(store.fetch('/some-path', { method: 'PUT' })).rejects.toThrow();
    await expect(store.delete('/some-path')).rejects.toThrow();
    await expect(store.fetch('/some-path', { method: 'DELETE' })).rejects.toThrow();
    await expect(store.patch('/some-path', {})).rejects.toThrow();
    await expect(store.fetch('/some-path', { method: 'PATCH' })).rejects.toThrow();
});

it('should return undefined when calling stored() on a never requested resource', async () => {
    const store = new RESTore();
    expect(store.stored('/some-path')).toBeUndefined();
});

it('should return undefined when calling stored() on a pending resource', async () => {
    const store = new RESTore();
    store.use(async function (context, next) {
        await new Promise(() => { /* forever */ });
    });
    store.get('/some-path');
    expect(store.stored('/some-path')).toBeUndefined();
});

it('should return a value immediately when calling stored() on a stored resource', async () => {
    const store = new RESTore();
    store.use(async function (context, next) {
        return { message: 'Hello' };
    });
    await store.get('/some-path');
    expect(store.stored('/some-path')).toEqual({ message: 'Hello' });
});

it('should throw a Promise when calling take() on a never requested resource', async () => {
    const store = new RESTore();
    expect(() => {
        store.take('/some-path');
    }).toThrow(Promise);
});

it('should throw a Promise when calling take() on a pending resource', async () => {
    const store = new RESTore();
    store.use(async function (context, next) {
        await new Promise(() => { /* forever */ });
    });
    store.get('/some-path');
    expect(() => {
        store.take('/some-path');
    }).toThrow(Promise);
});

it('should return a value immediately when calling take() on a stored resource', async () => {
    const store = new RESTore();
    store.use(async function (context, next) {
        return { message: 'Hello' };
    });
    await store.get('/some-path');
    expect(store.take('/some-path')).toEqual({ message: 'Hello' });
});

it('should return the first resource yielded by an async generator request handler', async () => {
    const store = new RESTore();
    store.use(async function* (context, next) {
        yield { message: 'First' };
        yield { message: 'Second' };
        yield { message: 'Third' };
    });
    expect(await store.get('/some-path')).toEqual({ message: 'First' });
});

it('should return undefined if the async generator request handler doesn\'t yield', async () => {
    const store = new RESTore();
    store.use(async function* (context, next) {
        return;
    });
    expect(await store.get('/some-path')).toBeUndefined();
});

it('should eventually have the last value yielded by the async generator request handler in the store', async () => {
    const store = new RESTore();
    store.use(async function* (context, next) {
        yield { message: 'First' };
        yield { message: 'Second' };
        yield { message: 'Third' };
    });
    await store.get('/some-path');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    store.stored('/some-path');
    expect(await store.get('/some-path')).toEqual({ message: 'Third' });
});

it('should call a subscriber function every time the store is updated', async () => {
    const store = new RESTore();
    store.use('/function', async function (context, next) {
        return { message: 'Hello' };
    });
    store.use('/generator', async function* (context, next) {
        yield { message: 'First' };
        yield { message: 'Second' };
        yield { message: 'Third' };
    });
    let count = 0;
    store.subscribe(function () {
        count++;
    });
    await store.get('/function');
    await store.get('/generator');
    await store.get('/some-other-path'); // The default handler will also produce an update (to undefined)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(count).toBe(5);
});

it('should be possible to store a resource on a different path than the request path', async () => {
    const store = new RESTore();
    store.use('/a', async function (context, next) {
        return {
            [Path]: '/b',
            message: 'Hello',
        };
    });
    expect(await store.get('/a')).toBeUndefined();
    expect(store.stored('/b')).toEqual({ message: 'Hello' });
});

it('should be possible to yield resources on multiple paths', async () => {
    const store = new RESTore();
    store.use('/a', async function* (context, next) {
        yield {
            [Path]: '/b',
            message: 'B',
        };
        yield {
            [Path]: '/c',
            message: 'C',
        };
        yield {
            [Path]: '/d',
            message: 'D',
        };
        yield {
            [Path]: '/a',
            message: 'A',
        };
    });
    expect(await store.get('/a')).toEqual({ message: 'A' });
    expect(store.stored('/b')).toEqual({ message: 'B' });
    expect(store.stored('/c')).toEqual({ message: 'C' });
    expect(store.stored('/d')).toEqual({ message: 'D' });
});

it('should be possible to use arrays of path components', async () => {
    const store = new RESTore();
    store.use('/some/path/with/multiple/components', async function (context, next) {
        return { message: 'Hello' };
    });
    store.use('/some/path/with/a/:number/param', async function (context, next) {
        return { message: 'Bye' };
    });
    expect(await store.get(['some', 'path', 'with', 'multiple', 'components'])).toEqual({ message: 'Hello' });
    expect(await store.get(['some', 'path', 'with', 'a', 5, 'param'])).toEqual({ message: 'Bye' });
});
