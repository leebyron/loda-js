require('jasmine-check').install()

describe 'loda', ->

  # clean this up later
  loda = require('../src/loda-core.js')
  loda = require('../')
  loda.install global

  it 'was installed', ->
    expect(contextify).toBe loda.contextify


  describe 'function manipulation', ->

    describe 'arity (argument length)', ->

      it 'returns a function with a new arity', ->
        fnOrig = (a, b, c) -> [a, b, c].join '-'
        fn0 = arity 0, fnOrig
        fn1 = arity 1, fnOrig
        fn2 = arity 2, fnOrig
        fn3 = arity 3, fnOrig
        expect(fnOrig.length).toBe 3
        expect(fn0.length).toBe 0
        expect(fn1.length).toBe 1
        expect(fn2.length).toBe 2
        expect(fn3.length).toBe 3

      it 'returns fn if it is already of the requested arity', ->
        fnOrig = (a, b, c) -> [a, b, c].join '-'
        fn3 = arity 3, fnOrig
        expect(fn3).toBe fnOrig

      it 'provides all arguments to the original function', ->
        fnOrig = (a, b, c) -> [a, b, c].join '-'
        fn1 = arity 1, fnOrig
        expect(fn1 'A', 'B', 'C').toBe 'A-B-C'



    describe 'apply', ->

      it 'calls a function with an array of arguments', ->
        spy = jasmine.createSpy()
        apply spy, [1, 2, 3]
        expect(spy).toHaveBeenCalledWith 1, 2, 3

      it 'can apply with a thisArg', ->
        thisArg = {}
        spy = jasmine.createSpy()
        apply spy, [1, 2, 3], thisArg
        expect(spy).toHaveBeenCalledWith 1, 2, 3
        expect(spy.mostRecentCall.object).toBe thisArg

      it 'is curried', ->
        thisArg = {}
        spy = jasmine.createSpy()
        spy2 = apply spy
        spy2 [1, 2, 3], thisArg
        expect(spy).toHaveBeenCalledWith 1, 2, 3
        expect(spy.mostRecentCall.object).toBe thisArg


    describe 'curry', ->

      it 'returns a function of the same arity', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        curried = curry fn
        rCurried = curryRight fn
        expect(curried.length).toBe fn.length
        expect(rCurried.length).toBe fn.length

      it 'returns a function of a given arity', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        curried = curry fn, 2
        rCurried = curryRight fn, 2
        expect(curried.length).toBe 2
        expect(rCurried.length).toBe 2

      it 'curries a function from the left', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        curried = curry fn
        expect(curried('A')('B', 'C')).toBe 'A-B-C'
        expect(curried('A', 'B')('C')).toBe 'A-B-C'
        expect(curried('A')('B')('C')).toBe 'A-B-C'

      it 'curries a function from the right', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        rCurried = curryRight fn
        expect(rCurried('A')('B', 'C')).toBe 'B-C-A'
        expect(rCurried('A', 'B')('C')).toBe 'C-A-B'
        expect(rCurried('A')('B')('C')).toBe 'C-B-A'

      it 'can be re-curried', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        rCurried = curryRight fn
        curried = curry rCurried
        expect(curried('A')('B')('C')).toBe 'A-B-C'

      it 'can be re-curried once partially applied', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        rCurried = curryRight fn
        withA = rCurried('A')
        curried = curry withA
        expect(curried('B')('C')).toBe 'B-C-A'

      it 'can be detected as curried', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        curried = curry(fn)
        rCurried = curryRight(fn)
        expect(isCurried fn).toBe false
        expect(isCurried curried).toBe true
        expect(isCurried rCurried).toBe true


    describe 'compose', ->

      it 'composes functions', ->
        add5 = add 5
        mul2 = mul 2
        sub3 = sub 3
        composed = compose sub3, mul2, add5
        expect(composed 10).toBe sub3 mul2 add5 10

      it 'composes functions from the right', ->
        add5 = add 5
        mul2 = mul 2
        sub3 = sub 3
        rComposed = composeRight sub3, mul2, add5
        expect(rComposed 10).toBe add5 mul2 sub3 10

      it 'returns a function with arity of the last fn', ->
        mul2 = mul 2
        sub3 = sub 3
        composed = compose sub3, mul2, add
        expect(composed.length).toBe add.length
        rComposed = composeRight add, mul2, sub3
        expect(rComposed.length).toBe add.length


    describe 'partial', ->

      it 'partially applies arguments', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        withAB = partial fn, 'A', 'B'
        expect(withAB 'C').toBe 'A-B-C'

      it 'partially applies arguments from the right', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        withAB = partialRight fn, 'A', 'B'
        expect(withAB 'C').toBe 'C-A-B'

      it 'returns fn if no arguments are provided', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        withNothing = partial fn
        rWithNothing = partialRight fn
        expect(withNothing).toBe fn
        expect(rWithNothing).toBe fn

      it 'may partially apply more arguments than the fn arity', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        withABCD = partial fn, 'A', 'B', 'C', 'D'
        rWithABCD = partialRight fn, 'A', 'B', 'C', 'D'
        expect(withABCD()).toBe 'A-B-C'
        expect(rWithABCD()).toBe 'A-B-C'

      it 'returns a function with arity of the remaining args', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        withA = partial fn, 'A'
        withAB = partial fn, 'A', 'B'
        withABC = partial fn, 'A', 'B', 'C'
        withABCD = partial fn, 'A', 'B', 'C', 'D'
        expect(withA.length).toBe 2
        expect(withAB.length).toBe 1
        expect(withABC.length).toBe 0
        expect(withABCD.length).toBe 0
        rWithA = partial fn, 'A'
        rWithAB = partial fn, 'A', 'B'
        rWithABC = partial fn, 'A', 'B', 'C'
        rWithABCD = partial fn, 'A', 'B', 'C', 'D'
        expect(rWithA.length).toBe 2
        expect(rWithAB.length).toBe 1
        expect(rWithABC.length).toBe 0
        expect(rWithABCD.length).toBe 0


    describe 'context', ->

      it 'can decontextify a method', ->
        slice = decontextify Array.prototype.slice
        expect(slice [ 1, 2, 3, 4 ]).toEqual [ 1, 2, 3, 4 ]
        expect(slice 2, [ 1, 2, 3, 4 ]).toEqual [ 3, 4 ]
        expect(slice 1, -1, [ 1, 2, 3, 4 ]).toEqual [ 2, 3 ]

      it 'can contextify a function', ->
        tandemBike = { type: 'Tandem' }
        getBikeType = (bike) -> bike.type
        expect(getBikeType tandemBike).toBe 'Tandem'
        tandemBike.getType = contextify getBikeType
        expect(tandemBike.getType()).toBe 'Tandem'

      it 'returns a function of the correct arity', ->
        original = Array.prototype.slice
        dectxed = decontextify original
        ctxed = contextify dectxed
        expect(dectxed.length).toBe original.length + 1
        expect(ctxed.length).toBe dectxed.length - 1


    describe 'complement', ->

      it 'returns the opposite of original function (casting as bool)', ->
        mod2 = mod(2)
        isEven = complement(mod(2))
        isOdd = complement(isEven)

        expect(mod2 111).toBe 1
        expect(isEven 111).toBe false
        expect(isOdd 111).toBe true

        expect(mod2 222).toBe 0
        expect(isEven 222).toBe true
        expect(isOdd 222).toBe false


    describe 'flip', ->

      it 'creates a fn which calls the original with reversed arguments', ->
        fn = (a, b, c) -> [a, b, c].join '-'
        flipped = flip fn
        expect(flipped 'A', 'B', 'C').toBe 'C-B-A'


    describe 'juxt', ->

      it 'creates a fn which applies arguments to a set of functions', ->
        maths = juxt add(1), sub(1), mul(2)
        expect(maths 5).toEqual [ 6, 4, 10 ]

      it 'useful for mapping a list-iterable to a kv-iterable', ->
        records = [
          { id: 4, name: 'Mark' },
          { id: 5, name: 'Chris' },
          { id: 6, name: 'Dustin' }
        ]
        pullID = map juxt get('id'), id
        expect(
          object pullID records
        ).toEqual {
          4: { id: 4, name: 'Mark' },
          5: { id: 5, name: 'Chris' },
          6: { id: 6, name: 'Dustin' }
        }


    describe 'knit', ->

      it 'creates a fn which applies a tuple to a set of functions', ->
        incAndDec = knit add(1), add(-1)
        expect(incAndDec [ 10, 20 ]).toEqual [ 11, 19 ]

      it 'useful for describing maps of kv-iterables', ->
        negVals = map knit id, neg
        expect(
          object negVals { a: 1, b: 2, c: 3 }
        ).toEqual { a: -1, b: -2, c: -3 }


  describe 'memoization', ->

    it 'returns a function of the same arity', ->
      dashing = (a, b, c) -> [a,b,c].join '-'
      memoized = memo(dashing)
      expect(memoized.length).toBe dashing.length

    it 'memoizes a function based on arguments', ->
      dashing = jasmine.createSpy().andCallFake (a, b, c) -> [a,b,c].join '-'
      memoized = memo dashing

      expect(memoized 'A', 'B', 'C').toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

      dashing.reset()
      expect(memoized 'A', 'B', 'C').toEqual 'A-B-C'
      expect(dashing).not.toHaveBeenCalled()

      dashing.reset()
      expect(memoized 'C', 'B', 'A').toEqual 'C-B-A'
      expect(dashing).toHaveBeenCalledWith 'C', 'B', 'A'

      dashing.reset()
      expect(memoized 'C', 'B', 'A').toEqual 'C-B-A'
      expect(dashing).not.toHaveBeenCalled()

    it 'can be cleared', ->
      dashing = jasmine.createSpy().andCallFake (a, b, c) -> [a,b,c].join '-'
      memoized = memo dashing

      expect(memoized 'A', 'B', 'C').toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

      dashing.reset()
      expect(memoized 'A', 'B', 'C').toEqual 'A-B-C'
      expect(dashing).not.toHaveBeenCalled()

      clearMemo memoized

      dashing.reset()
      expect(memoized 'A', 'B', 'C').toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

    it 'can be detected as memoized', ->
      expect(isMemoized add).toBe false
      memoized = memo add
      expect(isMemoized memoized).toBe true

    it 'returns a curried function if given a curried function', ->
      spy = jasmine.createSpy().andCallFake add
      spyAdd = curry (a, b) -> spy a, b
      memoizedAdd = memo spyAdd
      expect(isCurried memoizedAdd).toBe true

      add1 = memoizedAdd 1
      expect(spy).not.toHaveBeenCalled()
      expect(add1 1).toBe 2
      expect(add1 1).toBe 2
      expect(add1 1).toBe 2
      expect(spy).toHaveBeenCalledWith 1, 1
      expect(spy.calls.length).toBe 1

      anotherAdd1 = memoizedAdd 1
      expect(anotherAdd1).not.toBe add1
      expect(anotherAdd1 1).toBe 2
      expect(anotherAdd1 1).toBe 2
      expect(anotherAdd1 1).toBe 2
      expect(spy.calls.length).toBe 1

    it 'is idempotent', ->
      memoized = memo add
      memoized2 = memo memoized
      expect(memoized2).toBe memoized


  describe 'iterables', ->

    describe 'iterable', ->

      it 'makes an iterable from a function', ->
        counter = iterable -> i = 0; -> { value: i++, done: false }
        i = iterator counter
        expect(i.next().value).toBe 0
        expect(i.next().value).toBe 1
        expect(i.next().value).toBe 2


    describe 'iterator', ->

      it 'is idempotent', ->
        i1 = iterator [1,2,3]
        i2 = iterator i1
        expect(i2).toBe i1

      it 'returns back raw iterators', ->
        x = 0
        i1 = { next: -> { value: x++, done: false } }
        i2 = iterator -> i1
        expect(i2).toBe i1

      it 'iterates over array', ->
        i = iterator [1,2,3]
        expect(i.next().value).toBe 1
        expect(i.next().value).toBe 2
        expect(i.next().value).toBe 3
        expect(i.next().value).toBe undefined

      it 'iterates an empty array', ->
        i = iterator []
        expect(i.next().value).toBe undefined

      it 'iterates over string', ->
        i = iterator 'ABC'
        expect(i.next().value).toBe 'A'
        expect(i.next().value).toBe 'B'
        expect(i.next().value).toBe 'C'
        expect(i.next().value).toBe undefined

      it 'iterates over object pairs', ->
        i = iterator { a: 1, b: 2, c: 3 }
        expect(i.next().value).toEqual ['a', 1]
        expect(i.next().value).toEqual ['b', 2]
        expect(i.next().value).toEqual ['c', 3]
        expect(i.next().value).toEqual undefined

      it 'iterates over functional iterator', ->
        i = iterator -> x = 10; -> { value: x++, done: false }
        expect(i.next().value).toEqual 10
        expect(i.next().value).toEqual 11
        expect(i.next().value).toEqual 12

      it 'iterates over object iterator', ->
        i = iterator -> x = 100; { next: -> { value: x++, done: false } }
        expect(i.next().value).toEqual 100
        expect(i.next().value).toEqual 101
        expect(i.next().value).toEqual 102


    describe 'isIterable', ->

      it 'returns true for iterable things', ->
        expect(isIterable [ 1, 2, 3 ]).toBe true

      it 'returns false for not iterable things', ->
        expect(isIterable null).toBe false
        expect(isIterable { a: 1, b: 2, c: 3}).toBe false

      it 'returns true for anything passed to iterable', ->
        expect(isIterable iterable null).toBe true
        expect(isIterable iterable { a: 1, b: 2, c: 3}).toBe true


    describe 'reify', ->

      it 'can produce an array', ->
        i = iterator 'ABC'
        a = array i
        expect(a).toEqual [ 'A', 'B', 'C' ]

      it 'can produce an object', ->
        i = iterator [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
        o = object i
        expect(o).toEqual { a: 1, b: 2, c: 3 }

      it 'can produce a string', ->
        i = iterator [ 1, 2, 3 ]
        s = string i
        expect(s).toEqual '123'

      describe 'doall', ->

        it 'produces side effects', ->
          sideEffect = jasmine.createSpy()
          i = iterator [ 1, 2, 3 ]
          doall sideEffect, i
          expect(sideEffect).toHaveBeenCalledWith 1
          expect(sideEffect).toHaveBeenCalledWith 2
          expect(sideEffect).toHaveBeenCalledWith 3

        it 'is curried', ->
          sideEffect = jasmine.createSpy()
          doAllSideEffect = doall sideEffect
          expect(sideEffect).not.toHaveBeenCalled()

          doAllSideEffect [ 1, 2, 3 ]
          expect(sideEffect).toHaveBeenCalledWith 1
          expect(sideEffect).toHaveBeenCalledWith 2
          expect(sideEffect).toHaveBeenCalledWith 3


  describe 'iterable computations', ->

    describe 'isEmpty', ->

      it 'is true for falsey values', ->
        expect(isEmpty false).toBe true
        expect(isEmpty null).toBe true
        expect(isEmpty undefined).toBe true

      it 'is true for empty array', ->
        expect(isEmpty []).toBe true
        expect(isEmpty [ 1, 2, 3 ]).toBe false

      it 'is true for empty objects', ->
        expect(isEmpty {}).toBe true
        expect(isEmpty { a: 1, b: 2, c: 3 }).toBe false

      it 'is true for empty strings', ->
        expect(isEmpty '').toBe true
        expect(isEmpty 'ABC').toBe false

      it 'is true for empty arguments objects', ->
        noArgs = (a, b, c) -> expect(isEmpty arguments).toBe true
        noArgs()
        withArgs = (a, b, c) -> expect(isEmpty arguments).toBe false
        withArgs(1, 2, 3)


    describe 'count', ->

      it 'counts falsey values', ->
        expect(count false).toBe 0
        expect(count null).toBe 0
        expect(count undefined).toBe 0

      it 'counts arrays', ->
        expect(count []).toBe 0
        expect(count [ 1, 2, 3 ]).toBe 3

      it 'counts objects', ->
        expect(count {}).toBe 0
        expect(count { a: 1, b: 2, c: 3 }).toBe 3

      it 'counts strings', ->
        expect(count '').toBe 0
        expect(count 'ABC').toBe 3

      it 'counts arguments objects', ->
        noArgs = (a, b, c) -> expect(count arguments).toBe 0
        noArgs()
        withArgs = (a, b, c) -> expect(count arguments).toBe 3
        withArgs(1, 2, 3)


    describe 'take', ->

      it 'takes a set number of elements from an iterator', ->
        i = iterator -> x = 0; -> { value: x++, done: false }
        five = take 5, i
        expect(array five).toEqual [ 0, 1, 2, 3, 4 ]

      it 'is curried', ->
        i = iterator -> x = 0; -> { value: x++, done: false }
        takeFive = take 5
        expect(array takeFive i).toEqual [ 0, 1, 2, 3, 4 ]


    describe 'filter', ->

      it 'uses a predicate to create a new lazy iterable', ->
        filtered = filter gt(10), [ 1, 5, 10, 15, 3, 8, 13, 18 ]
        expect(filtered.length).toBe undefined
        expect(array filtered).toEqual [ 15, 13, 18 ]

      it 'can be curried', ->
        filterBigNum = filter gt 10
        expect(array filterBigNum [ 5, 10, 15, 20 ]).toEqual [ 15, 20 ]


    describe 'map', ->

      # it 'mapx', ->
      #  expect(array mapx mul(2), [ 1, 2, 3, 4, 5 ]).toEqual [ 2, 4, 6, 8, 10 ]

      it 'uses a mapper to create a new lazy iterable', ->
        mapped = map mul(2), [ 1, 2, 3, 4, 5 ]
        expect(mapped.length).toBe undefined
        expect(array mapped).toEqual [ 2, 4, 6, 8, 10 ]

      it 'can be curried', ->
        mapDouble = map mul 2
        expect(array mapDouble [ 1, 2, 3, 4, 5 ]).toEqual [ 2, 4, 6, 8, 10 ]

      it 'can map multiple input iterables', ->
        mapped = map add,
          [ 1, 2, 3, 4, 5 ],
          [ 10, 20, 30, 40, 50 ],
          [ 100, 200, 300, 400, 500 ]
        expect(array mapped).toEqual [ 111, 222, 333, 444, 555 ]

      it 'result is length of shortest input', ->
        mapped = map add,
          [ 1, 2, 3, 4, 5 ],
          [ 10, 20, 30, 40 ],
          [ 100, 200, 300 ]
        expect(array mapped).toEqual [ 111, 222, 333 ]

      it 'maps objects as key-value tuples', ->
        mapUpperDouble = map ([ k, v ]) -> [ k.toUpperCase(), mul(2, v) ]
        expect(
          object mapUpperDouble { a: 1, b: 2, c: 3 }
        ).toEqual { A: 2, B: 4, C: 6 }


    describe 'zip', ->

      it 'combines multiple iterables, yielding a tuple for each', ->
        zipped = zip [ 'a', 'b', 'c' ], [ 1, 2, 3 ]
        expect(zipped.length).toBe undefined
        expect(array zipped).toEqual [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]

      it 'helps creating an object from a key and a value iterable', ->
        expect(
          object zip [ 'a', 'b', 'c' ], [ 1, 2, 3 ]
        ).toEqual { a: 1, b: 2, c: 3 }

      it 'can help flip dimensional arrays', ->
        matrix = [
          [ 1, 2, 3 ],
          [ 4, 5, 6 ],
          [ 7, 8, 9 ]
        ]
        flippedMatrix = array apply zip, matrix
        expect(flippedMatrix).toEqual [
          [ 1, 4, 7 ],
          [ 2, 5, 8 ],
          [ 3, 6, 9 ]
        ]
        flippedBack = array apply zip, flippedMatrix
        expect(flippedBack).toEqual matrix


    describe 'flatten', ->

      it 'iterates over a tree of iterables', ->
        expect(
          array flatten [ 1, [ 2, 3 ], [ [ 4 ], 5 ] ]
        ).toEqual [ 1, 2, 3, 4, 5 ]

      it 'does not flatten strings and objects', ->
        expect(
          array flatten [ 1, [ 2, '345' ], [ [ 6 ], { k1: 7, k2: 8 } ] ]
        ).toEqual [ 1, 2, '345', 6, { k1: 7, k2: 8 } ]

      it 'flattens iterators of strings and objects', ->
        expect(
          array flatten [
            1, [ 2, iterable('345') ],
            [ [ 6 ], iterable({ k1: 7, k2: 8 }) ]
          ]
        ).toEqual [ 1, 2, '3', '4', '5', 6, 'k1', 7, 'k2', 8 ]


    describe 'memoIterable', ->

      it 'caches an iterable', ->
        spyInc = jasmine.createSpy().andCallFake add 1
        oneUp = map spyInc, [ 1, 2, 3, 4, 5 ]

        expect(array oneUp).toEqual [ 2, 3, 4, 5, 6 ]
        expect(spyInc.calls.length).toBe 5
        expect(string oneUp).toEqual '23456'
        expect(spyInc.calls.length).toBe 10

        spyInc.reset()

        memoOneUp = memoIterable oneUp
        expect(array memoOneUp).toEqual [ 2, 3, 4, 5, 6 ]
        expect(spyInc.calls.length).toBe 5
        expect(string memoOneUp).toEqual '23456'
        expect(spyInc.calls.length).toBe 5

      it 'handles a race', ->
        spyInc = jasmine.createSpy().andCallFake add 1
        memoOneUp = memoIterable map spyInc, [ 0, 1, 2 ]

        i1 = iterator memoOneUp
        i2 = iterator memoOneUp
        expect(spyInc.calls.length).toBe 0

        expect(i1.next().value).toBe 1
        expect(spyInc.calls.length).toBe 1

        expect(i2.next().value).toBe 1
        expect(spyInc.calls.length).toBe 1

        expect(i2.next().value).toBe 2
        expect(spyInc.calls.length).toBe 2

        expect(i1.next().value).toBe 2
        expect(spyInc.calls.length).toBe 2

        expect(i1.next().value).toBe 3
        expect(spyInc.calls.length).toBe 3

        expect(i2.next().value).toBe 3
        expect(spyInc.calls.length).toBe 3

        expect(i2.next().value).toBe undefined
        expect(spyInc.calls.length).toBe 3

        expect(i1.next().value).toBe undefined
        expect(spyInc.calls.length).toBe 3


    describe 'join', ->

      it 'joins an iterable by a string into a larger string', ->
        expect(join '-', [ 1, 2, 3]).toBe '1-2-3'

      it 'is curried', ->
        dashing = join '-'
        expect(dashing [ 1, 2, 3]).toBe '1-2-3'


    describe 'reduce', ->

      it 'uses a reducer to reduce an iterable to a single value', ->
        reduced = reduce add, [ 1, 2, 3, 4, 5 ]
        expect(reduced).toBe 15

      it 'can use a starting value', ->
        reduced = reduce add, 100, [ 1, 2, 3, 4, 5 ]
        expect(reduced).toBe 115

      it 'returns undefined for empty iterable, not calling function', ->
        addSpy = jasmine.createSpy().andCallFake(add)
        reduced = reduce addSpy, []
        expect(reduced).toBe undefined
        expect(addSpy).not.toHaveBeenCalled()

      it 'returns first value for singleton iterable, not calling function', ->
        addSpy = jasmine.createSpy().andCallFake(add)
        reduced = reduce addSpy, [1]
        expect(reduced).toBe 1
        expect(addSpy).not.toHaveBeenCalled()

      it 'returns starting value for empty iterable, not calling function', ->
        addSpy = jasmine.createSpy().andCallFake(add)
        reduced = reduce addSpy, 100, []
        expect(reduced).toBe 100
        expect(addSpy).not.toHaveBeenCalled()

      it 'can be curried', ->
        sum = reduce add
        expect(sum [ 1, 2, 3, 4, 5 ]).toEqual 15

      it 'can short-circuit by returning reduced', ->
        sumUpTo11 = reduce (x, y) -> if x + y < 11 then x + y else reduced x
        expect(sumUpTo11 [ 1, 2, 3, 4, 5 ]).toEqual 10


    describe 'compare', ->

      it 'uses a comparator to compare all pairs in an iterable', ->
        expect(compare lteq, [ 1, 1, 3, 4, 4 ]).toBe true
        expect(compare lt, [ 1, 1, 3, 4, 4 ]).toBe false

      it 'can be curried', ->
        isAscending = compare lteq
        expect(isAscending [ 1, 1, 3, 4, 4 ]).toEqual true
        expect(isAscending [ 1, 2, 3, 2, 1 ]).toEqual false

      it 'short-circuits on false', ->
        lteqSpy = jasmine.createSpy().andCallFake(lteq)
        isAscending = compare lteqSpy
        expect(isAscending [ 1, 2, 3, 2, 1 ]).toEqual false
        expect(lteqSpy.calls.length).toBe 3


    describe 'every', ->

      it 'ensures a predicate is true for all values in the iterable', ->
        isOdd = mod 2
        expect(every isOdd, [ 1, 3, 5, 7, 9 ]).toBe true
        expect(every isOdd, [ 1, 2, 3, 4, 5 ]).toBe false

      it 'can be curried', ->
        allOdd = every mod 2
        expect(allOdd [ 1, 3, 5, 7, 9 ]).toBe true
        expect(allOdd [ 1, 2, 3, 4, 5 ]).toBe false

      it 'can evaluate multiple iterables', ->
        shallowEq = every eq
        expect(shallowEq [ 1, 2, 3 ], [ 1, 2, 3 ], [ 1, 2, 3 ]).toBe true
        expect(shallowEq [ 1, 2, 3 ], [ 3, 2, 1 ]).toBe false

      it 'short-circuits on false', ->
        eqSpy = jasmine.createSpy().andCallFake(eq)
        shallowEq = every eqSpy
        expect(shallowEq [ 1, 2, 3 ], [ 1, 4, 9 ]).toBe false
        expect(eqSpy.calls.length).toBe 2


    describe 'some', ->

      it 'ensures a predicate is true for some values in the iterable', ->
        isOdd = mod 2
        expect(some isOdd, [ 0, 2, 4, 6, 8 ]).toBe false
        expect(some isOdd, [ 1, 2, 3, 4, 5 ]).toBe true

      it 'can be curried', ->
        anyOdd = some mod 2
        expect(anyOdd [ 0, 2, 4, 6, 8 ]).toBe false
        expect(anyOdd [ 1, 2, 3, 4, 5 ]).toBe true

      it 'can evaluate multiple iterables', ->
        notCompletelyUnEq = some eq
        expect(notCompletelyUnEq [ 1, 2, 3 ], [ 1, 2, 3 ], [ 1, 2, 3]).toBe true
        expect(notCompletelyUnEq [ 1, 2, 3 ], [ 3, 2, 1 ]).toBe true
        expect(notCompletelyUnEq [ 1, 2, 3 ], [ 2, 3, 4 ]).toBe false

      it 'short-circuits on true', ->
        eqSpy = jasmine.createSpy().andCallFake(eq)
        anyEq = some eqSpy
        expect(anyEq [ 3, 2, 1 ], [ 1, 2, 3 ]).toBe true
        expect(eqSpy.calls.length).toBe 2


  describe 'Argument Computations', ->

    describe 'id', ->

      it 'returns the first argument', ->
        x = {}
        y = {}
        expect(id x).toBe x
        expect(id x, y).toBe x


    describe 'tuple', ->

      it 'returns an array of the arguments provided', ->
        expect(tuple 1, 2, 3).toEqual [ 1, 2, 3 ]


    describe 'pipe', ->

      it 'applies the held arguments to a provided function', ->
        pipe123 = pipe 1, 2, 3
        expect(pipe123 add).toBe 6
        expect(pipe123 sub).toBe -4

      it 'can make something that looks like chain', ->
        counter = iterable -> i = 0; -> { value: i++, done: false }
        isEven = complement mod 2
        result = pipe(counter)(
          filter(isEven),
          take(3),
          map(add 3),
          array
        )
        expect(result).toEqual [ 3, 5, 7 ]

      it 'like chain, but not limited to iterable things', ->
        pipe123 = pipe 1, 2, 3
        expect(pipe123 add, mul(2), add(1)).toBe 13


  describe 'Indexed', ->

    it 'gets an index from an array', ->
      expect(get 1, [ 'A', 'B', 'C' ]).toBe 'B'

    it 'gets a char from a string', ->
      expect(get 1, 'ABC').toBe 'B'

    it 'gets a key from an object', ->
      expect(get 'b', { a: 0, b: 1, c: 2 }).toBe 1

    it 'is curried', ->
      first = get 0
      expect(first 'ABC').toBe 'A'


  describe 'Maths', ->

    it 'has curried methods', ->
      expect(add(2)(3)).toEqual 5
      expect(sub(2)(3)).toEqual 1
      expect(mul(2)(3)).toEqual 6
      expect(div(2)(3)).toEqual 3/2
      expect(mod(2)(3)).toEqual 1
      expect(pow(2)(3)).toEqual 9
      expect(max(2)(3)).toEqual 3
      expect(min(2)(3)).toEqual 2

    it 'neg is not curried, returns negative number', ->
      expect(neg(2)).toEqual -2

    it 'adds numbers', ->
      expect(add 1,2).toEqual 3
      expect(add 1,2,3).toEqual 6
      expect(add 1,2,3,4).toEqual 10
      expect(add 1,2,3,4,5).toEqual 15

    it 'adds strings', ->
      expect(add 'A','B').toEqual 'AB'
      expect(add 'A','B','C').toEqual 'ABC'
      expect(add 'A','B','C','D').toEqual 'ABCD'
      expect(add 'A','B','C','D','E').toEqual 'ABCDE'

    it 'subtracts numbers', ->
      expect(sub 1,2).toEqual -1
      expect(sub 1,2,3).toEqual -4
      expect(sub 1,2,3,4).toEqual -8
      expect(sub 1,2,3,4,5).toEqual -13

    it 'multiplies numbers', ->
      expect(mul 1,2).toEqual 2
      expect(mul 1,2,3).toEqual 6
      expect(mul 1,2,3,4).toEqual 24
      expect(mul 1,2,3,4,5).toEqual 120

    it 'divides numbers', ->
      expect(div 1,2).toEqual 1/2
      expect(div 1,2,3).toEqual 1/6
      expect(div 1,2,3,4).toEqual 1/24
      expect(div 1,2,3,4,5).toEqual 1/120

    it 'mods numbers', ->
      expect(mod 9973,1301).toEqual 866
      expect(mod 9973,1301,131).toEqual 80
      expect(mod 9973,1301,131,37).toEqual 6
      expect(mod 9973,1301,131,37,3).toEqual 0

    it 'raises numbers to power', ->
      expect(pow 2,3).toEqual 8
      expect(pow 2,3,4).toEqual 4096
      expect(pow 2,3,4,5).toEqual 1.152921504606847e+18
      expect(pow 2,3,4,5,6).toEqual 2.3485425827738332e+108

    it 'finds maximum of all numbers', ->
      expect(max 1,2).toEqual 2
      expect(max 1,2,3).toEqual 3
      expect(max 1,2,3,4).toEqual 4
      expect(max 1,2,3,4,5).toEqual 5

    it 'finds minimum of all numbers', ->
      expect(min 1,2).toEqual 1
      expect(min 1,2,3).toEqual 1
      expect(min 1,2,3,4).toEqual 1
      expect(min 1,2,3,4,5).toEqual 1


  describe 'Comparators', ->

    it 'has curried methods', ->
      expect(eq(1)(2)).toBe false
      expect(lt(1)(2)).toBe false
      expect(lteq(1)(2)).toBe false
      expect(gt(1)(2)).toBe true
      expect(gteq(1)(2)).toBe true

    it 'compares equality', ->
      expect(eq 1, 1).toBe true
      expect(eq 1, 1, 1).toBe true
      expect(eq 1, 1, 1, 1).toBe true

    it 'uses fantasy land equality spec', ->
      class FantasySpec
        constructor: (@value) ->
        equals: (other) -> @value == other.value
      f1 = new FantasySpec 3
      f2 = new FantasySpec 3
      f3 = new FantasySpec 3
      expect(f1 == f2).toBe false
      expect(eq f1, f2, f3).toBe true

    it 'compares less than (increasing args)', ->
      expect(lt 1, 2).toBe true
      expect(lt 1, 2, 3).toBe true
      expect(lt 1, 2, 3, 2).toBe false
      expect(lt 1, 2, 3, 3).toBe false
      expect(lt 1, 2, 3, 4).toBe true

    it 'compares less than or equal (not decreasing args)', ->
      expect(lteq 1, 2).toBe true
      expect(lteq 1, 1).toBe true
      expect(lteq 1, 2, 2).toBe true
      expect(lteq 1, 2, 3, 2).toBe false
      expect(lteq 1, 2, 2, 3).toBe true

    it 'compares greater than (decreasing args)', ->
      expect(gt 2, 1).toBe true
      expect(gt 3, 2, 1).toBe true
      expect(gt 3, 2, 1, 2).toBe false
      expect(gt 3, 2, 1, 1).toBe false

    it 'compares greater than or equal (not increasing args)', ->
      expect(gteq 2, 1).toBe true
      expect(gteq 1, 1).toBe true
      expect(gteq 3, 2, 1).toBe true
      expect(gteq 3, 2, 1, 2).toBe false
      expect(gteq 3, 2, 1, 1).toBe true


  describe 'monads', ->

    describe 'Maybe', ->

      it 'can convert nullable to Maybe', ->
        some = Maybe 'abc'
        none = Maybe null
        expect(some instanceof Maybe.Value).toBe true
        expect(none instanceof Maybe.None).toBe true
        expect(some instanceof Maybe).toBe true
        expect(none instanceof Maybe).toBe true

      it 'Maybe.Value and Maybe.None can be called directly', ->
        some = Maybe.Value 'abc'
        none = Maybe.None
        expect(some instanceof Maybe.Value).toBe true
        expect(none instanceof Maybe.None).toBe true
        expect(some instanceof Maybe).toBe true
        expect(none instanceof Maybe).toBe true

      it 'can toString', ->
        some = Maybe.Value 'abc'
        none = Maybe.None
        expect('' + some).toBe 'Maybe.Value abc'
        expect('' + none).toBe 'Maybe.None'

      describe 'is', ->

        it 'checks if a Maybe is a Maybe.Value (has a value)', ->
          maybeValue = Maybe 'abc'
          maybeNone = Maybe null
          maybeError = Maybe new Error 'error object'
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'raw text error'

          expect(Maybe.is maybeValue).toBe true
          expect(Maybe.is maybeNone).toBe false
          expect(Maybe.is maybeError).toBe false
          expect(Maybe.is some).toBe true
          expect(Maybe.is none).toBe false
          expect(Maybe.is error).toBe false

          expect(maybeValue.is()).toBe true
          expect(maybeNone.is()).toBe false
          expect(maybeError.is()).toBe false
          expect(some.is()).toBe true
          expect(none.is()).toBe false
          expect(error.is()).toBe false

        it 'checks if a Maybe is a Maybe.Error (has an error)', ->
          maybeValue = Maybe 'abc'
          maybeNone = Maybe null
          maybeError = Maybe new Error 'error object'
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'raw text error'

          expect(Maybe.isError maybeValue).toBe false
          expect(Maybe.isError maybeNone).toBe false
          expect(Maybe.isError maybeError).toBe true
          expect(Maybe.isError some).toBe false
          expect(Maybe.isError none).toBe false
          expect(Maybe.isError error).toBe true

          expect(maybeValue.isError()).toBe false
          expect(maybeNone.isError()).toBe false
          expect(maybeError.isError()).toBe true
          expect(some.isError()).toBe false
          expect(none.isError()).toBe false
          expect(error.isError()).toBe true

      describe 'get', ->

        it 'returns the contained value or throws', ->
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'fatal'
          expect(Maybe.get some).toEqual 'abc'
          expect(some.get()).toEqual 'abc'
          expect(-> Maybe.get none).toThrow()
          expect(-> none.get()).toThrow()
          expect(-> Maybe.get error).toThrow()
          expect(-> error.get()).toThrow()

        it 'returns the contained error or throws', ->
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'fatal'
          expect(-> Maybe.getError some).toThrow()
          expect(-> some.getError()).toThrow()
          expect(-> Maybe.getError none).toThrow()
          expect(-> none.getError()).toThrow()
          expect(Maybe.getError error).toEqual 'fatal'
          expect(error.getError()).toEqual 'fatal'

      describe 'or', ->

        it 'returns a value', ->
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'fatal'
          expect(Maybe.or '123', some).toEqual 'abc'
          expect(some.or '123').toEqual 'abc'
          expect(Maybe.or '123', none).toEqual '123'
          expect(none.or '123').toEqual '123'
          expect(Maybe.or '123', error).toEqual '123'
          expect(error.or '123').toEqual '123'

        it 'is curried', ->
          or123 = Maybe.or '123'
          some = Maybe.Value 'abc'
          none = Maybe.None
          error = Maybe.Error 'fatal'
          expect(or123 some).toEqual 'abc'
          expect(or123 none).toEqual '123'
          expect(or123 error).toEqual '123'


      describe 'setoid', ->

        it 'has reflexivity', ->
          a = Maybe 1
          expect(eq a, a).toBe true
          expect(a.equals a).toBe true

        it 'has symmetry', ->
          a = Maybe 1
          b = Maybe 1
          expect(eq a, b).toBe(eq b, a)


      describe 'functor', ->

        it 'can be provided to lift', ->
          inc = add 1
          m1 = Maybe.Value 3
          expect(inc m1).not.toEqual 4
          m2 = lift inc, m1
          expect(Maybe.get m2).toBe 4

        it 'safely carries Maybe.None through calls', ->
          inc = lift add 1
          spy = jasmine.createSpy()
          m1 = Maybe.None
          m2 = inc m1
          m3 = lift spy, m2
          expect(spy).not.toHaveBeenCalled()
          expect(Maybe.is m3).toBe false

        it 'has identity', ->
          a = Maybe 1
          b = lift id, a
          expect(eq a, b).toBe true

        it 'has composition', ->
          a = Maybe 1
          f = add 1
          g = mul 2
          expect(eq(
            lift(((x) -> f(g(x))), a),
            lift(f, lift(g, a))
          )).toBe true

      describe 'apply', ->

        it 'applies a Maybe(fn) to a Maybe(val) to return a Maybe(result)', ->
          a = Maybe 1
          b = Maybe null
          c = Maybe new Error 'fatal'
          add3Maybe = Maybe add 3
          sumA = ap add3Maybe, a
          sumB = ap add3Maybe, b
          sumC = ap add3Maybe, c
          expect(Maybe.or 'nuthin', sumA).toBe 4
          expect(Maybe.or 'nuthin', sumB).toBe 'nuthin'
          expect(Maybe.or 'nuthin', sumC).toBe 'nuthin'
          expect(Maybe.isError sumC).toBe true

        it 'lift of a curried function results in a maybe function', ->
          a = Maybe 1
          b = Maybe 3
          c = Maybe null
          addAMaybe = lift add, a
          sumAB = ap addAMaybe, b
          expect(Maybe.or 'nuthin', sumAB).toBe 4
          sumAC = ap addAMaybe, c
          expect(Maybe.or 'nuthin', sumAC).toBe 'nuthin'
          addCMaybe = lift add, c
          sumCB = ap addCMaybe, b
          expect(addCMaybe).toBe Maybe.None
          expect(Maybe.or 'nuthin', sumCB).toBe 'nuthin'

        it 'has composition', ->
          s = Maybe add 3
          t = Maybe mul 3
          v = Maybe 10
          expect(eq(
            ap(ap(lift(((f) -> (g) -> (x) -> f(g(x))), s), t), v),
            ap(s, ap(t, v))
          )).toBe true

      describe 'applicative', ->

        it 'returns a new Maybe with the value', ->
          a = Maybe.None
          b = unit(a, 3)
          expect(Maybe.get b).toBe 3

        it 'has identity', ->
          a = Maybe
          v = Maybe 123
          expect(eq(
            ap(unit(a, id), v),
            v
          )).toBe true

        it 'has homomorphism', ->
          a = Maybe
          f = add 2
          x = 1
          expect(eq(
            ap(unit(a, f), unit(a, x)),
            unit(a, f x)
          )).toBe true

        it 'has interchange', ->
          a = Maybe
          u = Maybe mul 2
          x = 1
          expect(eq(
            ap(u, unit(a, x)),
            ap(unit(a, (f) -> f x), u)
          )).toBe true

      describe 'chain / chain', ->

        it 'can call a function which returns another maybe', ->
          toInt = (x) ->
            n = parseInt x
            unless isNaN(n) then Maybe n else Maybe.None
          expect(Maybe.or 'nothin', chain toInt, Maybe '123').toBe 123
          expect(Maybe.or 'nothin', chain toInt, Maybe 'abc').toBe 'nothin'
          expect(Maybe.or 'nothin', chain toInt, Maybe.None).toBe 'nothin'

        it 'can chain chains', ->
          doubleOrDie = (x) -> Maybe( x * 2 if x < 8 )
          expect(Maybe.or 'die',
            chain(doubleOrDie, Maybe 1)
          ).toBe 2
          expect(Maybe.or 'die',
            chain(doubleOrDie, chain(doubleOrDie, chain(doubleOrDie, Maybe 1)))
          ).toBe 8
          expect(Maybe.or 'die',
            chain(doubleOrDie,
              chain(doubleOrDie,
                chain(doubleOrDie,
                  chain(doubleOrDie, Maybe 1))))
          ).toBe 'die'

        it 'can chain chains using pipe', ->
          doubleOrDie = (x) -> Maybe( x * 2 if x < 8 )
          pipeMaybe1 = pipe Maybe 1
          expect(Maybe.or 'die',
            pipeMaybe1 chain(doubleOrDie)
          ).toBe 2
          expect(Maybe.or 'die',
            pipeMaybe1(
              chain(doubleOrDie),
              chain(doubleOrDie),
              chain(doubleOrDie)
            )
          ).toBe 8
          expect(Maybe.or 'die',
            pipeMaybe1(
              chain(doubleOrDie),
              chain(doubleOrDie),
              chain(doubleOrDie),
              chain(doubleOrDie)
            )
          ).toBe 'die'

        it 'has associativity', ->
          f = (x) -> Maybe( x * 2 if x < 8 )
          g = (x) -> Maybe( x - 10 if x > 10 )
          m = Maybe 3
          expect(eq(
            chain(g, chain(f, m)),
            chain(((x) -> chain(g, f(x))), m)
          )).toBe true

      describe 'monad', ->

        it 'has left identity', ->
          m = Maybe
          f = (x) -> Maybe x + 1
          a = 3
          expect(eq(
            chain(f, unit(m, a)),
            f(a)
          )).toBe true

        it 'has right identity', ->
          m = Maybe 3
          expect(eq(
            chain(unit(m), m),
            m
          )).toBe true


    describe 'Promise', ->

# p = new Promise(function (uh, oh) {oh('crap')})
# Promise {[[PromiseStatus]]: "rejected", [[PromiseValue]]: "crap"}
# lift(lift(function (x) { return x + x; }), p).then(function (x) {
#  console.log('got', x); }).catch(function (e) { console.log('error', e); })
# VM1771:2 error crap
# Promise {[[PromiseStatus]]: "pending", [[PromiseValue]]: undefined}


# q = new Promise(function (uh, oh) {uh('hi')})
# Promise {[[PromiseStatus]]: "resolved", [[PromiseValue]]: "hi"}
# r = lift(function (maybeFn) {
#  return ap(Maybe(3), maybeFn);}, lift(lift(add), q))
# Promise {[[PromiseStatus]]: "pending", [[PromiseValue]]: undefined}
# r.then(function(){console.log('yes', arguments);},
#   function(e){console.log('no', e, e.stack);})
# VM2197:2 yes ["hi3"]
# Promise {[[PromiseStatus]]: "pending", [[PromiseValue]]: undefined}




# reducer = function(a, b) { return makePromise(function(resolve) {
#  setTimeout(resolve, Math.random() * 1000, Maybe(a + b)); }) }
# reduceM(reducer, [1,2,3,4,5,6]).then(function(v) { console.log('yay!', v); })
# Promise {[[PromiseStatus]]: "pending", [[PromiseValue]]: undefined}
# loda.js:1094 resolved Maybe.Value 3
# loda.js:1094 resolved Maybe.Value 6
# loda.js:1094 resolved Maybe.Value 10
# loda.js:1094 resolved Maybe.Value 15
# loda.js:1094 resolved Maybe.Value 21
# VM170:2 yay! 21

# reduceM(reducer, [1,2,3,NaN,5,6]).then(function(v) {
#  console.log('yay!', v); }, function(e) { console.log('shit', e);})
#  resolved Maybe.Value 3
# loda.js:1094 resolved Maybe.Value 6
# loda.js:1094 resolved Maybe.None
# VM187:2 shit Error {stack: (...)}
