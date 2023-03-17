// 一、定义 MyPromise 的初始结构
// 1. 一个 class
// 2. 参数 constructor(fn) 中的 参数 fn 是一个函数，在初始化 MyPromise 实例时会立即执行
// 3. fn(reolve, reject) 中的 reolve 和 reject 这两个参数赋值为类定义的方法：this.resolve() 和 this.reject()
// 4. MyPromise 有三种状态："pending", "fulfilled", "rejected", 将其定义为 MyPromise 的静态属性
// 5. MyPromise 有两个最重要的属性：PromiseState 和 PromiseResult

// 二、实现 then
// 1. then 方法的基本特性
// 1.1 then(onFulfilled, onRejected) 有两个参数，都是函数（如果不是函数就要被忽略）
// - 如果 PromiseState 为fulfilled，执行onFulfilled(PromiseResult)
// - 如果 PromiseState 为 rejected，执行 onRejected(PromiseResult)
// 1.2 如果 fn(reolve, reject) 在执行时抛出异常，执行 onRejected(error)

// 2. 实现 then 方法的异步功能
// 2.1 then 在整体代码中是异步微任务：then回调使用setTimeout包裹
// 2.2 如果 resolve || reject 是异步的，要确保它之后的 PromiseState 能被 then 方法获取到，从而执行 then 方法：then回调保存
// 2.3 确保 then 方法在异步的 resolve || reject 之后执行：then的回调保存使用setTimeout包裹
// 2.4 因为 then 方法可以多次调用，所以 2.2 中then回调保存要用数组保存

// 3. 实现 then 方法的链式调用 -- then返回的是一个新的promise：const promise2 = promise1.then(onFulfilled, onRejected)
// 3.1 如果 onFulfilled 或者 onRejected 抛出一个异常 e，则 promise2 拒绝执行，并返回拒因 e
// 3.2 如果 onFulfilled 不是函数且 promise1 成功执行, 则 promise2 成功执行并返回和 promise1 相同的值（then的顺延）
// 3.3 如果 onRejected 不是函数且 promise1 拒绝执行， 则 promise2 拒绝执行并返回相同的原因（then的顺延）
// 3.4 如果 onFulfilled 或者 onRejected 返回一个值 x，则将 x 进行 promise 化处理：resolvePromise(promise, x, resolve, reject)
/**
 * @param  {promise} promise2 promise1.then方法返回的新的promise对象
 * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值 => x = onFulfilled(PromiseResult) || onRejected(PromiseResult)
 * @param  {[type]} resolve   promise2的resolve方法
 * @param  {[type]} reject    promise2的reject方法
 */
// （1）如果 x 和 promise2 和指向同一对象，以 TypeError 为据因拒绝执行 promise
// （2）如果 x 为 Promise ，则 promise2 的状态取决于 x 的状态
// （3）如果 x 不是函数或对象，则 promise2 最终都是执行态
// （4）如果 x 是函数或对象
// (4)-1 把 x.then 赋值给 then: then = x.then
// (4)-2 如果取 then的值时抛出错误 e，则 promise2.PromiseState === 'rejected', promise2.PromiseResult === e
// (4)-3 如果 then 不是函数,则 promise2.PromiseState === 'fulFilled', promise2.PromiseResult === x
// (4)-4 如果 then 是函数：then 中的 this 指向 x，传递两个回调函数作为参数 resolvePromise 和 rejectPromise: then.call(x, y => resolvePromise, e => rejectPromise)
// - 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
// - 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
// - 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
// - 如果调用 then 方法抛出了异常 e：如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之；否则以 e 为据因拒绝 promise

// 三、其它方法
// 1. 实例方法
// 1.1 catch(onRejected): 返回一个Promise，并且处理拒绝的情况, 等同于调用 MyPromise.prototype.then(undefined, onRejected)
// 1.2 finally(cb)：返回一个Promise，在promise结束时，无论结果是fulfilled或者是rejected，都会执行指定的回调函数，等同于调用 MyPromise.prototype.then(cb, cb)

