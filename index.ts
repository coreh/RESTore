import fetch from 'isomorphic-fetch';
import UrlPattern from 'url-pattern';

(Symbol as any).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");

export const Path = Symbol.for('Path');

enum StoreEntryState {
    Loading,
    Fresh,
    Stale,
}

export interface Options {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: any;
}

export interface Resource {
    [Path]?: string;
}

interface StoreEntry {
    state: StoreEntryState;
    promise?: Promise<any>
    resource?: any;
}

export interface HandlerFunction {
    (this: RESTore, params: any, options: Options, path: string): AsyncIterator<Resource> | Promise<Resource>
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
    private rules: Rule[] = [];
    private store: Map<string, StoreEntry> = new Map();

    constructor(baseURL: string = '') {
        this.register('*', endpoint(baseURL));
    }

    stored<T = any>(path: string): T | undefined {
        const stored = this.store.get(path);
        if (stored) {
            return stored.resource;
        }
    }

    expect<T = any>(path: string): T {
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

    async get<T = any>(path: string): Promise<T | undefined> {
        return this.fetch<T>(path);
    }

    async post<T = any>(path: string, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'POST',
            body,
        });
    }

    async put<T = any>(path: string, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'PUT',
            body,
        });
    }

    async patch<T = any>(path: string, body: T): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'PATCH',
            body,
        });
    }

    async delete<T = any>(path: string): Promise<T | undefined> {
        return this._fetch<T>(path, {
            method: 'DELETE',
        });
    }

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

    private async _fetch<T = any>(path: string, options: Options = { method: 'GET' }): Promise<T | undefined> {
        for (const rule of this.rules) {
            const match = rule.pattern.match(path);
            if (match) {
                const promiseOrAsyncIterator = rule.handler.call(this, match, options, path);
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
        }
    }

    register(route: string, handler: HandlerFunction) {
        this.rules.unshift({
            pattern: new UrlPattern(route),
            handler,
        });
    }
}

export default RESTore;
