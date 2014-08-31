require('jasmine-check').install()

describe 'loda', ->

  loda = require('../')
  loda.install global

  it 'was installed', ->
    expect(curry).toBe loda.curry


  describe 'Function manipulation', ->

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


    describe 'call', ->

      it 'uses the last argument as this', ->
        thisArg = {}
        spy = jasmine.createSpy()
        call spy, 1, 2, 3, thisArg
        expect(spy).toHaveBeenCalledWith 1, 2, 3
        expect(spy.mostRecentCall.object).toBe thisArg


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


    describe 'unbinding', ->

      it 'can functionize a method', ->
        slice = `functionize(Array.prototype.slice)`
        expect(slice [ 1, 2, 3, 4 ]).toEqual [ 1, 2, 3, 4 ]
        expect(slice 2, [ 1, 2, 3, 4 ]).toEqual [ 3, 4 ]
        expect(slice 1, -1, [ 1, 2, 3, 4 ]).toEqual [ 2, 3 ]

      it 'can methodize a function', ->
        tandemBike = { type: 'Tandem' }
        getBikeType = (bike) -> bike.type
        expect(getBikeType tandemBike).toBe 'Tandem'
        tandemBike.getType = methodize getBikeType
        expect(tandemBike.getType()).toBe 'Tandem'

      it 'returns a function of the correct arity', ->
        original = Array.prototype.slice
        func_ed = `functionize(original)`
        meth_ed = methodize func_ed
        expect(func_ed.length).toBe original.length + 1
        expect(meth_ed.length).toBe func_ed.length - 1


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



  describe 'Memoization', ->

    it 'returns a function of the same arity', ->
      dashing = (a, b, c) -> [a,b,c].join '-'
      memoized = memo(dashing)
      expect(memoized.length).toBe dashing.length

    it 'memoizes a function based on arguments', ->
      dashing = jasmine.createSpy().andCallFake (a, b, c) -> [a,b,c].join '-'
      memoized = memo(dashing)

      expect(memoized('A', 'B', 'C')).toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

      dashing.reset()
      expect(memoized('A', 'B', 'C')).toEqual 'A-B-C'
      expect(dashing).not.toHaveBeenCalled

      dashing.reset()
      expect(memoized('C', 'B', 'A')).toEqual 'C-B-A'
      expect(dashing).toHaveBeenCalledWith 'C', 'B', 'A'

      dashing.reset()
      expect(memoized('C', 'B', 'A')).toEqual 'C-B-A'
      expect(dashing).not.toHaveBeenCalled

    it 'can be cleared', ->
      dashing = jasmine.createSpy().andCallFake (a, b, c) -> [a,b,c].join '-'
      memoized = memo(dashing)

      expect(memoized('A', 'B', 'C')).toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

      dashing.reset()
      expect(memoized('A', 'B', 'C')).toEqual 'A-B-C'
      expect(dashing).not.toHaveBeenCalled

      clearMemo(memoized)

      dashing.reset()
      expect(memoized('A', 'B', 'C')).toEqual 'A-B-C'
      expect(dashing).toHaveBeenCalledWith 'A', 'B', 'C'

    it 'can be detected as memoized', ->
      expect(isMemoized add).toBe false
      memoized = memo add
      expect(isMemoized memoized).toBe true

    it 'returns a curried function if given a curried function', ->
      spy = jasmine.createSpy()
      spyAdd = curry(
        () -> spy.apply(null, arguments); add.apply(null, arguments),
        2
      )
      memoized = memo(spyAdd)
      expect(isCurried memoized).toBe true

      add1 = spyAdd(1)
      expect(spy).not.toHaveBeenCalled
      expect(add1 1).toBe 2
      expect(spy).toHaveBeenCalledWith 1, 1

      spy.reset()
      anotherAdd1 = spyAdd(1)
      expect(anotherAdd1).not.toBe add1
      expect(spy).not.toHaveBeenCalled
      expect(add1 1).toBe 2
      expect(spy).not.toHaveBeenCalled


  describe 'Iterables', ->

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


    describe 'reify', ->

      it 'can produce an array', ->
        mapSq = map (x) -> x * x
        m = mapSq [1,2,3]
        a = array m
        expect(a).toEqual [1,4,9]

      it 'can produce an object', ->
        mapUpperSq = map ([k, v]) -> [k.toUpperCase(), v * v]
        m = mapUpperSq { a: 1, b: 2, c: 3 }
        o = object m
        expect(o).toEqual { A: 1, B: 4, C: 9 }

      it 'can produce a string', ->
        mapSq = map (x) -> x * x
        m = mapSq [1,2,3]
        s = string m
        expect(s).toEqual '149'

      it 'can produce side effects', ->
        sideEffect = jasmine.createSpy()
        mapSq = map (x) -> x * x
        m = mapSq [1,2,3]
        doall m, sideEffect
        expect(sideEffect).toHaveBeenCalledWith 1
        expect(sideEffect).toHaveBeenCalledWith 4
        expect(sideEffect).toHaveBeenCalledWith 9

      it 'can force side effects', ->
        sideEffect = jasmine.createSpy()
        mapSqWithSideEffect = map (x) -> sideEffect x; x * x
        m = mapSqWithSideEffect [1,2,3]
        expect(sideEffect).not.toHaveBeenCalled
        doall m
        expect(sideEffect).toHaveBeenCalledWith 1
        expect(sideEffect).toHaveBeenCalledWith 2
        expect(sideEffect).toHaveBeenCalledWith 3


  describe 'Iterable Computations', ->

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


    describe 'filter', ->

      it 'uses a predicate to create a new lazy iterable', ->
        filtered = filter gt(10), [ 1, 5, 10, 15, 3, 8, 13, 18 ]
        expect(filtered.length).toBe undefined
        expect(array filtered).toEqual [ 15, 13, 18 ]

      it 'can be curried', ->
        filterBigNum = filter gt 10
        expect(array filterBigNum [ 5, 10, 15, 20 ]).toEqual [ 15, 20 ]


    describe 'map', ->

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

      it 'maps objects as key-value tuples', ->
        mapUpperDouble = map ([ k, v ]) -> [ k.toUpperCase(), mul(2, v) ]
        expect(
          object mapUpperDouble { a: 1, b: 2, c: 3 }
        ).toEqual { A: 2, B: 4, C: 6 }


    describe 'zip', ->


    describe 'reduce', ->


    describe 'reduced', ->


    describe 'compare', ->


  describe 'Argument Computations', ->


  describe 'Array Helpers', ->


  describe 'Math', ->

    it 'has curried methods', ->
      expect(add(2)(3)).toEqual 5
      expect(sub(2)(3)).toEqual 1
      expect(mul(2)(3)).toEqual 6
      expect(div(2)(3)).toEqual 3/2
      expect(mod(2)(3)).toEqual 1
      expect(pow(2)(3)).toEqual 9
      expect(max(2)(3)).toEqual 3
      expect(min(2)(3)).toEqual 2

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
