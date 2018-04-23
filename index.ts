import fetch from 'isomorphic-fetch';
import UrlPattern from 'url-pattern';

if (!(Symbol as any).asyncIterator) {
    ((Symbol as any).asyncIterator) = Symbol.for('Symbol.asyncIterator');
}

export const Path = Symbol.for('RESTore.Path');
export const Content = Symbol.for('RESTore.Content');

enum StoreEntryState {
    Loading,
    Fresh,
    Stale,
}

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Request options
 */

export interface Options {

    /**
     * Request method
     */

    method: Method;

    /**
     * Request body
     */

    body?: any;
}

/**
 * A Resource to be stored or retrieved
 */

export interface Resource {
    /** Resource path */
    [Path]?: Path;

    /** Resource content */
    [Content]?: string;
}

/**
 * A entry in the store
 *
 * Holds a resource or a promise that will eventually resolve to
 * the resource, along with a state.
 */

interface StoreEntry {
    state: StoreEntryState;
    promise?: Promise<any>;
    resource?: any;
}

export type Path = string | (string | number)[];

/**
 * The `context` parameter passed to the Handler function
 */

export interface HandlerContext {
    /** Parameters extracted from the route match */
    readonly params: { [key: string]: string | undefined };

    /** The options object passed to the `fetch` function */
    readonly options: Options;

    /** The method of the current request */
    readonly method: Method;

    /** The body of the current request */
    readonly body?: any;

    /** The path of the current request */
    readonly path: string;

    /** The store instance */
    readonly store: RESTore;
}

/**
 * A Function to handle store requests
 * @param params: Route params
 * @param options: Request options
 * @param path: Request path
 * @param next: Call next handler in the chain
 */

export type HandlerFunction = (this: RESTore, context: HandlerContext, next: () => Promise<void>) => AsyncIterable<Resource | {} | void> | Promise<Resource | {} | void>;

/**
 * A function that listens for changes in the store
 */

export type ListenerFunction = (this: RESTore) => void;

/**
 * A rule used to match paths to request handlers
 */

interface Rule {
    pattern: UrlPattern;
    handler: HandlerFunction;
}

export function endpoint(baseURL: string): HandlerFunction {
    if (baseURL.endsWith('/')) {
        baseURL.slice(0, baseURL.length - 1);
    }

    function statusError(status, method, path) {
        return new Error(`Received status ${status} while attempting to ${method} ${path}`);
    }

    return async function* ({ params, options, method, path }) {
        const fullPath = baseURL + path;
        const response = await fetch(fullPath, options);

        let body;
        if (response.headers.get('content-type') === 'application/json') {
            body = await response.json();
        } else {
            body = await response.text();
        }

        switch (method) {
            case 'GET':
                if (response.status === 200) {
                    return yield {
                        path,
                        body,
                    };
                } else {
                    throw statusError(response.status, method, fullPath);
                }
            case 'PUT':
            case 'PATCH':
                if (response.status === 200 || response.status === 201) {
                    return yield {
                        path,
                        body,
                    };
                } else {
                    throw statusError(response.status, method, fullPath);
                }
            case 'DELETE':
                if (response.status === 200 || response.status === 201) {
                    return yield {
                        path,
                        body: undefined,
                    };
                } else {
                    throw statusError(response.status, method, fullPath);
                }
            case 'POST':
                if (response.status === 200 || response.status === 201) {
                    // Do nothing
                } else {
                    throw statusError(response.status, method, fullPath);
                }
        }
    };
}

export class RESTore {
    static Path = Path;
    static Content = Content;
    static endpoint = endpoint;

    private rules: Rule[] = [];
    private listeners: ListenerFunction[] = [];
    private store: Map<string, StoreEntry> = new Map();

    constructor() {
        this.use(async function ({ params, options, path }) {
            switch (options.method) {
                case 'GET':
                    return this.stored(path);
                default:
                    throw new Error(`Not supported: ${options.method} ${path}`);
            }
        });
    }