// 2. 静态方法
// 2.1 resolve, 返回一个 promise: const p = Promise.resolve(value)
// - 如果 value 值是一个 promise ，那么返回 value, 即 p ==== value
// - 如果 value 值是 thenable（即带有"then" 方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态：return new Promise((res, rej)=>value.then(res, rej))
// - 如果 value 是普通值，则 p.PromiseState === 'fulFilled' && p.promiseResult === value
// 2.2 reject, 返回一个 promise： const p = Promise.reject(reason) => p.PromiseState === 'rejected' && p.promiseResult === reason
// 2.3 race, 返回一个 promisep: pRace = MyPromise.race(promises) => return new Promise((reslove, reject)=>{})
// - 如果 promises 不是数组，返回 TypeError 为原因的拒绝状态：pRace = reject(new TypeError("Argument is not iterable"))
// - 如果 promises 是数组, 解析每一项 promises.forEach(item => Promise.resolve(item).then(resolve, reject))
// - 谁先（手动实现上无法实现时间先后，只能按 promises 数组的顺序来处理）返回”成功“或”失败“的结果，则 pRace 的[[PromiseState]]为对应的状态， pRace 的 [[PromiseResult]] 为对应的值
// 2.4 all, 返回一个 Promise:  pAll = MyPromise.all(promises) => return new Promise((reslove, reject)=>{})
// - 如果 promises 不是数组，返回 TypeError 为原因的拒绝状态: pAll = reject(new TypeError("Argument is not iterable"))
// - 如果 promises 为数组，遍历数组：promises.forEach(item, index)
// -- 如果 item 项不是 promise, 则该项被认为是成功的，直接放进结果数组: result[index] = item
// -- 如果 item 项是 promise，解析该项：Promise.resolve(item).then(val=> {}, err=> {})
// --- 如果该项解析后的结果为 fulFilled, 则将该项的val添加进结果数组 result[index] = val
// --- 如果该项解析后的结果为 rejected , 以该项的拒因 err 为本次all的拒因 reject(err)
// - 遍历完 promises 数组后，如果所有子项都是成功，则 pAll 的[[PromiseState]] 为 fulFilled, pAll 的 [[PromiseResult]] 为结果数组 results

class MyPromise {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";

  constructor(fn) {
    if (typeof fn !== "function") {
      throw TypeError(`Promise resolver ${fn} is not a function`);
    }

    this.PromiseState = MyPromise.PENDING;
    this.PromiseResult = null;

    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(result) {
    if (this.PromiseState === MyPromise.PENDING) {
      this.PromiseState = MyPromise.FULFILLED;
      this.PromiseResult = result;
      this.onFulfilledCallbacks.forEach((cb) => cb(result));
    }
  }

  reject(reason) {
    if (this.PromiseState === MyPromise.PENDING) {
      this.PromiseState = MyPromise.REJECTED;
      this.PromiseResult = reason;
      this.onRejectedCallbacks.forEach((cb) => cb(reason));
    }
  }

  then(onFulfilled, onRejected) {
    const p2 = new MyPromise((resolve, reject) => {
      if (this.PromiseState === MyPromise.FULFILLED) {
        setTimeout(() => {
          try {
            if (typeof onFulfilled !== "function") {
              resolve(this.PromiseResult);
            } else {
              let x = onFulfilled(this.PromiseResult);
              resolvePromise(p2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);
          }
        });
      } else if (this.PromiseState === MyPromise.REJECTED) {
        setTimeout(() => {
          try {
            if (typeof onRejected !== "function") {
              reject(this.PromiseResult);
            } else {
              let x = onRejected(this.PromiseResult);
              resolvePromise(p2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);
          }
        });
      } else if (this.PromiseState === MyPromise.PENDING) {
        this.onFulfilledCallbacks.push(() =>
          setTimeout(() => {
            try {
              if (typeof onFulfilled !== "function") {
                resolve(this.PromiseResult);
              } else {
                let x = onFulfilled(this.PromiseResult);
                resolvePromise(p2, x, resolve, reject);
              }
            } catch (error) {
              reject(error);
            }
          })
        );
        this.onRejectedCallbacks.push(() =>
          setTimeout(() => {
            try {
              if (typeof onRejected !== "function") {
                reject(this.PromiseResult);
              } else {
                let x = onRejected(this.PromiseResult);
                resolvePromise(p2, x, resolve, reject);
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
    if (value instanceof MyPromise) {
      return value;
    } else if (value instanceof Object && "then" in value) {
      return new MyPromise((resolve, reject) => {
        value.then(resolve, reject);
      });
    }

    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((resolve, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (Array.isArray(promises)) {
        let count = 0;
        let results = [];
        const len = promises.length;

        promises.forEach((item, index) => {
          if (item instanceof MyPromise) {
            MyPromise.resolve(item).then(
              (val) => {
                count++;
                results[index] = val;
                count === len && resolve(results);
              },
              (err) => {
                reject(err);
              }
            );
          } else {
            count++;
            results[index] = resolve(item);
            count === len && resolve(results);
          }
        });
      } else {
        reject(new TypeError("Argument is not iterable"));
      }
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (Array.isArray(promises)) {
        promises.forEach((item, index) => {
          MyPromise.resolve(item).then(resolve, reject);
        });
      } else {
        reject(new TypeError("Argument is not iterable"));
      }
    });
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    throw new TypeError("Chaining cycle detected for promise");
  }
  if (x instanceof MyPromise) {
    x.then((y) => {
      resolvePromise(promise2, y, resolve, reject);
    }, reject);
  } else if (x !== null && (typeof x === "function" || typeof x === "object")) {
    try {
      var then = x.then;
    } catch (error) {
      return reject(error);
    }

    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
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
  } else {
    return resolve(x);
  }
}


