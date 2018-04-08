import fetch from 'isomorphic-fetch';
import UrlPattern from 'url-pattern';

(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

export const Path = Symbol.for('RESTore.Path');

enum StoreEntryState {
    Loading,
    Fresh,
    Stale,
}


/**
 * Request options
 */

export interface Options {

    /**
     * Request method
     */

    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

    /**
     * Request body
     */

    body?: any;
}

/**
 * A Resource to be stored or retrieved
 */

export interface Resource {

    /**
     * Resource path
     */

    [Path]?: string;
}

interface StoreEntry {
    state: StoreEntryState;
    promise?: Promise<any>
    resource?: any;
}

/**
 * A Function to handle store requests
 */

export interface HandlerFunction {

    /**
     * @param params: Route params
     * @param options: Request options
     * @param path: Request path
     * @param next: Call next handler in the chain
     */

    (this: RESTore, params: any, options: Options, path: string, next: () => Promise<void>): AsyncIterator<Resource> | Promise<Resource>
}

interface Rule {
    pattern: UrlPattern;
    handler: HandlerFunction;
}

export function endpoint(baseURL: string) {
    if (baseURL.endsWith('/')) {
        baseURL.slice(0, baseURL.length - 1);
    }

    function statusError(status, method, path) {
        return new Error(`Received status ${status} while attempting to ${method} ${path}`);
    }

    return async function* (params, options, path) {

        const fullPath = baseURL + path;

        const response = await fetch(fullPath, options);

        let body;
        if (response.headers.get('content-type') === 'application/json') {
            body = await response.json();
        } else {
            body = await response.text();
        }

        switch (options.method) {
            case 'GET':
                if (response.status == 200) {
                    return yield {
                        path,
                        body,
                    }
                } else {
                    throw statusError(response.status, options.method, fullPath);
                }
            case 'PUT':
            case 'PATCH':
                if (response.status == 200 || response.status == 201) {
                    return yield {
                        path,
                        body,
                    }
                } else {
                    throw statusError(response.status, options.method, fullPath);
                }
            case 'DELETE':
                if (response.status == 200 || response.status == 201) {
                    return yield {
                        path,
                        body: undefined,
                    }
                } else {
                    throw statusError(response.status, options.method, fullPath);
                }
            case 'POST':
                if (response.status == 200 || response.status == 201) {
                    // Do nothing
                } else {
                    throw statusError(response.status, options.method, fullPath);
                }
        }
    }
}

export class RESTore {
    static Path = Path;

    private rules: Rule[] = [];
    private store: Map<string, StoreEntry> = new Map();

    constructor(baseURL: string = '') {
        this.use(endpoint(baseURL));
    }

    stored<T = any>(path: string): T | undefined {
        const stored = this.store.get(path);
        if (stored) {
            return stored.resource;
        }
    }

    take<T = any>(path: string): T {
        const stored = this.store.get(path);
        if (stored === undefined) {
            const entry = {
                state: StoreEntryState.Loading,
                promise: this.fetch(path),
                path,
            }

            this.store.set(path, entry);

            throw entry.promise;
        }

        if (stored.state === StoreEntryState.Stale) {
            this._fetch(path);
        }

        return stored.resource;
    }

    /**
     * Fetch a resource from the store
     * @param path Resource path
     * @param options Options
     */

    async fetch<T = any>(path: string, options: Options = { method: 'GET' }): Promise<T | undefined> {
        if (options.method == 'GET') {
            const stored = this.store.get(path);
            if (stored !== undefined) {
                if (stored.promise) {
                    return stored.promise;
                }
                return stored.resource;
            }
        }
        return this._fetch(path, options);
    }

    private async _fetch<T = any>(path: string, options: Options = { method: 'GET' }, index: number = 0): Promise<T | undefined> {
        const next = async () => await this._fetch(path, options, index + 1);
        const rule = this.rules[index];
        if (!rule) {
            return undefined;
        }
        const match = rule.pattern.match(path);
        if (match) {
            const promiseOrAsyncIterator = rule.handler.call(this, match, options, path, next);
            if (promiseOrAsyncIterator.then) {
                const resource = await promiseOrAsyncIterator;
                this.store.set(resource[Path] || path, {
                    state: StoreEntryState.Fresh,
                    resource,
                })
            } else {
                for await (const resource of promiseOrAsyncIterator) {
                    this.store.set(resource[Path] || path, {
                        state: StoreEntryState.Fresh,
                        resource,
                    })
                }
            }
            const stored = this.store.get(path);
            if (stored !== undefined) {
                return stored.resource;
            }
            return;
        }
        return next();
    }

    /**
     * Install a global handler function
     */

    use(handler: HandlerFunction): this;

    /**
     * Install a handler function for a specific route
     * (e.g. '/users/:id')
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

        throw new Error('You must provide a handler function')
    }

    /*
     * Convenience Methods
     */

    /**
     * GET a resource from the store
     * @param path A path to GET
     */

    async get<T = any>(path: string): Promise<T | undefined> {
        return this.fetch<T>(path);
    }

    /**
     * POST to the specified path
     * @param path A path to POST
     * @param body Body for the POST request
     */

    async post<T = any>(path: string, body: T): Promise<T | undefined> {
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

    async put<T = any>(path: string, body: T): Promise<T | undefined> {
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

    async patch<T = any>(path: string, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'PATCH',
            body,
        });
    }

    /**
     * DELETE the resource at the specified path
     * @param path A path to DELETE
     */

    async delete<T = any>(path: string): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'DELETE',
        });
    }
}

export default RESTore;
