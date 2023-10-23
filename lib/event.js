class EventEmitter {
  constructor() {
    this._listeners = [];
  }

  dispose() {
    this._listeners = [];
  }

  subscribe(listener) {
    this._listeners.push(listener);
    return {
      dispose: () => {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
    }
  }

  emit(event) {
    this._listeners.forEach(listener => listener(event));
  }
}

module.exports = EventEmitter;