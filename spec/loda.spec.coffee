require('jasmine-check').install()

describe 'loda', ->

  loda = require('../loda')
  loda.install global

  it 'was installed', ->
    expect(curry).toBe loda.curry


  describe 'Function manipulation', ->


  describe 'Memoization', ->


  describe 'Iterables', ->

    describe 'iterable', ->


    describe 'iterator', ->

      it 'is idempotent', ->
        i1 = iterator [1,2,3]
        i2 = iterator i1
        expect(i2).toBe i1

      it 'iterates over array', ->
        i = iterator [1,2,3]
        expect(i.next().value).toBe 1
        expect(i.next().value).toBe 2
        expect(i.next().value).toBe 3
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

  describe 'Argument Computations', ->

  describe 'Array Helpers', ->


  describe 'Math', ->

    it 'has curried methods', ->
      expect(add(2)(3)).toEqual 5
      expect(sub(2)(3)).toEqual -1
      expect(mul(2)(3)).toEqual 6
      expect(div(2)(3)).toEqual 2/3
      expect(mod(2)(3)).toEqual 2
      expect(pow(2)(3)).toEqual 8
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
      expect(lt(1)(2)).toBe true
      expect(lteq(1)(2)).toBe true
      expect(gt(1)(2)).toBe false
      expect(gteq(1)(2)).toBe false

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
