let _ = require('lodash');
let EventEmitter = require('events').EventEmitter;
let states = require('./states');

class Status extends EventEmitter {
  constructor(plugin, server) {
    super();

    this.plugin = plugin;
    this.since = new Date();
    this.state = 'uninitialized';
    this.message = 'uninitialized';

    this.on('change', function (previous, previousMsg) {
      this.since = new Date();
      let tags = ['status', `plugin:${this.plugin.toString()}`];
      tags.push(this.state === 'red' ? 'error' : 'info');

      server.log(tags, {
        tmpl: 'Status changed from <%= prevState %> to <%= state %><%= message ? " - " + message : "" %>',
        state: this.state,
        message: this.message,
        prevState: previous,
        prevMsg: previousMsg
      });
    });
  }

  toJSON() {
    return {
      name: this.plugin.id,
      version: this.plugin.version,
      state: this.state,
      icon: states.get(this.state).icon,
      message: this.message,
      since: this.since
    };
  }
}

states.all.forEach(function (state) {
  Status.prototype[state.id] = function (message) {
    if (this.state === 'disabled') return;

    let previous = this.state;
    let previousMsg = this.message;

    this.error = null;
    this.message = message || state.title;
    this.state = state.id;

    if (message instanceof Error) {
      this.error = message;
      this.message = message.message;
    }

    if (previous === this.state && previousMsg === this.message) {
      // noop
      return;
    }

    this.emit(state.id, previous, previousMsg);
    this.emit('change', previous, previousMsg);
  };
});

module.exports = Status;
