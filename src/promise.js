class example extends Promise {
  constructor(props) {
    super(props);
  }
}

class DevPromise {
  constructor(executor) {
    this.resolutionQueue = [];
    this.rejectionQueue = [];
    this.state = "pending";
    this.value;
    this.rejectionReason;
    if (typeof executor === "function") {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this));
      } catch (e) {
        this.reject(e);
      }
    } else {
      throw TypeError();
    }
  }

  resRejHandlers(quenuie) {
    while (quenuie.length > 0) {
      const resolution = quenuie.shift();
      try {
        var returnValue = resolution.handler(this.value);
      } catch (e) {
        resolution.promise.reject(e);
      }

      if (returnValue instanceof DevPromise) {
        returnValue
          .then(v => resolution.promise.resolve(v))
          .catch(e => resolution.promise.reject(e));
      } else {
        resolution.promise.resolve(returnValue);
      }
    }
  }
  reject(reason) {
    if (this.state === "pending") {
      this.rejectionReason = reason;
      this.state = "rejected";
      this.resRejHandlers(this.rejectionQueue);

      while (this.resolutionQueue.length > 0) {
        const resolution = this.resolutionQueue.shift();
        resolution.promise.reject(this.rejectionReason);
      }
    }
  }

  resolve(value) {
    if (this.state !== "pending") return;
    this.value = value;
    this.state = "resolved";
    this.resRejHandlers(this.resolutionQueue);
  }

  then(resolutionHandler, rejectionHandler) {
    const newPromise = new DevPromise(() => {});

    this.resolutionQueue.push({
      handler: resolutionHandler,
      promise: newPromise
    });

    if (typeof rejectionHandler === "function") {
      this.rejectionQueue.push({
        handler: rejectionHandler,
        promise: newPromise
      });
    }

    if (this.state === "resolved") {
      this.resRejHandlers(this.resolutionQueue);
    }

    if (this.state === "rejected") {
      newPromise.reject(this.rejectionReason);
    }

    return newPromise;
  }

  catch(rejectionHandler) {
    const newPromise = new DevPromise(() => {});

    this.rejectionQueue.push({
      handler: rejectionHandler,
      promise: newPromise
    });

    if (this.state === "rejected") {
      this.resRejHandlers(this.rejectionQueue);
    }

    return newPromise;
  }

  static all(iterable) {
    if (typeof iterable[Symbol.iterator] !== "function") {
      return new this((res, rej) =>
        rej(TypeError("undefined is not a function"))
      );
    }
    if (!iterable.length) {
      return new this(res => res([]));
    }

    return new this((res, rej) => {
      const arrDone = [];

      for (let i = iterable.length; i--; ) {
        const a = this.resolve();
        a.then(() => iterable[i]).then(
          res => arrDone.push(res),
          err => arrDone.push(err)
        );
      }
      res(arrDone);
      rej(arrDone);
    });
  }

  static race(iterable) {
    if (typeof iterable[Symbol.iterator] !== "function") {
      return new this((res, rej) =>
        rej(TypeError("undefined is not a function"))
      );
    }
    if (!iterable.length) {
      return new this(res => res([]));
    }
  }

  static resolve(x) {
    if (x instanceof this) {
      return x;
    }
    if (this !== DevPromise) {
      throw TypeError(x);
    }
    return new this((res, rej) => {
      res(x);
    });
  }

  static reject(x) {
    if (this !== DevPromise) {
      throw TypeError(x);
    }
    return new this((res, rej) => rej(x));
  }
}

module.exports = DevPromise; // change to devProe;
