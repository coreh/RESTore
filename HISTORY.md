
0.5.0 / 2018-04-22
==================

  * Move `endpoint()` request handler to a separate file
  * Fix bug where we would produce a promise chain cycle
  * Fix bug where we would attempt to compare non-canonized paths
  * Make return type requirements for handler functions less strict
  * Use string enums internally to make debugging easier
  * Add unit tests

0.4.1 / 2018-04-22
==================

  * Ensure asyncIterator polyfill doesn't throw if symbol exists and is read only

0.4.0 / 2018-04-09
==================

  * Move to a context parameter for the handler functions

0.3.0 / 2018-04-09
==================

  * Add path canonization
  * Add support for array paths

0.2.0 / 2018-04-08
==================

  * Fix `take()` implementation
  * Ensure promise is stored when `GET`ting resource for the first time
  * Resolve on first yield of requested resource when using async generators
  * Add `RESTore.Content`

0.1.0 / 2018-04-08
==================

  * Added `.subscribe()`
  * Added default `GET` implementation

0.0.1 / 2018-04-07
==================

  * Initial release
