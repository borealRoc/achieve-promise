# 手写 Promise：完美通过 Promises/A+ 官方 872 个测试用例

## 一、定义 Promise 的初始结构

1. 它是一个类，并有一个函数参数：`class _promise {constructor(fn) {}}`
2. 在 new 一个 promise 实例时，会立即执行该函数：`fn(resolve, reject)`
3. 在执行时把该函数的两个回调函数参数赋值为自己实现的方法，并注意 this 的绑定：`fn(this.resolve.bind(this), this.reject.bind(this))`
4. Promise 有三种状态：`pendding`, `fulfilled`, `rejected` 以及两个重要属性：`PromiseState` && `PromiseResult`
5. 当最后执行 `resolve(value)` 时：`PromiseState === 'fulfilled' && PromiseResult === value`
6. 当最后执行 `reject(reason)` 时：`PromiseState === 'rejected' && PromiseResult === reason`
7. 若执行 fn 时报错：`PromiseState === 'rejected' && PromiseResult === error`
8. promise 的最终状态只能是 fulfilled || rejected 的一种

## 二、实现 then

### 1. then 的基础语法：`then(onFulfilled, onRejected)`

- 如果 promise 的最终状态是 fulfilled，则把 PromiseResult 传给 then 方法的第一个回调函数并执行：`onFulfilled(this.PromiseResult)`
- 如果 promise 的最终状态是 rejected, 则把 PromiseResult 传给 then 方法的第二个回调函数并执行：`onRejected(this.PromiseResult)`

### 2. 实现 then 的异步调用

- 确保 then 在整体代码中是异步的，给 onFulfilled 和 onRejected 包裹 setTimeout: `setTimeout(() => onFulfilled(this.PromiseResult)) && setTimeout(() => onRejected(this.PromiseResult))`
- 如果 promise 实例的状态是异步的，要确保 then 在异步的 resolve || reject 之后执行
  - 首先，在执行 then 方法时，先将 then 回调函数进行保存：`this.onFulfilledCbs.push(onFulfilled) && this.onRejectedCbs.push(onRejected)`
  - 在实例方法 `resolve(value) && reject(reason)` 的最后，再从回调数组取出所有函数来执行：`this.onFulfilledCbs.forEach(cb=> cb(value)) && this.onRejectedCbs.forEach(cb=> cb(reason))`
- 在异步的 resolve || reject 内部，确保 then 要在最后执行，需要在上述保存 then 回调函数时，给回调函数包裹 setTimeout：`this.onFulfilledCbs.push(() => setTimeout(() => onFulfilled(this.PromiseResult))) && this.onRejectedCbs.push(() => setTimeout(() => onRejected(this.PromiseResult)))`

### 3. 实现 then 的链式调用 => then 方法返回一个新的 promise

```javascript
then(onFulfilled, onRejected) {
    const p2 = new Promise((res, rej) =>
    )
    return p2
}

```

