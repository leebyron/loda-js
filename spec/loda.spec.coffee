require('jasmine-check').install();

describe 'loda', ->

  loda = require('../loda');
  loda.install global

  it 'was installed', ->
    expect(curry).toBe loda.curry

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

  describe 'math', ->

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
      expect(add(1,2)).toEqual 3
      expect(add(1,2,3)).toEqual 6
      expect(add(1,2,3,4)).toEqual 10
      expect(add(1,2,3,4,5)).toEqual 15

    it 'subtracts numbers', ->
      expect(sub(1,2)).toEqual -1
      expect(sub(1,2,3)).toEqual -4
      expect(sub(1,2,3,4)).toEqual -8
      expect(sub(1,2,3,4,5)).toEqual -13
