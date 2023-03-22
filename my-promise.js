// 一、定义 MyPromise 的初始结构
// 1. 一个 class
// 2. constructor(fn) 中的 参数 fn 是一个函数，在初始化 MyPromise 实例时会立即执行
// 3. fn(reolve, reject) 中的 reolve 和 reject 这两个参数赋值为实例的方法，并绑定好 this ：this.resolve.bint(this) 和 this.reject.bind(this)
// 4. MyPromise 有三种状态："pending", "fulfilled", "rejected", 以及两个重要的属性：PromiseState 和 PromiseResult
// 4.1 初始化 MyPromise 时，PromiseState === "pending", PromiseResult === null
// 4.2 当执行 resolve(result) 后，PromiseState === 'fulfilled', PromiseResult === result
// 4.3 当执行 rejected(reason) 后, PromiseState === 'rejected', PromiseResult === reason
// 4.4 如果 fn(reolve, reject) 在执行时抛出异常，PromiseState === 'rejected', PromiseResult === error
// 4.4 PromiseState 只能从 “pending” 变成 “fulfilled” || “rejected” 其中的一种

// 二、实现 then
// 1. then 方法的基本特性：then(onFulfilled, onRejected) 有两个参数，都是函数（如果不是函数就要被忽略）
// 1.1 如果 PromiseState 为fulfilled，执行 onFulfilled(PromiseResult)
// 1.2 如果 PromiseState 为 rejected，执行 onRejected(PromiseResult)
// 2. 实现 then 方法的异步功能
// 2.1 then 在整体代码中是异步微任务：then 回调使用 setTimeout 包裹
// 2.2 如果 resolve || reject 是异步的，要确保它之后的 PromiseState 能被 then 方法获取到，从而执行 then 方法：then回调保存，在 relove() 和 reject() 之后再取出来执行
// 2.3 确保 then 方法在异步的 resolve || reject 之后执行：所以 2.2 中 then 的回调保存使用 setTimeout 包裹
// 2.4 因为 then 方法可以多次调用，所以 2.2 中then回调保存要用数组保存
// 3. 实现 then 方法的链式调用 -- then返回的是一个新的promise：const promise2 = promise1.then(onFulfilled, onRejected) = new MyPromise((resolve, reject) => {})
// 3.1 如果 onFulfilled 或者 onRejected 抛出一个异常 e，则 promise2 拒绝执行，并返回拒因：promise2 = reject(e)
// 3.2 如果 onFulfilled 不是函数且 promise1 成功执行, 则 promise2 成功执行并返回和 promise1 相同的值（then的顺延）: promise2 = resolve(this.PromiseResult)
// 3.3 如果 onRejected 不是函数且 promise1 拒绝执行， 则 promise2 拒绝执行并返回相同的原因（then的顺延）: promise2 = reject(this.PromiseResult)
// 3.4 如果 onFulfilled 或者 onRejected 返回一个值 x，则将 x 进行 promise 化处理：promise2 = resolvePromise(promise, x, resolve, reject)
/**
 * @param  {promise} promise2 promise1.then方法返回的新的promise对象
 * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值 => x = onFulfilled(PromiseResult) || onRejected(PromiseResult)
 * @param  {[type]} resolve   promise2的resolve方法
 * @param  {[type]} reject    promise2的reject方法
 */
// （1）如果 x 和 promise2 和指向同一对象，以 TypeError 为据因拒绝执行 promise: reject(new TypeError(`Chaining cycle detected for promise`))
// （2）如果 x 为 Promise ，则 promise2 的状态取决于 x 的状态：x.then(y=>resolve(p2, y,resolve, reject), reject)
// （3）如果 x 不是函数或对象，则 promise2 最终都是执行态：resolve(x)
// （4）如果 x 是函数或对象
// (4)-1 把 x.then 赋值给 then: then = x.then
// (4)-2 如果取 then 的值时抛出错误 e，则 promise2 以 e 为拒因拒绝：reject(e)
// (4)-3 如果 then 不是函数，则以 x 为结果解决：resolve(x)
// (4)-4 如果 then 是函数：then 中的 this 指向 x，传递两个回调函数作为参数 resolvePromise 和 rejectPromise: then.call(x, y => resolvePromise, r => rejectPromise)
// - 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)：resolvePromise(y, p2, resolve, reject)
// - 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise：reject(r)
// - 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
// - 如果调用 then 方法抛出了异常 e：如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之；否则以 e 为据因拒绝 promise

