/**
 * Handler function that logs RESTore requests and responses
 */
const logging = () => (
    async function ({ method, path, body }, next) {
        if (body !== undefined) {
            console.log('↘ %s %o\n%o', method, path, body);
        } else {
            console.log('↘ %s %o', method, path);
        }
        const response = await next();
        console.log('↙ %o\n%o', path, response);
        return response;
    }
)

export default logging;
