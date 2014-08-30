Use JavaScript functionally, you must!

You must unlearn what you have learned.

Core concepts:

  * Designed to be curried, all loda functions are. Last, most-significant
    arguments come. Yes, hmmm.

  * Kitchen sink Loda is not. Minimal functional toolkit, it is. Build complex
    functionality from it, you can.

  * Sequence comprehensions like `map` and `reduce` operate on ES6 Iterables,
    and not Arrays or Objects. This makes Loda compatible with anything that can
    be iterated including ES6 collections Map and Set, `arguments` objects, and
    third-party data structures like [`immutable`](https://github.com/facebook/immutable-js).

  * Sequence comprehensions return unfulfilled Iterables. This makes them lazy,
    allowing for performant chained operations and allows them to reify to any
    Array, Object or any kind of data structure.


Contribution
------------

Use [Github issues](https://github.com/leebyron/loda/issues) for requests.

Pull requests actively welcomed.