// 三、MyPromise 的常用方法
// 1. 实例方法
// 1.1 catch(onRejected): 返回一个Promise，并且处理拒绝的情况, 等同于调用: this.then(undefined, onRejected)
// 1.2 finally(cb)：返回一个Promise，在promise结束时，无论结果是fulfilled或者是rejected，都会执行指定的回调函数，等同于调用: this.then(cb, cb)
// 2. 静态方法
// 2.1 resolve => Promise.resolve(value)：返回一个 promise
// - 如果 value 值是一个 promise ，那么返回 value, 即 p ==== value
// - 如果 value 值是 thenable（即带有"then" 方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态：return new Promise((res, rej)=>value.then(res, rej))
// - 如果 value 是普通值，则 p.PromiseState === 'fulFilled' && p.promiseResult === value
// 2.2 reject => Promise.reject(reason): 返回一个以 reason 为拒因的 promise
// - return new Promise((res, rej)=>rej(reason))
// 2.3 race => Promise.race(promises), promises参数是一个数组，返回一个新的 Promise
// - 如果 promises 不是数组，返回 TypeError 为原因的拒绝状态：reject(new TypeError("Argument is not iterable"))
// - 如果 promises 是空数组，则返回结果为 undefined 的 pendding 状态的 promise
// - 如果 promises 是数组, 解析每一项 promises.forEach(item => Promise.resolve(item).then(resolve, reject))
// - 谁先返回”成功“或”失败“的结果，则 pRace 的[[PromiseState]]为对应的状态， pRace 的 [[PromiseResult]] 为对应的值
// 2.4 all => Promise.all(promises), promises参数是一个数组，返回一个新的 Promise
// - 如果 promises 不是数组，返回 TypeError 为原因的拒绝状态: pAll = reject(new TypeError("Argument is not iterable"))
// -- 如果 promises 是空数组，则返回结果为 [] 的 fulFilled 状态的 promise
// - 如果 promises 为非空数组，遍历数组：promises.forEach(item, index)
// -- 如果 item 项是 promise || item 项是 thenable，解析该项：Promise.resolve(item).then(val=> {}, err=> {})
// -- 如果 item 项不是 promise, 则该项被认为是成功的，直接放进结果数组: result[index] = item
// --- 如果该项解析后的结果为 fulFilled, 则将该项的val添加进结果数组 result[index] = val
// --- 如果该项解析后的结果为 rejected , 以该项的拒因 err 为本次all的拒因 reject(err)
// - 遍历完 promises 数组后，如果所有子项都是成功，则 pAll 的[[PromiseState]] 为 fulFilled, pAll 的 [[PromiseResult]] 为结果数组 results

class _Promise {
  static PENDING = "pending";
  static FULFILLED = "fulFilled";
  static REJECTED = "rejected";

  constructor(fn) {
    this.PromiseState = _Promise.PENDING;
    this.PromiseResult = null;
    this.onFulfilledCbs = [];
    this.onRejectedCbs = [];

    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }
  resolve(result) {
    if (this.PromiseState === _Promise.PENDING) {
      this.PromiseState = _Promise.FULFILLED;
      this.PromiseResult = result;
      this.onFulfilledCbs.forEach((cb) => cb(result));
    }
  }
  reject(reason) {
    if (this.PromiseState === _Promise.PENDING) {
      this.PromiseState = _Promise.REJECTED;
      this.PromiseResult = reason;
      this.onRejectedCbs.forEach((cb) => cb(reason));
    }
  }