    /**
     * Synchronously retrieves the resource stored at the given path
     *
     * Returns undefined if the resource is not stored
     *
     * @param path Resource path
     */

    stored<T = any>(path: Path): T | undefined {
        const stored = this.store.get(this.canonize(path));
        if (stored) {
            return stored.resource;
        }
    }

    /**
     * Synchronously retrieves the resource stored at the given path
     *
     * Throws a promise that will resolve to the requested resource if the resource is not stored
     *
     * @param path Resource path
     */

    take<T = any>(path: Path): T {
        const canonizedPath = this.canonize(path);
        const stored = this.store.get(canonizedPath);
        if (stored === undefined) {
            const entry = {
                state: StoreEntryState.Loading,
                promise: this._fetch(canonizedPath),
            };

            this.store.set(canonizedPath, entry);

            throw entry.promise;
        }

        if (stored.state === StoreEntryState.Stale) {
            this._fetch(canonizedPath);
        }

        if (stored.resource !== undefined) {
            return stored.resource;
        }

        throw stored.promise;
    }

    /**
     * Fetch a resource from the store
     * @param path Resource path
     * @param options Options
     */

    async fetch<T = any>(path: Path, options: Options = { method: 'GET' }): Promise<T | undefined> {
        if (options.method === 'GET') {
            const canonizedPath = this.canonize(path);
            const stored = this.store.get(canonizedPath);
            if (stored !== undefined) {
                if (stored.resource !== undefined) {
                    return stored.resource;
                }
                return stored.promise;
            }

            const promise = this._fetch(canonizedPath, options);

            this.store.set(canonizedPath, {
                state: StoreEntryState.Loading,
                promise,
            });

            return promise;
        }
        return this._fetch(path, options);
    }

    /**
     * Canonizes a path to string form
     * @param path Path to be canonized
     */

    private canonize(path: Path) {
        let canonizedPath = typeof path === 'string' ? path : '/' + path.map(encodeURIComponent).join('/');
        canonizedPath = canonizedPath.replace(/\/+/g, '/');
        if (!canonizedPath.startsWith('/')) {
            canonizedPath = '/' + canonizedPath;
        }
        if (canonizedPath.endsWith('/')) {
            canonizedPath = canonizedPath.slice(0, canonizedPath.length - 1);
        }
        return canonizedPath;
    }

    /**
     * Recursively calls request handlers in the chain that match the requested path
     * @param path Path being requested
     * @param options Request options
     * @param index Current position on the request handler chain
     * @param context The context object that was passed to the previous handler
     */

    private async _fetch<T = any>(path: Path, options: Options = { method: 'GET' }, index: number = 0, context?: HandlerContext): Promise<T | undefined> {
        const rule = this.rules[index];
        if (!rule) {
            return undefined;
        }
        const next = async () => await this._fetch(path, options, index + 1, context);
        const store = this;
        const canonizedPath = this.canonize(path);
        const body = options.body;
        const method = options.method;
        const match = rule.pattern.match(canonizedPath);
        if (match) {
            // Ensures these properties are not overriden by handlers
            context = Object.assign({
                get params() { return match; }, set params(value) { return; },
                get options() { return options; }, set options(value) { return; },
                get method() { return method; }, set method(value) { return; },
                get body() { return body; }, set body(value) { return; },
                get path() { return canonizedPath; }, set path(value) { return; },
                get store() { return store; }, set store(value) { return; },
            }, context);
            const promiseOrAsyncIterator = rule.handler.call(this, context, next);
            if (promiseOrAsyncIterator.then) {
                const resource = await promiseOrAsyncIterator;
                this.set(context.path, resource);
                this.notify();
            } else {
                await new Promise((resolve, reject) => {
                    this.consume(promiseOrAsyncIterator, context!.path, resolve)
                        .then(() => resolve())
                        .catch(reject);
                });
            }
            const stored = this.store.get(context.path);
            if (stored !== undefined) {
                if (stored.resource !== undefined) {
                    return stored.resource;
                }
                return stored.promise;
            }
            return;
        }
        return next();
    }

