/* eslint import/no-dynamic-require: off */

const Ajv = require('ajv');
const {assert} = require('check-types');
const {get, set, remove, cloneDeep, sortBy} = require('lodash');

const _data = new WeakMap();
const _accessors = new WeakMap();
const _validator = new WeakMap();
const _cache = new WeakMap();

class Config {

  constructor(opts = {}) {
    assert.object(opts, 'config opts must be an object [config-opts-invalid]');

    _data.set(this, cloneDeep(opts.data || {}));
    _accessors.set(this, []);
    _cache.set(this, []);

    if (opts.schema) {
      const ajv = new Ajv();
      _validator.set(this, ajv.compile(opts.schema));
    }

    for (const accessor of opts.accessors || []) {
      this.addAccessor(accessor.path, accessor.handler);
    }

    this.validate();

    if (typeof opts.init === 'function') {
      opts.init(this);
    }
  }

  get(path, fallback) {
    // lookups are cached so that accessors do
    // not run needlessly over the same data
    const cached = this.getCached(path);
    if (cached) {
      return cached.value;
    }
    assert.string(path, 'Config.get - `path` argument must be a string [path-invalid]');
    let value = this.getData(path, fallback);
    for (const accessor of this.getAccessorsForPath(path)) {
      value = accessor.handler(value, this);
    }
    if (value !== fallback) {
      _cache.get(this).push({path, value});
    }
    return value;
  }

  set(path, value) {
    assert.string(path, 'Config.set - `path` argument must be a string [path-invalid]');
    this.removeFromCache(path);
    set(this.data, path, cloneDeep(value));
    this.validate();
    return this;
  }

  getData(path, fallback) {
    return cloneDeep(get(this.data, path, fallback));
  }

  validate() {
    const validate = _validator.get(this);
    if (!validate) {
      return this;
    }
    if (!validate(this.data)) {
      const errors = validate.errors.map(err => `'${err.dataPath.replace(/^\./, '')}' ${err.message}`);
      throw new Error(`Config data validation failed with the following errors:\n${errors.join('\n')}`);
    }
    return this;
  }

  addAccessor(path, handler) {
    if (typeof handler === 'string') {
      handler = require(`./accessors/${handler}`);
    }
    assert.string(path, 'Accessor path must be a string [accessor-path-invalid]');
    assert.function(handler, 'Accessor handler must be a function [accessor-handler-invalid]');
    this.accessors.push({path, handler});
    this.removeFromCache(path);
    return this;
  }

  getAccessorsForPath(path) {
    const matches = this.accessors.filter(acc => path.startsWith(`${acc.path}.`) || path === acc.path);
    return sortBy(matches, m => m.path.length).reverse();
  }

  getCached(path) {
    const cache = _cache.get(this);
    return cache.find(item => item.path === path);
  }

  removeFromCache(path) {
    const cache = _cache.get(this);
    return remove(cache, item => path.startsWith(`${item.path}.`) || path === item.path);
  }

  get data() {
    return _data.get(this);
  }

  get accessors() {
    return _accessors.get(this);
  }

}

module.exports = Config;
