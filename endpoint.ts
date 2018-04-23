import fetch from 'isomorphic-fetch';

import { HandlerFunction } from '.';

function endpoint(baseURL: string): HandlerFunction {
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

export default endpoint;