- 3.1 如果 onFulfilled || onRejected 在执行时报错，则 p2 以 error 为拒因返回拒绝态：`rej(error)`
- 3.2 如果 onFulfilled || onRejected 不是函数，则 p2 返回和 p1 相同的结果和状态（then 的顺延）：`res(this.PromiseResult) && rej(this.PromiseResult)`
- 3.3 如果 onFulfilled || onRejected 返回一个值 x, 对 x 进行 promise 处理：`const x = onFulfilled(this.PromiseResult); resolvePromise(p2, x, res, rej)`

  - 3.3.1 如果 x 和 p2 指向同一个对象，则 p2 以 TypeError 为拒因返回拒绝态：`rej(new TypeError('Chaining cycle detected for promise'))`
  - 3.3.2 如果 x 是一个新的 promise，则 p2 的状态和结果等同于 x 的：`x.then(y=> resolvePromise(p2, y, res, rej), rej)`
  - 3.3.3 如果 x 是一个普通值，则 p2 以 x 为值返回完成态：`res(x)`
  - 3.3.4 如果 x 是对象或函数，把 x.then 赋值给 then：`let then = x.then`

    - (1) 如果 then 不是函数，则 p2 以 x 为值返回完成态：`res(x)`
    - (2) 如果 then 是函数，将 x 作为 then 的 this 的指向，并给 then 传递两个回调函数 `resolvePromise` && `rejectPromise`：`then.call(x, y=>, r=> {})`

      - 如果执行 then() 时报错：`try(then.call(...))catch(error) {rej(error)}`
        - 如果 `resolvePromise` || `rejectPromise` 已经执行过，则忽略：`if (called) return`
        - 如果 `resolvePromise` || `rejectPromise` 还没执行过，则 p2 以 error 为拒因返回拒绝态：`rej(error)`
      - 如果顺利执行 then()，且以 y 为值执行 resolvePromise 回调
        - 如果 `resolvePromise` || `rejectPromise` 已经执行过，则忽略：`if (called) return`
        - 如果 `resolvePromise` || `rejectPromise` 还没执行过，则 p2 以 y 为值返回完成态：`resolvePromise(p2, y, res, rej)`
      - 如果顺利执行 then()，且以 r 为值执行 rejectPromise 回调

        - 如果 `resolvePromise` || `rejectPromise` 已经执行过，则忽略：`if (called) return`
        - 如果 `resolvePromise` || `rejectPromise` 还没执行过，则 p2 以 r 为拒因返回拒绝态：`rej(r)`

        ```javascript
        try() {
            let called = false
            then.call(x, y => {
                if (called) return
                called = true
                resolvePromise(p2, y, res, rej)
            }, r => {
                if (called) return
                called = true
                rej(error)
            })

        } catch(error) {
            if (called) return
            called = true
            rej(error)
        }

        ```

## 三、定义 Promise 的常用方法 -- 都是返回一个新的 Promise

### 实例方法

1. ` catch(onRejected)`，当 promise 返回拒绝态时执行 onRejected，等同于调用：`this.then(undefined, onRejected)`
2. `finally(cb)`，不管 Promise 是状态是成功还是拒绝，都会执行 cb 回调, 等同于调用：`this.then(cb, cb)`

### 静态方法

1. `_Promise.resolve(value)` => `return new _Promise((res, rej) => {})`

- 如果 value 是一个 promise，返回 value：`return value`
- 如果 value 是一个 thenable 对象，跟随 value 的最终状态：`value.then(res, rej)`
- 如果 value 是一个 普通值，返回 以 value 为结果的成功态：`res(value)`

2. `_Promise.reject(value)` => `return new _Promise((res, rej) => {})`

- 直接返回以 value 为拒因的拒绝态：`rej(value)`

3. `_Promise.race(promises)` => `return new _Promise((res, rej) => {})`

- 如果 promises 不是数组，以 TypeError 为拒因返回拒绝态：`rej(new TypeError('Argument is not iterable'))`
- 如果 promises 是数组

  - 如果是空数组，则返回结果为 undefined 的 pendding 状态
  - 如果是非空数组，遍历该数组，对每一项进行 `_Promise.resolve` 解析，最先返回结果的那一项为最终的状态

  ```javascript
  promises.forEach((item) => {
    _Promise.resolve(item).then(res, rej);
  });
  ```

4. `_Promise.all(promises)` => `return new _Promise((res, rej) => {})`

- 如果 promises 不是数组，以 TypeError 为拒因返回拒绝态：`rej(new TypeError('Argument is not iterable'))`
- 如果 promises 是数组

  - 如果是空数组，则返回结果为 [] 的 fulfilled 状态：`return res([])`
  - 如果是非空数组，遍历该数组，对每一项进行 `_Promise.resolve` 解析

    - 先定义一个结果数组：`const result = []; let count = 0`
    - 如果该项解析成功，将成功的值先保存起来；如果失败，直接以失败原因返回拒绝态
    - 如果全部遍历完且每一项都是成功，则返回 result 数组为值的成功态

    ```javascript
    promises.forEach((item, index) => {
      _Promise.resolve(item, index).then(
        (x) => {
          count++;
          result[index] = x;
          count === promises.length && res(result);
        },
        (r) => {
          rej(r);
        }
      );
    });
    ```