  then(onFulfilled, onRejected) {
    let p2 = new _Promise((resolve, reject) => {
      if (this.PromiseState === _Promise.FULFILLED) {
        setTimeout(() => {
          try {
            if (typeof onFulfilled === "function") {
              let x = onFulfilled(this.PromiseResult);
              resolvePromise(p2, x, resolve, reject);
            } else {
              resolve(this.PromiseResult);
            }
          } catch (error) {
            reject(error);
          }
        });
      }
      if (this.PromiseState === _Promise.REJECTED) {
        setTimeout(() => {
          try {
            if (typeof onRejected === "function") {
              let x = onRejected(this.PromiseResult);
              resolvePromise(p2, x, resolve, reject);
            } else {
              reject(this.PromiseResult);
            }
          } catch (error) {
            reject(error);
          }
        });
      }
      if (this.PromiseState === _Promise.PENDING) {
        this.onFulfilledCbs.push(() =>
          setTimeout(() => {
            try {
              if (typeof onFulfilled === "function") {
                let x = onFulfilled(this.PromiseResult);
                resolvePromise(p2, x, resolve, reject);
              } else {
                resolve(this.PromiseResult);
              }
            } catch (error) {
              reject(error);
            }
          })
        );
        this.onRejectedCbs.push(() =>
          setTimeout(() => {
            try {
              if (typeof onRejected === "function") {
                let x = onRejected(this.PromiseResult);
                resolvePromise(p2, x, resolve, reject);
              } else {
                reject(this.PromiseResult);
              }
            } catch (error) {
              reject(error);
            }
          })
        );
      }
    });

    return p2;
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }
  finally(cb) {
    return this.then(cb, cb);
  }

  static resolve(value) {
    if (value instanceof _Promise) {
      return value;
    }
    if (value instanceof Object && "then" in value) {
      return new _Promise((resolve, reject) => {
        value.then(resolve, reject);
      });
    }
    return new _Promise((resolve) => resolve(value));
  }
  static reject(reason) {
    return new _Promise((resolve, reject) => reject(reason));
  }
  static race(promises) {
    return new _Promise((resolve, reject) => {
      if (Array.isArray(promises)) {
        if (promises.length > 0) {
          promises.forEach((item) => {
            _Promise.resolve(item).then(resolve, reject);
          });
        }
      } else {
        reject(new TypeError(`Argument is not iterable`));
      }
    });
  }
  static all(promises) {
    return new _Promise((resolve, reject) => {
      if (Array.isArray(promises)) {
        let results = [],
          count = 0,
          len = promises.length;

        if (len === 0) {
          resolve(results);
        }

        promises.forEach((item, index) => {
          _Promise.resolve(item).then(
            (value) => {
              count++;
              results[index] = value;
              count === len && resolve(results);
            },
            (reason) => {
              reject(reason);
            }
          );
        });
      } else {
        reject(new TypeError(`Argument is not iterable`));
      }
    });
  }
}

function resolvePromise(p2, x, resolve, reject) {
  if (p2 === x) {
    throw new TypeError("Chaining cycle detected for promise");
  }
  if (x instanceof _Promise) {
    x.then((y) => resolvePromise(p2, y, resolve, reject), reject);
  } else if (x !== null && (typeof x === "function" || typeof x === "object")) {
    let then;
    try {
      then = x.then;
      if (typeof then === "function") {
        let called = false;
        try {
          then.call(
            x,
            (y) => {
              if (called) return;
              called = true;
              resolvePromise(p2, y, resolve, reject);
            },
            (r) => {
              if (called) return;
              called = true;
              reject(r);
            }
          );
        } catch (error) {
          if (called) return;
          called = true;
          reject(error);
        }
      } else {
        resolve(x);
      }
    } catch (error) {
      reject(error);
    }
  } else {
    resolve(x);
  }
}

_Promise.deferred = function () {
  let result = {};
  result.promise = new _Promise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

module.exports = _Promise;
