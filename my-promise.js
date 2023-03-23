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
    reject(new TypeError("Chaining cycle detected for promise"));
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