    /**
     * Consume an async iterable, and resolve as soon as the originally requested path is yielded
     *
     * @param asyncIterator async iterable to be consumed
     * @param path Original request path
     * @param resolve Callback to resolve early as soon as the original path is yielded
     */

    private async consume<T>(asyncIterator: AsyncIterable<Resource | undefined>, path: Path, resolve: () => void) {
        const canonizedPath = this.canonize(path);
        for await (const resource of asyncIterator) {
            const pathSet = this.set(path, resource);
            if (this.canonize(pathSet) === canonizedPath) {
                resolve();
            }
            this.notify();
        }
    }

    /**
     * Store a resource at a path
     *
     * @param defaultPath Default path to store the resource at (Might be overriden by the Resource)
     * @param resource Resource to be stored
     * @returns The path that the restore was ultimately stored at
     */

    private set(defaultPath: Path, resource: any) {
        let content;
        let path: Path;
        if (typeof resource === 'object') {
            path = resource[Path] || defaultPath;
            content = {}.hasOwnProperty.call(resource, Content) ? resource[Content] : resource;
        } else {
            path = defaultPath;
            content = resource;
        }
        if (content !== undefined) {
            this.store.set(this.canonize(path), {
                state: StoreEntryState.Fresh,
                resource: JSON.parse(JSON.stringify(content)),
            });
        } else {
            this.store.delete(this.canonize(path));
        }
        return path;
    }

    /**
     * Notify listeners about an update
     */

    private notify() {
        for (const listener of this.listeners) {
            Promise.resolve().then(() => listener.call(this));
        }
    }

    /**
     * Install a global handler function
     *
     * @param handler Handler function to be installed globally
     */

    use(handler: HandlerFunction): this;

    /**
     * Install a handler function for a specific route
     * (e.g. '/users/:id')
     *
     * @param route String defining a route
     * @param handler Handler function to be installed for the route
     */

    use(route: string, handler: HandlerFunction): this;

    use(routeOrHandler: string | HandlerFunction, handler?: HandlerFunction): this {
        if (typeof routeOrHandler === 'string' && handler) {
            const route = routeOrHandler;
            this.rules.splice(this.rules.length - 1, 0, {
                pattern: new UrlPattern(route),
                handler,
            });
            return this;
        }

        if (typeof routeOrHandler === 'function') {
            const handler = routeOrHandler;
            this.rules.splice(this.rules.length - 1, 0, {
                pattern: new UrlPattern('*'),
                handler,
            });
            return this;
        }

        throw new Error('You must provide a handler function');
    }

    /**
     * Subscribe to receive updates from the store
     *
     * The listener function will be called every time the store contents are updated
     *
     * @param listener listener function for the subscription
     */

    subscribe(listener: ListenerFunction) {
        this.listeners.push(listener);
    }

    /*
     * Convenience Methods
     */

    /**
     * GET a resource from the store
     * @param path A path to GET
     */

    async get<T = any>(path: Path): Promise<T | undefined> {
        return this.fetch<T>(path);
    }

    /**
     * POST to the specified path
     * @param path A path to POST
     * @param body Body for the POST request
     */

    async post<T = any>(path: Path, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'POST',
            body,
        });
    }

    /**
     * PUT the resource at the specified path
     * @param path A path to PUT
     * @param body Body for the PUT request
     */

    async put<T = any>(path: Path, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'PUT',
            body,
        });
    }

    /**
     * PATCH the resource at the specified path
     * @param path A path to PATCH
     * @param body Body for the PATCH request
     */

    async patch<T = any>(path: Path, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'PATCH',
            body,
        });
    }

    /**
     * DELETE the resource at the specified path
     * @param path A path to DELETE
     */

    async delete<T = any>(path: Path): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'DELETE',
        });
    }
}

export default RESTore;
