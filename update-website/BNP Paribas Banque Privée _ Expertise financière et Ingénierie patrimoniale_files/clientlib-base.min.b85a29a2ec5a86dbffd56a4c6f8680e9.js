(function commonJs($) {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //============= constantes ==================
  var DEBUG_MODE = "debugMode";
  var USE_DEBUG_INFOCLIENT_STUB = "USE_DEBUG_INFOCLIENT_STUB";
  var NOAEM_REDIRECT_FF = "NOAEM_REDIRECT_FF";
  //------------------------------------------------
  var constantes = {
    SESSION_KEYS: {
      USE_DEBUG_INFOCLIENT_STUB: USE_DEBUG_INFOCLIENT_STUB,
      DEBUG_MODE: DEBUG_MODE,
      NOAEM_REDIRECT_FF: NOAEM_REDIRECT_FF //
    },
    LOCAL_KEYS: {
      USE_DEBUG_INFOCLIENT_STUB: USE_DEBUG_INFOCLIENT_STUB,
      DEBUG_MODE: DEBUG_MODE
    },
    INFOCLIENT_TTL: 3 * 60 * 1000,
    URLS: {
      INFOCLIENT_STUB_URL: "/rsc/contrib/stubs/infosClient.json",
      INFOCLIENT_URL: "/serviceinfosclient-wspl/rpc/InfosClient",
      BLANK_GIF_URL: "/rsc/contrib/image/icons/small/blank.gif"
    },
    COMPONENTS_SELECTOR: "._componentContainer",
    CLIENT_TYPES: {
      PART: "PART",
      BPF: "BPF",
      PRO: "PRO",
      HB: "HB",
      HBPRO: "HBPRO"
    }
  };
  //===========================================

  /**
   *
   * @param it
   * @returns {boolean}
   */
  function isObject(it) {
    return typeof it === "object" ? it !== null : typeof it === "function";
  }

  /**
   * simple assertion implementation
   * @param condition
   * @param message
   */
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }

    return {
      assert: assert
    };
  }

  /**
   * nor null, nor undefined
   * @param obj
   */
  function isDefined(obj) {
    return obj !== null && obj !== undefined;
  }

  /**
   *
   * @param obj
   * @param path // a.b.c.d
   * @returns {boolean|string|null}
   */
  function safeAccess(obj, path) {
    var _path = path || "";
    assert(
      typeof path === "string",
      "safeAccess(): Bad Type arguments: path must be a String"
    );
    var paths = _path.split("."); // [ "a", "b", "c", "d"]

    var result = paths.reduce(function(acc, key) {
      var accKey = acc[key];
      return accKey === 0 || accKey === false ? accKey : accKey || {};
    }, obj);

    return result === 0 || result === false
      ? result
      : (isObject(result) &&
          (!$.isEmptyObject(result) || typeof result === "function") &&
          result) ||
          (!isObject(result) && result) ||
          null;
  }

  /**
   * legacy compatibility alias
   */
  var securePropsAccess = safeAccess;

  /**
   *
   * @param queryObjStr
   * @returns {boolean|string}
   */
  function checkDependency(queryObjStr) {
    var valueObj = safeAccess(window, queryObjStr);

    assert(isDefined(valueObj), "Missing " + queryObjStr);

    return valueObj;
  }

  /**
   *
   * @returns {(boolean|string)[]}
   */
  function checkDependencies() {
    var args = Array.from(arguments),
      listArgs = ((args && [].concat(args)) || []).flat();

    return listArgs.map(checkDependency);
  }

  /**
   * Export object properties into object window
   * @param objArgs
   */
  function exportToWindow(objArgs) {
    assert(isDefined(objArgs), "Missing argument");
    assert($.isPlainObject(objArgs), "Illegal argument: not a plain object!");

    Object.keys(objArgs).forEach(function(varName) {
      window[varName] = objArgs[varName];
    });
  }

  /**
   * Export an object into window.Globaliste
   * Export an object property into global window
   * @param objArgs
   */
  function exportGlobally(objArgs) {
    exportToWindow(objArgs);
    exportToGlobalSite(objArgs);
  }

  /**
   * Export object properties into GlobalSite
   * @param objToExport
   */
  function exportToGlobalSite(objToExport) {
    Object.assign(window.GlobalSite, objToExport);
  }

  /**
   *
   * @param label
   * @param funcMessageTemplate
   * @returns {(function(...[*]=))|noop}
   */
  function debugFuncFactory(label, funcMessageTemplate) {
    var isDebug = window.DEBUG;
    var noop = function() {};

    if (!isDebug) {
      return noop;
    }

    if (typeof funcMessageTemplate !== "function") {
      return noop;
    }

    return function(message, callBack) {
      funcMessageTemplate(label, message);

      if (typeof callback === "function") {
        callBack();
      }
    };
  }

  debugFuncFactory.help = function() {
    var helpFunc = console.table || console.info;
    helpFunc("exemple usage");
    helpFunc({
      "":
        'var debug = GlobalSite.debugFuncFactory("ma fonctionnalité", function(label, message){',
      " ":
        "   var obj = {};                                                                        ",
      "  ":
        "                                                                                        ",
      "    ":
        "   obj[label] = message;                                                                ",
      "     ":
        "})                                                                                      "
    });
  };

  function getCurrentScriptPath() {
    return new URL(window.currentExecutingScript().src).pathname;
  }

  function logTemplateMessage(label, message) {
    var obj = {};

    obj[label] = message;
    console.log(obj);
  }
  function errorTemplateMessage(label, message) {
    var obj = {};

    obj[label] = message;
    console.error(obj);
  }
  function logFactory(_label) {
    var label = "log:" + _label;
    var _log = function() {},
      _error = function() {};

    if (typeof window.GlobalSite.debugFuncFactory === "function") {
      _log = GlobalSite.debugFuncFactory(label, logTemplateMessage);
      _error = GlobalSite.debugFuncFactory(label, errorTemplateMessage);
    }

    return {
      log: function(message, callBack) {
        _log(message, callBack);

        return this;
      },
      delimiter: function(character) {
        return this.log((character || "=").repeat(100));
      },
      error: function(message, callBack) {
        _error(message, callBack);

        return this;
      }
    };
  }

  function activeDebug() {
    updateLocalStorage(constantes.LOCAL_KEYS.DEBUG_MODE, true);
  }

  function deactiveDebug() {
    removeFromLocal(constantes.LOCAL_KEYS.DEBUG_MODE);
  }

  var listStubsKeys = [constantes.LOCAL_KEYS.USE_DEBUG_INFOCLIENT_STUB];

  function activeStubs() {
    activeDebug();

    listStubsKeys.forEach(function(item) {
      updateLocalStorage(item, true);
    });
  }

  function cleanStubs() {
    listStubsKeys.forEach(function(item) {
      removeFromLocal(item);
    });
  }

  /**
   *
   * @param key
   * @param val
   */
  function updateSession(key, val) {
    sessionStorage[key] = JSON.stringify(val);
  }

  /**
   *
   * @param key
   * @param val
   */
  function updateLocalStorage(key, val) {
    localStorage[key] = JSON.stringify(val);
  }

  /**
   *
   * @param key
   * @returns {any}
   */
  function getFromLocalStorage(key) {
    var _localVal = localStorage[key];
    var localVal = _localVal === "undefined" ? null : _localVal;

    return JSON.parse(localVal || null);
  }

  /**
   *
   * @param key
   * @returns {any}
   */
  function getFromSessionStorage(key) {
    var _sessionVal = sessionStorage[key];
    var sessionVal = _sessionVal === "undefined" ? null : _sessionVal;

    return JSON.parse(sessionVal || null);
  }

  /**
   *
   * @param key
   */
  function removeFromLocal(key) {
    delete localStorage[key];
  }

  /**
   *
   * @param key
   */
  function removeFromSession(key) {
    delete sessionStorage[key];
  }

  /**
   *
   * @param key
   */
  function removeFromStorage(key) {
    removeFromLocal(key);
    removeFromSession(key);
  }

  /**
   *
   * @param fn
   * @param context
   * @returns {function(): *}
   */
  function once(fn, context) {
    var result;

    return function() {
      if (fn) {
        result = fn.apply(context || this, arguments);
        fn = null;
      }

      return result;
    };
  }

  /**
   *
   * @param selector
   * @returns {boolean}
   */
  function isEltExists(selector) {
    return $(selector).length > 0;
  }

  /**
   *
   * @param compName
   * @returns {string}
   */
  function getSelectorForComp(compName) {
    return constantes.COMPONENTS_SELECTOR + "._" + compName;
  }

  function isCompExists(compName, Log) {
    var compSelector = getSelectorForComp(compName),
      res = isEltExists(compSelector);

    if (isDefined(Log) && !res) {
      Log.log(compSelector + " doesn't exist!");
    }

    return res;
  }

  /**
   * utilitaire pour IntersectionObserver
   * @param obj
   * @returns {string}
   */
  function rootMargin(_top, _right, _bottom, _left) {
    var top = _top || 0,
      right = _right || 0,
      bottom = _bottom || 0,
      left = _left || 0,
      res = [top, right, bottom, left]
        .map(function(item) {
          return item + "px";
        })
        .join(" ");

    return res;
  }

  function generateId() {
    var count = generateId.count || 0;
    count++;
    generateId.count = count;

    return count;
  }
  generateId.count = Math.trunc(performance.now());

  /**
   *
   * @returns :{Promise}
   */
  function getAsyncDateServer() {
    return $.ajax({
      url: "/",
      cache: false
    }).then(function(data, textStatus, jqXHR) {
      return jqXHR.getResponseHeader("date");
    });
  }

  //================ configuration global IntersectionObserver =============
  if (IntersectionObserver) {
    ((window.IntersectionObserver || {}).prototype || {}).POLL_INTERVAL = 100;
  }
  //=============== Stubs =====================
  var Webtrends = {};
  Webtrends.multiTrack = $.noop;
  //===========================================
  exportToWindow({ Webtrends: Webtrends });
  exportToGlobalSite({
    isAem: true,
    getAsyncDateServer: getAsyncDateServer,
    isConnected: GlobalSite.isConnected || false, // default value
    CST: constantes,
    assert: assert,
    isDefined: isDefined,
    isEltExists: isEltExists,
    getSelectorForComp: getSelectorForComp,
    isCompExists: isCompExists,
    isObject: isObject,
    safeAccess: safeAccess,
    securePropsAccess: securePropsAccess, // legacy
    checkDependency: checkDependency,
    checkDependencies: checkDependencies,
    exportToWindow: exportToWindow,
    exportGlobally: exportGlobally,
    exportToGlobalSite: exportToGlobalSite,
    getCurrentScriptPath: getCurrentScriptPath,
    debugFuncFactory: debugFuncFactory,
    logFactory: logFactory,
    activeDebug: activeDebug,
    deactiveDebug: deactiveDebug,
    activeStubs: activeStubs,
    cleanStubs: cleanStubs,
    updateSession: updateSession,
    updateLocalStorage: updateLocalStorage,
    getFromSessionStorage: getFromSessionStorage,
    getFromLocalStorage: getFromLocalStorage,
    removeFromLocal: removeFromLocal,
    removeFromSession: removeFromSession,
    removeFromStorage: removeFromStorage,
    once: once,
    rootMargin: rootMargin,
    generateId: generateId
  });
  //===========================================
})($);

(function jqVariablesJs($) {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies("GlobalSite.exportGlobally");
  $(function() {
    //------------------------------------------------
    //------------------------------------------------
    var $body = $("body"),
      $document = $(document),
      $html = $("html"),
      toExport = {
        $body: $body,
        $document: $document,
        $html: $html
      };

    //===========================================
    GlobalSite.exportToGlobalSite(toExport);
    //===========================================
  });

  function $AsyncDomReady() {
    var deferred = $.Deferred();

    $(deferred.resolve);

    return deferred;
  }

  //===========================================
  GlobalSite.exportToGlobalSite({
    $AsyncDomReady: $AsyncDomReady
  });
  //===========================================
})($);

(function Deferred() {
    //===========================================
    window.GlobalSite = window.GlobalSite || {};
    GlobalSite.checkDependencies("GlobalSite.exportToGlobalSite");
    //===========================================
    var Deferred = {
        create: function() {
            var d = null;
            var p = new Promise(function(resolve, reject) {
                d = {
                    pending: true,
                    resolved: false,
                    rejected: false,
                    resolve: function() {
                        var args = Array.from(arguments);
                        var promise = Promise.resolve.apply(Promise, args);

                        resolve.apply(this, args);

                        promise
                            .then(
                                function() {
                                    this.pending = false;
                                    this.resolved = true;
                                    this.rejected = false;
                                }.bind(this)
                            )
                            .catch(
                                function() {
                                    this.pending = false;
                                    this.resolved = false;
                                    this.rejected = true;
                                }.bind(this)
                            );

                        return promise;
                    },
                    reject: function() {
                        var args = Array.from(arguments);
                        var promise = Promise.reject.apply(Promise, args);

                        reject.apply(this, args);

                        promise.catch(
                            function() {
                                this.pending = false;
                                this.resolved = false;
                                this.rejected = true;
                            }.bind(this)
                        );

                        return promise;
                    },
                    isStateResolved: function() {
                        return !!this.resolved;
                    },
                    isStatePending: function() {
                        return !!this.pending;
                    },
                    isStateRejected: function() {
                        return !!this.rejected;
                    }
                };
            });

            Object.assign(p, d);

            return p;
        }
    };
    //===========================================
    GlobalSite.exportToGlobalSite({
        Deferred: Deferred
    });
    //===========================================
})();
//@ts-nocheck
// ## Variables d'environnements
// La variable `ENVIRONNEMENT` est accessible dans le scope global, peut avoir plusieurs valeurs :
// - 'LOCAL' (quand on est sur localhost)
// - 'INTE' (quand on est sur un url d'inté)
// - 'QUALIF' (quand on est sur un url de qualif)
// - 'PREVIEW' (quand on est sur un url de preview)
// - 'PROD' (quand on est sur un url de prod)
// - 'MACHINE' (quand on est sur un url de machine de prod ex: prod-v-wea1s1-apa1s1.canalnet-pro.bnpparibas.net)
// test
(function environementJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================
  GlobalSite.checkDependencies(
    "GlobalSite.exportGlobally",
    "GlobalSite.logFactory",
    "GlobalSite.getFromLocalStorage",
    "GlobalSite.getFromSessionStorage",
    "GlobalSite.CST"
  );

  var ENVIRONNEMENT = "NO_ENV";

  (function setEnv() {
    if (window.location.host.match(/mabanque/) !== null) {
      ENVIRONNEMENT = "PROD";
    }
    if (window.location.host.match(/canalnet-(part|pro|bpf)-inte/) !== null) {
      ENVIRONNEMENT = "INTE";
    }
    if (window.location.host.match(/canalnet-(part|pro|bpf)-qual/) !== null) {
      ENVIRONNEMENT = "QUALIF";
    }
    if (window.location.host.match(/localhost/) !== null) {
      ENVIRONNEMENT = "LOCAL";
    }
    if (window.location.host.match(/prod/) !== null) {
      ENVIRONNEMENT = "MACHINE";
    }
    if (
      /prev-(.)*.canalnet-(part|pro|bpf).bnpparibas.net/.test(
        window.location.host
      )
    ) {
      ENVIRONNEMENT = "PREVIEW";
    }
    if (/m-service.bnpparibas.net/.test(window.location.host)) {
      ENVIRONNEMENT = "MOBILE";
    }

    //===========================================
    GlobalSite.exportGlobally({
      ENVIRONNEMENT: ENVIRONNEMENT
    });
    //===========================================
  })();

  //----------
  $(function () {
    var $body = GlobalSite.checkDependency("GlobalSite.$body");

    if (window.ENVIRONNEMENT === "QUALIF") {
      $body.addClass("qualif");
    }

    if (window.ENVIRONNEMENT === "INTE") {
      $body.addClass("inte");
    }

    var uabis = window.navigator.userAgent;
    var msie = uabis.indexOf("MSIE ");

    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      $body.addClass("on-ie").removeClass("not-ie");
    }
  });

  //===========================================
  var DEBUG = !!(
    GlobalSite.getFromSessionStorage(GlobalSite.CST.SESSION_KEYS.DEBUG_MODE) ===
      true ||
    GlobalSite.getFromLocalStorage(GlobalSite.CST.LOCAL_KEYS.DEBUG_MODE) ===
      true ||
    !!document.location.search.split("?").find(function (item) {
      return item.indexOf("debug") >= 0;
    })
  );

  GlobalSite.exportGlobally({
    DEBUG: DEBUG
  });
  //===========================================

  if (DEBUG) {
    sessionStorage.trace = 1;
    document.cookie =
      'bnpp_sav={"tracing":true}; expires=' +
      new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).toGMTString() +
      "; path=/";
  }

  //=================================================
  var Log = GlobalSite.logFactory("environement.js");
  //=================================================

  /**
   * DESACTIVATION de console.log et console.warn en PROD et PREVIEW
   */
  (function () {
    try {
      (ENVIRONNEMENT === "PROD" || ENVIRONNEMENT === "PREVIEW") &&
      !sessionStorage.trace &&
      window.console
        ? ((window.console.log = function () {}),
          (window.console.warn = function () {}))
        : null;
    } catch (e) {
      Log.error(e);
    }
  })();

  try {
    (function () {
      var _ENV = localStorage.ENVIRONNEMENT;
      DEBUG && _ENV && (window.ENVIRONNEMENT = GlobalSite.ENVIRONNEMENT = _ENV);
    })();
  } catch (error) {
    Log.error({
      errorDebugEnv: error
    });
  }

  try {
    // desactivation des console.clear du fait des oublis frequents dans le code qui rendent le debuggage extremement penible
    console.deactivateClear = function () {
      this._clear = this.clear;
      this.clear = function () {
        Log.log(
          "Désactivation des 'console.clear'(oublis intempestifs dans le code qui rendent le debuggage extremement penible....)"
        );
      };

      Log.log("'console.clear' déactivé ...");
    };

    console.reactivateClear = function () {
      if (typeof this._clear === "function") {
        this.clear = this._clear;
        Log.log("'console.clear' réactivé ...");
      }
    };

    console.deactivateClear();
  } catch (error) {
    Log.error(error);
  }

  /**
   *
   * @returns {boolean|(function(...[*]=))}
   */
  function isDebug() {
    return GlobalSite.DEBUG || window.DEBUG;
  }

  /**
   * [surcharge de console.log]
   * @legacy
   * @param message
   * @param style
   */
  function trace(message, style) {
    if (!DEBUG) {
      return;
    }
    if (typeof message == "object") {
      console.log(message);
      return;
    }
    message = String(message);
    if (style != null) {
      if (!message.match(/^%c/)) {
        message = "%c" + message;
      }
      if (typeof style == "object") {
        console.log(
          message.substr(0, 2) + style.prefix + message.substr(2),
          style.style
        );
      } else {
        console.log(message, style);
      }
    } else {
      console.log(message);
    }
  }

  //==============================
  GlobalSite.exportGlobally({
    trace: trace, // legacy
    isDebug: isDebug
  });
  //==============================
})();

(function WaitAsyncJs() {
  //============================================*
  window.GlobalSite = window.GlobalSite || {};
  GlobalSite.checkDependencies(
    "GlobalSite.exportToGlobalSite",
    "GlobalSite.Deferred"
  );
  //=============================================*
  var WaitAsync = (function () {
    var DELAY = 300;
    var toWaitSet = new Set();
    var resolvedSet = new Set();

    function Chrono() {
      this.date0 = this.date = new Date();
    }

    Chrono.prototype = {
      tick: function (_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;

        this.date = new Date();

        callBack(this.delta());

        return this;
      },
      delta: function () {
        return this.date.getTime() - this.date0.getTime();
      },
    };

    function Test(_predicat, _valuator, _maxCycles, _timeOut) {
      var valuator = typeof _valuator === "function" ? _valuator : $.noop;
      var maxCycles = _maxCycles || Infinity;
      var timeOut = _timeOut || Infinity;

      if (typeof _predicat !== "function") {
        throw "predicat must be a function";
      }

      this.chrono = new Chrono();
      this.counter = 0;
      this.deltaTime = this.chrono.delta();
      this._predicat = _predicat;
      this.predicat = function () {
        return (
          this._predicat() ||
          this.counter >= maxCycles ||
          this.deltaTime >= timeOut
        );
      };
      this.valuator = valuator;
      this.resolvedValue = null;
      this.deferred = GlobalSite.Deferred.create();
      this.deferred
        .then(
          function (value) {
            this.resolvedValue = value;

            return value;
          }.bind(this)
        )
        .then(
          function (value) {
            removeTest(this);

            return value;
          }.bind(this)
        );
    }

    Test.prototype = {
      exec: function () {
        this.counter++;
        this.chrono.tick(
          function (deltaTime) {
            this.deltaTime = deltaTime;
          }.bind(this)
        );
        if (this.predicat()) {
          this.deferred.resolve(this.valuator());
        }
      },
      getAsyncVal: function () {
        return this.deferred;
      },
    };

    var waitIntervalId = window.setInterval(function () {
      Array.from(toWaitSet).map(function (test) {
        setTimeout(function () {
          test.exec();
        }, 10);
      });
    }, DELAY);

    function addTest(test) {
      if (test instanceof Test) {
        toWaitSet.add(test);
      }
    }

    function removeTest(test) {
      toWaitSet.delete(test);
      resolvedSet.add(test);
    }

    var TestFactory = (function () {
      function create(_predicat, _valuator, _maxCycles, _timeOut) {
        return new Test(_predicat, _valuator, _maxCycles, _timeOut);
      }

      function createFromObj(obj) {
        var _predicat = obj.predicat;
        var _valuator = obj.valuator;
        var _maxCycles = obj.maxCycles;
        var _timeOut = obj.timeOut;

        return new Test(_predicat, _valuator, _maxCycles, _timeOut);
      }

      return {
        create: create,
        createFromObj: createFromObj,
      };
    })();

    return {
      addTest: addTest,
      removeTest: removeTest,
      TestFactory: TestFactory,
      inspect: function () {
        return {
          toWaitSet: toWaitSet,
          resolvedSet: resolvedSet,
          waitIntervalId: waitIntervalId,
        };
      },
    };
  })();

  /**
   *
   * @param objArg : {
   *    predicat,
        valuator,
        maxCycles,
        timeOut
   * }
   * @constructor
   */
  var SimpleWaitAsync = function SimpleWaitAsync(objArg) {
    var TestFactory = WaitAsync.TestFactory,
      test = TestFactory.createFromObj(objArg);

    WaitAsync.addTest(test);

    return test.getAsyncVal();
  };

  /**
   * @legacy
   * @param predicat
   * @returns {jQuery}
   */
  var waitFor = function waitFor(predicat) {
    var TestFactory = WaitAsync.TestFactory,
      test = TestFactory.create(predicat);

    WaitAsync.addTest(test);

    return test.getAsyncVal();
  };

  function DetectChange(_valuator, onChange) {
    if (this instanceof DetectChange) {
      this._valuator = _valuator || function () {};
      this._valuator.value = this._valuator();
      this._valuator.oldValue = this._valuator();

      var _predicat = function _predicat() {
        this._valuator.oldValue = this._valuator.value;
        this._valuator.value = this._valuator();

        var value = this._valuator.value;
        var oldValue = this._valuator.oldValue;

        return value !== oldValue;
      }.bind(this);

      var createTestForChange = function () {
        return WaitAsync.TestFactory.createFromObj({
          predicat: _predicat,
          valuator: _valuator,
        });
      };

      function listenForChange(value) {
        var testForChange = createTestForChange();

        listenForChange.count = !listenForChange.count
          ? 0
          : listenForChange.count;

        /*
         NB: à la première execution de listenForChange , le compteur est à zero
         */
        if (listenForChange.count > 0) {
          onChange(value);
        }

        listenForChange.count += 1;

        WaitAsync.addTest(testForChange);

        testForChange
          .getAsyncVal()
          .then(listenForChange)
          .catch(function (err) {
            console.error("Big Boom Badaboom ", err);
          });
      }

      listenForChange();
    } else {
      return new DetectChange(_valuator, onChange);
    }
  }

  Object.assign(WaitAsync, {
    waitFor: waitFor,
    DetectChange: DetectChange,
    SimpleWaitAsync: SimpleWaitAsync,
  });
  //============================================
  GlobalSite.exportToGlobalSite({
    WaitAsync: WaitAsync,
    waitFor: waitFor,
    DetectChange: DetectChange,
    SimpleWaitAsync: SimpleWaitAsync,
  });
  //============================================
})();

(function throttleJs($, window, undefined) {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  GlobalSite.checkDependencies("GlobalSite.exportGlobally");
  //===========================================
  ("$:nomunge"); // Used by YUI compressor.

  var jq_throttle;

  // Method: jQuery.throttle
  //
  // Throttle execution of a function. Especially useful for rate limiting
  // execution of handlers on events like resize and scroll. If you want to
  // rate-limit execution of a function to a single time, see the
  // <jQuery.debounce> method.
  //
  // In this visualization, | is a throttled-function call and X is the actual
  // callback execution:
  //
  // > Throttled with `no_trailing` specified as false or unspecified:
  // > ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
  // > X    X    X    X    X    X        X    X    X    X    X    X
  // >
  // > Throttled with `no_trailing` specified as true:
  // > ||||||||||||||||||||||||| (pause) |||||||||||||||||||||||||
  // > X    X    X    X    X             X    X    X    X    X
  //
  // Usage:
  //
  // > var throttled = jQuery.throttle( delay, [ no_trailing, ] callback );
  // >
  // > jQuery('selector').bind( 'someevent', throttled );
  // > jQuery('selector').unbind( 'someevent', throttled );
  //
  // This also works in jQuery 1.4+:
  //
  // > jQuery('selector').bind( 'someevent', jQuery.throttle( delay, [ no_trailing, ] callback ) );
  // > jQuery('selector').unbind( 'someevent', callback );
  //
  // Arguments:
  //
  //  delay - (Number) A zero-or-greater delay in milliseconds. For event
  //    callbacks, values around 100 or 250 (or even higher) are most useful.
  //  no_trailing - (Boolean) Optional, defaults to false. If no_trailing is
  //    true, callback will only execute every `delay` milliseconds while the
  //    throttled-function is being called. If no_trailing is false or
  //    unspecified, callback will be executed one final time after the last
  //    throttled-function call. (After the throttled-function has not been
  //    called for `delay` milliseconds, the internal counter is reset)
  //  callback - (Function) A function to be executed after delay milliseconds.
  //    The `this` context and all arguments are passed through, as-is, to
  //    `callback` when the throttled-function is executed.
  //
  // Returns:
  //
  //  (Function) A new, throttled, function.

  $.throttle = jq_throttle = function(
    delay,
    no_trailing,
    callback,
    debounce_mode
  ) {
    // After wrapper has stopped being called, this timeout ensures that
    // `callback` is executed at the proper times in `throttle` and `end`
    // debounce modes.
    var timeout_id,
      // Keep track of the last time `callback` was executed.
      last_exec = 0;

    // `no_trailing` defaults to falsy.
    if (typeof no_trailing !== "boolean") {
      debounce_mode = callback;
      callback = no_trailing;
      no_trailing = undefined;
    }

    // The `wrapper` function encapsulates all of the throttling / debouncing
    // functionality and when executed will limit the rate at which `callback`
    // is executed.
    function wrapper() {
      var that = this,
        elapsed = +new Date() - last_exec,
        args = arguments;

      // Execute `callback` and update the `last_exec` timestamp.
      function exec() {
        last_exec = +new Date();
        callback.apply(that, args);
      }

      // If `debounce_mode` is true (at_begin) this is used to clear the flag
      // to allow future `callback` executions.
      function clear() {
        timeout_id = undefined;
      }

      if (debounce_mode && !timeout_id) {
        // Since `wrapper` is being called for the first time and
        // `debounce_mode` is true (at_begin), execute `callback`.
        exec();
      }

      // Clear any existing timeout.
      timeout_id && clearTimeout(timeout_id);

      if (debounce_mode === undefined && elapsed > delay) {
        // In throttle mode, if `delay` time has been exceeded, execute
        // `callback`.
        exec();
      } else if (no_trailing !== true) {
        // In trailing throttle mode, since `delay` time has not been
        // exceeded, schedule `callback` to execute `delay` ms after most
        // recent execution.
        //
        // If `debounce_mode` is true (at_begin), schedule `clear` to execute
        // after `delay` ms.
        //
        // If `debounce_mode` is false (at end), schedule `callback` to
        // execute after `delay` ms.
        timeout_id = setTimeout(
          debounce_mode ? clear : exec,
          debounce_mode === undefined ? delay - elapsed : delay
        );
      }
    }

    // Set the guid of `wrapper` function to the same of original callback, so
    // it can be removed in jQuery 1.4+ .unbind or .die by using the original
    // callback as a reference.
    if ($.guid) {
      wrapper.guid = callback.guid = callback.guid || $.guid++;
    }

    // Return the wrapper function.
    return wrapper;
  };

  //===========================================
  GlobalSite.exportGlobally({
    throttle: jq_throttle
  });
  //===========================================
})($, this);

(function infosClientHelperJs() {
    //===========================================
    window.GlobalSite = window.GlobalSite || {};
    //----------------------------------------------
    var WaitAsync = GlobalSite.checkDependency("GlobalSite.WaitAsync"),
      isDebug = GlobalSite.checkDependency("GlobalSite.isDebug"),
      updateSession = GlobalSite.checkDependency("GlobalSite.updateSession"),
      getFromSessionStorage = GlobalSite.checkDependency(
        "GlobalSite.getFromSessionStorage"
      ),
      getFromLocalStorage = GlobalSite.checkDependency(
        "GlobalSite.getFromLocalStorage"
      ),
      safeAccess = GlobalSite.checkDependency("GlobalSite.safeAccess"),
      logFactory = GlobalSite.checkDependency("GlobalSite.logFactory"),
      isConnected = GlobalSite.checkDependency("GlobalSite.isConnected"),
      CST = GlobalSite.checkDependency("GlobalSite.CST");
    //===========================================
    var Log = logFactory("infoClientHelper.js");
  
    // 3 minutes
    // in minutes
    var INFOCLIENT_TTL = CST.INFOCLIENT_TTL,
      DEBUG = isDebug,
      usingInfoClientStub =
        DEBUG &&
        getFromLocalStorage(CST.LOCAL_KEYS.USE_DEBUG_INFOCLIENT_STUB) === true,
      INFOCLIENT_STUB_URL = CST.URLS.INFOCLIENT_STUB_URL,
      INFOCLIENT_URL =
        (usingInfoClientStub && INFOCLIENT_STUB_URL) || CST.URLS.INFOCLIENT_URL,
      THROTTLE_DELAY = 1,
      infosClientRequestUtil,
      infosClientMode1Util,
      infosClientMode0Util,
      $ajaxRequest;
  
    function getAsyncBrowserDate() {
      var asynRes = $.when(new Date());
  
      getAsyncBrowserDate = function() {
        return asynRes;
      };
  
      return asynRes;
    }
  
    function updateInfosClientDateServer(sessionStorageKey, dateServer) {
      var rawSessionInfoClientJSON = getFromSessionStorage(SESSION_STORAGE_KEY);
      if (rawSessionInfoClientJSON) {
        rawSessionInfoClientJSON.serveurTimestamp = rawSessionInfoClientJSON.dateServeur = dateServer;
        updateSession(sessionStorageKey, rawSessionInfoClientJSON);
      }
  
      return rawSessionInfoClientJSON;
    }
  
    $ajaxRequest = (function() {
      /**
       * ajout d'un id unique "generatorId" à un objet
       * @param {*} obj
       */
      function idAttribution(obj) {
        var id = Math.trunc(1000 * performance.now());
        obj.generatorId = id;
  
        return obj;
      }
  
      /**
       * creation d'une fonction de generation de valeur/objet
       * valeur qui change dans un interval minimum de temps
       * @param {function} valueGenerator
       * @param {number} throttleDelay
       */
      function throttledValueGeneratorFactory(
        valueGenerator,
        throttleDelay /* minutes */,
        debug
      ) {
        var promise;
        var throttledFunc;
        var getThrottledAjaxPromise;
  
        throttledFunc = GlobalSite.throttle(
          throttleDelay * 60 * 1000,
          function() {
            promise = idAttribution(valueGenerator());
  
            Log.log({
              debug: {
                date: new Date(),
                infosClient: {
                  throttledValueGeneratorFactory: {
                    "value generated": promise.generatorId
                  }
                }
              }
            });
          }
        );
  
        getThrottledAjaxPromise = function() {
          throttledFunc();
  
          Log.log({
            debug: {
              date: new Date(),
              infosClient: {
                getThrottledAjaxPromise: {
                  "used promise id ": promise.generatorId
                }
              }
            }
          });
  
          return promise;
        };
  
        return getThrottledAjaxPromise;
      }
  
      function $ajaxRequestGenerator(mode) {
        function build$ajaxRequest(mode) {
          return $.ajax({
            url: INFOCLIENT_URL,
            cache: true,
            dataType: "json",
            data: {
              modeAppel: mode
            }
          });
        }
  
        function build$ajaxRequest0() {
          return build$ajaxRequest(0);
        }
  
        function build$ajaxRequest1() {
          return build$ajaxRequest(1);
        }
  
        var choosed$Request = {
          0: build$ajaxRequest0,
          1: build$ajaxRequest1
        }[mode];
  
        var $requestGenerator = throttledValueGeneratorFactory(
          choosed$Request,
          THROTTLE_DELAY,
          DEBUG
        );
  
        return $requestGenerator;
      }
  
      //========================================================
      // executé une seule fois au chargement de page
      //========================================================
  
      var generator0 = $ajaxRequestGenerator(0);
      var generator1 = $ajaxRequestGenerator(1);
  
      //========================================================
  
      function generate$Request(mode) {
        return {
          0: generator0,
          1: generator1
        }[mode]();
      }
  
      return generate$Request;
    })();
  
    infosClientRequestUtil = (function() {
      "use strict";
  
      /**
       * demande au JSON brut de l'infoClient, enrichi de la date du serveur
       * avec mise à jour complet du session storage
       * ou avec mise à jour seulement de la date serveur
       * @param mode
       * @param toUpdateOnlyDateServeur
       * @returns {*}
       */
      function getRawInfoClientPromise(mode, toUpdateOnlyDateServeur) {
        // mode = 0 || 1 || 2 etc...
        var SESSION_STORAGE_KEY =
          mode === 0 ? "info_client" : "info_client_" + mode;
  
        return GlobalSite.isConnected
          ? getAsyncBrowserDate()
              .then(function(browserDate) {
                var browserTimestamp, rawSessionInfoClientJSON, isExpired;
  
                browserTimestamp = browserDate.getTime();
                rawSessionInfoClientJSON = JSON.parse(
                  sessionStorage[SESSION_STORAGE_KEY] || null
                );
                isExpired =
                  !rawSessionInfoClientJSON ||
                  (!!rawSessionInfoClientJSON &&
                    browserTimestamp -
                      new Date(rawSessionInfoClientJSON.dateServeur).getTime() >
                      INFOCLIENT_TTL);
  
                if (isExpired) {
                  // Si info_client pas en cache on appelle le service pour récupérer les données
  
                  Log.log({
                    debug: {
                      date: new Date(),
                      infosClientDebug: {
                        isExpired: isExpired,
                        action: "ajax request launched"
                      }
                    }
                  });
  
                  return $ajaxRequest(mode)
                    .then(function(json) {
                      if (toUpdateOnlyDateServeur) {
                        rawSessionInfoClientJSON = updateInfosClientDateServer(
                          SESSION_STORAGE_KEY,
                          browserTimestamp
                        );
                      } else {
                        rawSessionInfoClientJSON = json || {};
  
                        if (rawSessionInfoClientJSON.message === "OK") {
                          rawSessionInfoClientJSON.serveurTimestamp = rawSessionInfoClientJSON.dateServeur = browserTimestamp;
                          sessionStorage.setItem(
                            SESSION_STORAGE_KEY,
                            JSON.stringify(rawSessionInfoClientJSON)
                          );
                        } else {
                          sessionStorage.removeItem(SESSION_STORAGE_KEY);
                        }
                      }
  
                      return rawSessionInfoClientJSON;
                    })
                    .fail(Log.error);
                }
  
                Log.log({
                  debug: {
                    date: new Date(),
                    infoClientsDebug: {
                      isConnected: isConnected,
                      isNotConnected: !isConnected
                    }
                  }
                });
  
                return $.when(rawSessionInfoClientJSON);
              })
              .fail(Log.error)
          : $.Deferred().reject({ message: "Forbiden Call: User not connected" });
      }
  
      /**
       * infosClient mode 0
       * @returns {JQuery.PromiseBase<JSON>}
       */
      function getRawInfoClient1Promise() {
        return getRawInfoClientPromise(1);
      }
  
      /**
       * infosClient mode 1
       * @returns {JQuery.PromiseBase<JSON>}
       */
      function getRawInfoClient0Promise() {
        return getRawInfoClientPromise(0);
      }
  
      /**
       *
       * @param sessionStorageKey
       * @returns {JQuery.PromiseBase}
       */
      function waitForSessionInfo(sessionStorageKey) {
        var TestFactory = WaitAsync.TestFactory,
          test = TestFactory.createFromObj({
            predicat: function() {
              return !!sessionStorage[sessionStorageKey];
            },
            maxCycles: 4,
            timeOut: 3000
          });
  
        WaitAsync.addTest(test);
  
        return $.when(test.getAsyncVal());
      }
  
      /**
       * demande de l'infosClient sous forme de promesse ou callback
       * en tenant compte du cache sessionStorage
       * @param mode
       * @param callBack
       * @param toUpdateOnlyDateServeur
       * @returns {JQuery.PromiseBase<JSON>}
       */
      function getInfos(mode, callBack, toUpdateOnlyDateServeur) {
        var SESSION_STORAGE_KEY =
          mode === 0 ? "info_client" : "info_client_" + mode;
  
        return waitForSessionInfo(SESSION_STORAGE_KEY)
          .then(function() {
            return getRawInfoClientPromise(mode, toUpdateOnlyDateServeur);
          })
          .then(function() {
            var infoJson = JSON.parse(
              sessionStorage[SESSION_STORAGE_KEY] || null
            );
  
            if (typeof callBack === "function") {
              callBack(infoJson);
            }
  
            return infoJson;
          })
          .fail(function() {
            var errObj = Array.from(arguments);
  
            Log.log(errObj);
          });
      }
  
      return {
        getRawInfoClientPromise: getRawInfoClientPromise,
        getRawInfoClient1Promise: getRawInfoClient1Promise,
        getRawInfoClient0Promise: getRawInfoClient0Promise,
        getInfos: getInfos,
        $ajaxRequest: $ajaxRequest
      };
    })();
  
    infosClientMode1Util = (function infosClientMode1Util() {
      "use strict";
  
      /**
       * @description recuperation de l'infoClient en mode = 1
       * @param {function=} callBack
       * @return {JQuery.PromiseBase<JSON>}
       */
      function getInfos(_callBack) {
        return infosClientRequestUtil.getInfos(1, _callBack);
      }
  
      function refreshInfosSession() {
        Log.log({
          debug: {
            date: new Date(),
            refreshInfosSession: {
              message: "refresh infosClient 1..."
            }
          }
        });
        return getInfos(null, true);
      }
  
      function getCodeSiegeGerant(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var codeSiegeGerant = null;
            // Code de test en dur
            Log.log({
              infos: infos
            });
            /*
                      {
                          "codeSiegeGerant":"00799",
                          "idCompteIndividuel":"0",
                          "iban":"***********************5860",
                          "libelleSiegeGerant":"PARIS OPERA GARNIER"
                      }
                      */
            var codeSiegeGerantArr = access(
              infos,
              "data.agenceNet.listeCompteDetenu"
            ); // "data.agenceNet.listeCompteDetenu.codeSiegeGerant"
            codeSiegeGerant = (!$.isEmptyObject(codeSiegeGerantArr)
              ? codeSiegeGerantArr
              : []
            ).map(function(item) {
              return item.codeSiegeGerant;
            });
            return codeSiegeGerant;
          })
          .then(function(codeSiegeGerant) {
            callBack(codeSiegeGerant);
  
            return codeSiegeGerant;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      return {
        refreshAsyncInfosSession: refreshInfosSession,
        getAsyncInfos: getInfos,
        getAsyncCodeSiegeGerant: getCodeSiegeGerant
      };
    })();
  
    infosClientMode0Util = (function infosClientMode0Util() {
      "use strict";
  
      var access = safeAccess;
  
      /**
       * @description recuperation de l'infoClient en mode = 0
       * @param {function=} callBack
       * @return {JQuery.PromiseBase<JSON>}
       */
      function getInfos(_callBack) {
        return infosClientRequestUtil
          .getInfos(0, _callBack)
          .then(function isMessageOK(info) {
            var isMessageOK = info.message === "OK";
  
            return isMessageOK ? info : $.Deferred().reject(info);
          });
      }
  
      /**
       * @description rafraichissement de la session infoClient (sans modifier le contenu de l'infoClient en sessionStorage)
       * @return {JQuery.PromiseBase<JSON>}
       */
      function refreshInfosSession() {
        Log.log({
          debug: {
            date: new Date(),
            refreshInfosSession: {
              message: "refresh infosClient 0..."
            }
          }
        });
        return getInfos(null, true);
      }
  
      /**
       * @description recuperation des 5 premiers chiffres des identifiantSGIRattache
       * @param {function=} _callBack  - optional
       * @returns {{JQuery.PromiseBase<string[]>}}
       */
      function getCodeSiegeGerant(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            /**
             * @description infos.data.contrat.comptes
             * @type {object[]}
             */
            var comptes = [];
            /**
             * @description data.contrat.comptes[i].identifiantSGIRattache
             * @type {string[]}
             */
            var codeSiegeGerant;
  
            /**
             * @template T
             * @param {Array<T>} arr
             * @return {Array<T>} - les éléments du tableau deviennent uniques
             */
            function makeUniq(arr) {
              return Array.from(new Set(arr));
            }
  
            comptes = access(infos, "data.contrat.comptes");
            codeSiegeGerant = (!$.isEmptyObject(comptes) ? comptes : [])
              .map(function(compte) {
                return compte.identifiantSGIRattache;
              })
              .filter(function(identifiant) {
                return !!identifiant;
              })
              .map(function(identifiant) {
                return identifiant.substring(0, 5);
              });
  
            return makeUniq(codeSiegeGerant);
          })
          .then(function(codeSiegeGerant) {
            callBack(codeSiegeGerant);
  
            return codeSiegeGerant;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       *
       * @param _callBack
       * @returns {*}
       */
      function getNombreMessage(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var nbreMsg = access(infos, "data.abonnement.nombreMessageBMMNonLus");
            callBack(nbreMsg);
  
            return nbreMsg;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.indicateurs.indicPriority"
       * @param _callBack
       * @returns {*}
       */
      function isAsyncClientPriority(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var isPriority = access(infos, "data.indicateurs.indicPriority");
            callBack(isPriority);
  
            return isPriority;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.civilite"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncClientCiviliteCode(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var civilite = access(infos, "data.client.civilite");
            callBack(civilite);
  
            return civilite;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.dateNaissance"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncDateNaissance(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var dateNaissance = access(infos, "data.client.dateNaissance");
            callBack(dateNaissance);
  
            return dateNaissance;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.nomComplet"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncNomComplet(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var nomComplet = access(infos, "data.client.nomComplet");
            callBack(nomComplet);
            Log.log({
              nomComplet: nomComplet
            });
  
            return nomComplet;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.prenom"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncPrenom(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var prenom = access(infos, "data.client.prenom");
            callBack(prenom);
  
            return prenom;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.ikpiPersonnePhysique"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncIkpiPersonnePhysique(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var ikpiPersonnePhysique = access(
              infos,
              "data.client.ikpiPersonnePhysique"
            );
            callBack(ikpiPersonnePhysique);
  
            return ikpiPersonnePhysique;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       * key = "data.client.ikpiPersonne"
       * @param _callBack
       * @returns {*}
       */
      function getAsyncIkpiPersonne(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var ikpiPersonne = access(infos, "data.client.ikpiPersonne");
            callBack(ikpiPersonne);
  
            return ikpiPersonne;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       *
       * @param _callBack
       * @returns {*}
       */
      function getAsyncInformationsIdentification(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var infos = access(infos, "data.informationsIdentification");
            callBack(infos);
  
            return infos;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       *
       * @returns {*}
       */
      function getAsyncDateDerniereIdentification() {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getAsyncInformationsIdentification(callBack)
          .then(function(infos) {
            return (infos || {}).dateDerniereIdentification;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      function getAsyncIdentLastDateObj() {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getAsyncDateDerniereIdentification(callBack)
          .then(function(infos) {
            GlobalSite.checkDependency("moment");
  
            var mDate = moment(infos, "DDMMYYYY"),
              days = mDate.format("DD"),
              months = mDate.format("MM"),
              year = mDate.format("YYYY");
  
            return {
              days: days,
              months: months,
              year: year
            };
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       *
       * @returns {*}
       */
      function getAsyncHeureDerniereIdentification() {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getAsyncInformationsIdentification(callBack)
          .then(function(infos) {
            return (infos || {}).heureDerniereIdentification;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      function getAsyncIdentLastHourObj() {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getAsyncHeureDerniereIdentification(callBack)
          .then(function(infos) {
            GlobalSite.checkDependency("moment");
  
            var mDate = moment(infos, "HHmmss"),
              hours = mDate.format("HH"),
              minutes = mDate.format("mm"),
              secondes = mDate.format("ss");
  
            return {
              hours: hours,
              minutes: minutes,
              secondes: secondes
            };
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      /**
       *
       * @returns {*}
       */
      function getAsyncTypeGrille() {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getAsyncInformationsIdentification(callBack)
          .then(function(infos) {
            return (infos || {}).typeGrille;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      // agregation
      function getAsyncIndicAgregation(_callBack) {
        var callBack = typeof _callBack === "function" ? _callBack : $.noop;
  
        return getInfos()
          .then(function(infos) {
            var infoAgr = access(infos, "data.indicateurs.indicAgregation");
            callBack(infoAgr);
  
            Log.log({
              infoAgr: infoAgr
            });
  
            return infoAgr;
          })
          .fail(function(error) {
            Log.error(error);
          });
      }
  
      return {
        getAsyncIndicAgregation: getAsyncIndicAgregation,
        refreshAsyncInfosSession: refreshInfosSession,
        getAsyncInfos: getInfos,
        getAsyncCodeSiegeGerant: getCodeSiegeGerant,
        getAsyncNombreMessage: getNombreMessage,
        isAsyncClientPriority: isAsyncClientPriority,
        getAsyncClientCiviliteCode: getAsyncClientCiviliteCode,
        getAsyncDateNaissance: getAsyncDateNaissance,
        getAsyncNomComplet: getAsyncNomComplet,
        getAsyncPrenom: getAsyncPrenom,
        //---------------------------------
        getAsyncInformationsIdentification: getAsyncInformationsIdentification,
        getAsyncDateDerniereIdentification: getAsyncDateDerniereIdentification,
        getAsyncIdentLastDateObj: getAsyncIdentLastDateObj,
        getAsyncHeureDerniereIdentification: getAsyncHeureDerniereIdentification,
        getAsyncIdentLastHourObj: getAsyncIdentLastHourObj,
        getAsyncTypeGrille: getAsyncTypeGrille,
        //---------------------------------
        getAsyncIkpiPersonnePhysique: getAsyncIkpiPersonnePhysique,
        getAsyncIkpiPersonne: getAsyncIkpiPersonne
      };
    })();
  
    //===========================================
    GlobalSite.exportToGlobalSite({
      infosClientRequestUtil: infosClientRequestUtil,
      infosClientMode1Util: infosClientMode1Util,
      infosClientMode0Util: infosClientMode0Util
    });
    //===========================================
  })();
  
(function docCookies() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  var exportToGlobalSite = GlobalSite.checkDependency(
    "GlobalSite.exportToGlobalSite"
  );

  var docCookies = {
    getItem: function (sKey) {
      if (!sKey) {
        return null;
      }
      return (
        decodeURIComponent(
          document.cookie.replace(
            new RegExp(
              "(?:(?:^|.*;)\\s*" +
                encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
                "\\s*\\=\\s*([^;]*).*$)|^.*$"
            ),
            "$1"
          )
        ) || null
      );
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires =
              vEnd === Infinity
                ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT"
                : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie =
        encodeURIComponent(sKey) +
        "=" +
        encodeURIComponent(sValue) +
        sExpires +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "") +
        (bSecure ? "; secure" : "");
      return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) {
        return false;
      }
      document.cookie =
        encodeURIComponent(sKey) +
        "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
        (sDomain ? "; domain=" + sDomain : "") +
        (sPath ? "; path=" + sPath : "");
      return true;
    },
    hasItem: function (sKey) {
      if (!sKey) {
        return false;
      }
      return new RegExp(
        "(?:^|;\\s*)" +
          encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") +
          "\\s*\\="
      ).test(document.cookie);
    },
    keys: function () {
      var aKeys = document.cookie
        .replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "")
        .split(/\s*(?:\=[^;]*)?;\s*/);
      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }
      return aKeys;
    }
  };

  exportToGlobalSite({
    docCookies: docCookies
  });
})();

(function FormHelperJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies("GlobalSite.exportGlobally");
  //------------------------------------------------
  var FormHelper = {
    currentSessionStorage: new Object(),

    showResetButton: function($current_element) {
      if ($current_element.siblings(".reset-input").length == 0) {
        $('<span class="reset-input" />').insertAfter($current_element);
      } else {
        $current_element.siblings(".reset-input").removeClass("hidden");
      }
    },
    hideResetButton: function($current_element) {
      $current_element.siblings(".reset-input").addClass("hidden");
    },
    resetInput: function($elem) {
      $elem.on("click.form-reset-field", ".reset-input", function() {
        $(this)
          .addClass("hidden")
          .siblings(".form-control")
          .val("")
          .focus();
      });
    },
    textareaCompteur: function() {
      // Pour IE, on enlève ce qui dépasse car maxlength n'est pas supporté sur les textareas dans IE
      $("textarea[maxlength]").on("keyup blur", function() {
        // Store the maxlength and value of the field.
        var maxlength = $(this).attr("maxlength");
        var val = $(this).val();

        // Trim the field if it has content over the maxlength.
        if (val.length > maxlength) {
          $(this).val(val.slice(0, maxlength));
        }
      });

      function autoGrow(oField) {
        if (oField.tagName == "TEXTAREA") {
          if (oField.scrollHeight > oField.clientHeight) {
            oField.style.height = oField.scrollHeight + "px";
          }
        }
      }

      var $field = $(".js-caractere-restant")
        .parents("form")
        .find("textarea,.js-input-compteur");
      $field.each(function(index, elem) {
        autoGrow($(this)[0]);
        var max_char = $(this).attr("maxlength"),
          $current_field = $(this);

        // Si on n'a pas de compteur on reste
        if (
          $current_field.parents("form").find(".js-caractere-restant").length ==
          0
        ) {
          return;
        }
        $current_field.on("keyup", function() {
          autoGrow($(this)[0]);
          setTimeout(function() {
            var str = _get("next.formhelper.charact1", "caractères restants"),
              current_text = $current_field.val(),
              remaining = max_char - current_text.length;

            if (remaining <= 1) {
              str = _get("next.formhelper.charact2", "caractère restant");
            }
            $current_field
              .parents("form")
              .find(".js-caractere-restant")
              .html("<span>" + remaining + "</span> " + str);
          }, 10);
        });
      });
    },
    resetButton: function() {
      if ($("form").length == 0) {
        return;
      }
      $('button[type="reset"]').click(function() {
        $(this)
          .parents("form")
          .find(".valid")
          .each(function() {
            $(this)
              .removeClass("valid")
              .parent()
              .removeClass("fixFFSelect");
          });
      });
    },
    autofill: function() {
      //L'autofill n'a lieu que si le name du form existe dans le fichier de config rsc\contrib\script\client\simulation-credit.js
      $("form").each(function() {
        currentForm = $(this);
        formName = $(this).attr("name");

        ElToBeClicked = new Array();

        if (typeof _fieldsToStoreInSession == "undefined") {
          return;
        }

        if (typeof _fieldsToStoreInSession[formName] != "undefined") {
          //On essaie de remplir les éléments du formulaire à partir des données en sessionStorage
          if (sessionStorage.getItem(formName) != null) {
            formDatas = JSON.parse(
              sessionStorage.getItem(currentForm.attr("name"))
            );

            currentForm.find("input").each(function() {
              if ($(this).attr("type") == "text" && $(this).val() != "") {
                return;
              } //Au cas où un champs serait pré-rempli en dur

              if ($(this).attr("type") == "checkbox") {
                if (formDatas[$(this).attr("name")]) {
                  $(this).prop("checked", "checked");
                } else {
                  $(this).removeAttr("checked");
                }
              } else if (
                $(this).attr("type") == "hidden" ||
                $(this).hasClass("typeHidden")
              ) {
                //Ce cas est utilisé notamment dans le cadre des "data-send-value"
                if (formDatas[$(this).attr("name")]) {
                  $(this).val(formDatas[$(this).attr("name")]);

                  var currentValue = formDatas[$(this).attr("name")];
                  //Cas des data-send-value :
                  //Pour que l'élément qui envoie la valeur à l'input (data-send-value) ait sa classe "active" ou autre selon les pages
                  //Il faut qu'il soit clické.
                  //Or si on clique maintenant, on enregistrera une donnée en sessionStorage alors qu'on n'a pas fini l'autofill
                  //et donc on perdra des données.
                  //
                  //=> On va plutôt stocker l'élément dans l'array (ElToBeClicked) qui liste les éléments qui doivent recevoir un clic en fin d'autofill
                  //
                  ElToBeClicked.push(
                    $(
                      '[name="' +
                        currentForm.attr("name") +
                        '"] [name="' +
                        formDatas[$(this).attr("name")] +
                        '"]'
                    )
                  );

                  //Cas des custom dropDown :
                  //On simule un clic sur le li adéquat dans le dropdown
                  var _liToBeClicked;
                  $(this)
                    .parents(".dropdown-container")
                    .find(".hidden-value")
                    .each(function() {
                      if ($.trim($(this).html()) == currentValue) {
                        ElToBeClicked.push(
                          $(this)
                            .parents("li")
                            .first()
                        );
                      }
                    });
                }
              } else if ($(this).attr("type") == "radio") {
                if (formDatas[$(this).attr("name")]) {
                  $(this).prop("checked", false);
                  if ($(this).val() == formDatas[$(this).attr("name")]) {
                    $(this).prop("checked", true);
                    var label = $('label[for="' + $(this).attr("id") + '"]');
                    if (
                      label.is("[data-toggle-section]") ||
                      label.is("[data-toggle-radio-section]") ||
                      label.is("[data-show-section]") ||
                      label.is("[data-hide-section]") ||
                      label.is("[data-make-active]") ||
                      label.is("[data-make-inactive]") ||
                      label.is("[data-send-value]")
                    ) {
                      if (label.length > 0) {
                        label.click();
                      }
                    }
                  }
                }
              } else {
                $(this).val(formDatas[$(this).attr("name")]);
                FormHelper.removeGroupValidation($(this), true);
              }

              if (formDatas[$(this).attr("name")]) {
                FormHelper.currentSessionStorage[$(this).attr("name")] =
                  formDatas[$(this).attr("name")];
              }
            });

            currentForm.find("textarea").each(function() {
              if (formDatas[$(this).attr("name")]) {
                $(this).text(formDatas[$(this).attr("name")]);
              }
            });

            currentForm.find("select").each(function() {
              if (formDatas[$(this).attr("name")]) {
                $(this)
                  .find("option")
                  .each(function() {
                    $(this).removeAttr("selected");
                  });

                $(this)
                  .find('[value="' + formDatas[$(this).attr("name")] + '"]')
                  .prop("selected", true);
                FormHelper.currentSessionStorage[$(this).attr("name")] =
                  formDatas[$(this).attr("name")];
              }
            });

            //L'autofill est terminé, on peut clicker sur les éléments qui doivent l'être
            for (var i = 0; i < ElToBeClicked.length; i++) {
              ElToBeClicked[i].click();
            }
          }
        }
      });
    },
    /*
     * Fonction qui effectue des calculs entre plusieurs champs du formulaire
     * Les champs impliqués sont définis dans rsc\contrib\script\client\simulation-credit.js
     *  nbrOfDigits   Le nombre de chiffres après la virgule
     */
    makeCalculations: function(nbrOfDigits) {
      if (typeof nbrOfDigits == "undefined") {
        nbrOfDigits = 0;
      }
      if (typeof _calculationGroups != "undefined") {
        for (p in _calculationGroups) {
          if (_calculationGroups.hasOwnProperty(p)) {
            _calculationGroups[p].valToDisplay = 0;
            currentName = _calculationGroups[p].name;
            currentGroup = $('[name="' + currentName + '"]');
            var elToInclude = _calculationGroups[p].addItems.concat(
              _calculationGroups[p].subItems
            );
            if (currentGroup.length > 0) {
              for (var i = 0; i < elToInclude.length; i++) {
                currentGroup
                  .find('[name="' + elToInclude[i] + '"]')
                  .attr("group-num", p)
                  .change(function() {
                    groupNum = $(this).attr("group-num");

                    currentGroup = $(
                      '[name="' + _calculationGroups[groupNum].name + '"]'
                    );

                    _calculationGroups[groupNum].valToDisplay = 0;
                    for (
                      var l = 0;
                      l < _calculationGroups[groupNum].addItems.length;
                      l++
                    ) {
                      _calculationGroups[groupNum].valToDisplay =
                        Number(_calculationGroups[groupNum].valToDisplay) +
                        Number(
                          $.trim(
                            Number(
                              replaceComa(
                                currentGroup
                                  .find(
                                    'input[name="' +
                                      _calculationGroups[groupNum].addItems[l] +
                                      '"]'
                                  )
                                  .val()
                              )
                            )
                          )
                        );
                    }

                    for (
                      var m = 0;
                      m < _calculationGroups[groupNum].subItems.length;
                      m++
                    ) {
                      _calculationGroups[groupNum].valToDisplay =
                        Number(_calculationGroups[groupNum].valToDisplay) -
                        Number(
                          $.trim(
                            Number(
                              replaceComa(
                                currentGroup
                                  .find(
                                    'input[name="' +
                                      _calculationGroups[groupNum].subItems[m] +
                                      '"]'
                                  )
                                  .val()
                              )
                            )
                          )
                        );
                    }

                    if (_calculationGroups[groupNum].valToDisplay < 0) {
                      _calculationGroups[groupNum].valToDisplay = 0;
                    }

                    if (!isNaN(_calculationGroups[groupNum].valToDisplay)) {
                      for (
                        var j = 0;
                        j < _calculationGroups[groupNum].result.length;
                        j++
                      ) {
                        currentGroup
                          .find(
                            '[name="' +
                              _calculationGroups[groupNum].result[j] +
                              '"]'
                          )
                          .html(
                            addThousandsSep(
                              formatNumber(
                                _calculationGroups[groupNum].valToDisplay,
                                nbrOfDigits
                              )
                            )
                          );
                      }
                    }
                  });
              }

              //Pour que le résultat de l'addition soit déjà visible après pré-remplissage éventuel
              //On effectue le calcul une première fois sans change
              for (var n = 0; n < _calculationGroups[p].addItems.length; n++) {
                _calculationGroups[p].valToDisplay =
                  Number(_calculationGroups[p].valToDisplay) +
                  Number(
                    $.trim(
                      Number(
                        replaceComa(
                          currentGroup
                            .find(
                              'input[name="' +
                                _calculationGroups[p].addItems[n] +
                                '"]'
                            )
                            .val()
                        )
                      )
                    )
                  );
              }

              for (var o = 0; o < _calculationGroups[p].subItems.length; o++) {
                _calculationGroups[p].valToDisplay =
                  Number(_calculationGroups[p].valToDisplay) -
                  Number(
                    $.trim(
                      Number(
                        replaceComa(
                          currentGroup
                            .find(
                              'input[name="' +
                                _calculationGroups[p].subItems[o] +
                                '"]'
                            )
                            .val()
                        )
                      )
                    )
                  );
              }

              if (_calculationGroups[p].valToDisplay < 0) {
                _calculationGroups[p].valToDisplay = 0;
              }

              if (!isNaN(_calculationGroups[p].valToDisplay)) {
                for (var k = 0; k < _calculationGroups[p].result.length; k++) {
                  currentGroup
                    .find('[name="' + _calculationGroups[p].result[k] + '"]')
                    .html(
                      addThousandsSep(
                        formatNumber(
                          _calculationGroups[p].valToDisplay,
                          nbrOfDigits
                        )
                      )
                    );
                }
              }
            }
          }
        }
      }
    },
    cancelCalculations: function() {
      if (typeof _calculationGroups != "undefined") {
        for (p in _calculationGroups) {
          if (_calculationGroups.hasOwnProperty(p)) {
            _calculationGroups[p].valToDisplay = 0;
            currentName = _calculationGroups[p].name;

            currentGroup = $('[name="' + currentName + '"]');
            if (currentGroup.length > 0) {
              for (var i = 0; i < _calculationGroups[p].addItems.length; i++) {
                currentGroup
                  .find('[name="' + _calculationGroups[p].addItems[i] + '"]')
                  .attr("group-num", p)
                  .unbind();
              }
            }
          }
        }
      }
    },
    formValidation: function() {
      if (typeof $.validator == "undefined") {
        trace("validator undefined");
        return;
      }
      jQuery.extend(jQuery.validator.messages, {
        required: "Veuillez renseigner ce champ.",
        remote: "Veuillez remplir ce champ pour continuer.",
        email: "Veuillez entrer une adresse email valide.",
        url: "Veuillez entrer une URL valide.",
        date: "Veuillez entrer une date valide.",
        dateISO: "Veuillez entrer une date valide (ISO).",
        number: "Veuillez entrer un nombre valide.",
        digits: "Veuillez entrer une valeur num&eacute;rique.",
        creditcard: "Veuillez entrer un numéro de carte de crédit valide.",
        equalTo: "Veuillez entrer une nouvelle fois la même valeur.",
        accept: "Veuillez entrer une valeur avec une extension valide.",
        maxlength: jQuery.validator.format(
          "Veuillez ne pas entrer plus de {0} caractères."
        ),
        minlength: jQuery.validator.format(
          "Veuillez entrer au moins {0} caractères."
        ),
        rangelength: jQuery.validator.format(
          "Veuillez entrer entre {0} et {1} caractères."
        ),
        range: jQuery.validator.format(
          "Veuillez entrer une valeur entre {0} et {1}."
        ),
        max: jQuery.validator.format(
          "Veuillez entrer une valeur inférieure ou égale à {0}."
        ),
        min: jQuery.validator.format(
          "Veuillez entrer une valeur supérieure ou égale à {0}."
        ),
        portable: "Veuillez renseigner un numéro de téléphone mobile",
        "portable-msg":
          "Veuillez renseigner votre numéro de téléphone à 10 chiffres commençant par 06 ou 07",
        telephone: "Veuillez renseigner un numéro de téléphone valide",
        "tel-fixe": "Veuillez renseigner un numéro de téléphone valide",
        "tel-fixe-msg":
          "Veuillez entrer un numéro fixe valide à 10 chiffres qui ne commence pas par 06 ou 07",
        postal: "Veuillez entrer un code postal valide",
        "complexe-password":
          "Le format du mot de passe doit être de 6 à 25 caractères et ne peut pas avoir plus de 3 caractères identiques consécutifs",
        notequal: "Cette date a déjà été sélectionnée. Merci de la modifier.",
        alphanum:
          "Seuls les caractères alphanumériques sont autorisés (lettres, chiffres, aucun accent ni caractère de ponctuation)",
        pourcentage: "La valeur entrée ne peut dépasser 100%",
        entier: "Veuillez entrer un nombre sans virgule et supérieur à 0",
        positive: "Veuillez entrer une valeur supérieure à zéro",
        "js-percent-des-input":
          "Le total de répartition de votre investissement ne peut pas dépasser 100 %",
        "multiple-500": "Veuillez entrer un multiple de 500",
        "js-date-obseque": "Veuillez renseigner une date de naissance valide",
        "annees-assur":
          "Vous ne pouvez pas souscrire dans le cadre de la loi Consommation si cela ne concerne pas un logement actuel déjà assuré depuis au moins 1 an et dont l’échéance principale a déjà été renouvelée 1 fois",
        bnpphamon:
          "Si vous êtes déjà client BNP Paribas / Hello bank!, vous ne pouvez pas souscrire dans le cadre de la loi Consommation qui nécessite un changement d’assureur",
        nonehamon:
          "Dans le cadre de la loi Consommation (Loi Hamon), le nom exact de votre compagnie est nécessaire",
        oneCheckbox: "Veuillez choisir au moins une option"
      });

      if ($(".validate-form").length == 0) {
        return;
      }

      var form = $(".validate-form"),
        $field_montant = $(".js-montant-field");

      $field_montant.on("keypress", function(e) {
        var charCode = e.which ? e.which : e.keyCode;
        if (
          charCode > 31 &&
          charCode != 44 &&
          charCode != 46 &&
          (charCode < 48 || charCode > 57)
        ) {
          return false;
        }
        return true;
      });
      $field_montant.on("paste", function() {
        var $elem = $(this);
        // Settimeout pour récupérer la valeur du champ après avoir collé le texte
        setTimeout(function() {
          var regex = /^(\d|\.|\,)+?$/;
          if (!regex.test($elem.val())) {
            $elem.val("");
          }
        }, 10);
      });
      $.validator.addMethod("multiple-500", function(value, element) {
        if (value % 500 == 0) {
          return true;
        } else {
          return false;
        }
      });

      $.validator.addMethod("annees-assur", function(value, element) {
        if (value == "0") {
          return false;
        } else {
          return true;
        }
      });

      $.validator.addMethod("bnpphamon", function(value, element) {
        if (
          $("[name=motif-resiliation]").val() == "4" &&
          $("[name=assureur-actuel]").val() == "7"
        ) {
          return false;
        } else {
          return true;
        }
      });
      $.validator.addMethod("nonehamon", function(value, element) {
        if (
          $("[name=motif-resiliation]").val() == "4" &&
          $("[name=assureur-actuel]").val() == ""
        ) {
          return false;
        } else {
          return true;
        }
      });

      $("[name=assureur-actuel]").on("change", function() {
        $("[name=motif-resiliation]").change();
      });

      $.validator.addMethod("js-percent-des-input", function(value, element) {
        if (value == 0) {
          return true;
        }

        // Validation des champs pourcentage
        var totalPourc = 0,
          pourcInputs = $(element)
            .parents(".percent-group-validation")
            .find(".js-percent-des-input");

        pourcInputs.each(function() {
          totalPourc = Number(totalPourc) + Number($(this).val());
        });

        if (totalPourc > 100) {
          return false;
        } else {
          return true;
        }
      });

      $.validator.addMethod("positive", function(value, element) {
        if (isNaN(value)) {
          return true;
        }
        return this.optional(element) || value > 0;
      });

      $.validator.addMethod("number", function(value, element) {
        var value = replaceDot(value);
        $(element).val(value);
        return this.optional(element) || /^\d+,?\d*$/.test(value);
      });

      // Add custom validation
      $.validator.addMethod("portable", function(value, element) {
        var pattern = /^0(6|7)[0-9]{8}$/gi;
        return this.optional(element) || pattern.test(value);
      });
      $.validator.addMethod("portable-msg", function(value, element) {
        var pattern = /^0(6|7)[0-9]{8}$/gi;
        return this.optional(element) || pattern.test(value);
      });

      // Add custom validation
      $.validator.addMethod("oneCheckbox", function(value, element) {
        var siblings = $(
          "input[data-name=" + $(element).attr("data-name") + "]"
        );
        var length = 0;
        siblings.each(function() {
          if ($(this)[0].checked) length++;
        });

        console.log(length);

        if (length > 0) return true;
        else return false;
      });

      // Add custom validation
      $.validator.addMethod("telephone", function(value, element) {
        var pattern = /^0[1-9][0-9]{8}$/gi;
        return this.optional(element) || pattern.test(value);
      });

      $.validator.addMethod("entier", function(value, element) {
        return this.optional(element) || value.indexOf(",") == -1;
      });

      $.validator.addMethod("pourcentage", function(value, element) {
        value = value.replace(",", ".");

        var pattern = /^\d+$/;
        if (!pattern.test(value)) {
          return true;
        }

        return this.optional(element) || value <= 100;
      });

      // Add custom validation
      $.validator.addMethod("tel-fixe", function(value, element) {
        var pattern = /^0(1|2|3|4|5|9)[0-9]{8}$/gi;
        return this.optional(element) || pattern.test(value);
      });

      // Add custom validation
      $.validator.addMethod("tel-fixe-msg", function(value, element) {
        var pattern = /^0(1|2|3|4|5|9)[0-9]{8}$/gi;
        return this.optional(element) || pattern.test(value);
      });

      // Add custom validation
      $.validator.addMethod("postal", function(value, element) {
        var pattern = /^[0-9]{5}$/gi;
        return this.optional(element) || pattern.test(value);
      });

      $.validator.addMethod("date", function(value, element) {
        var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        var check = false;

        if (value == "") {
          return true;
        }
        // console.log(re.test(value));
        if (re.test(value)) {
          var split = value.split("/"),
            dd = parseInt(split[0], 10),
            mm = parseInt(split[1], 10),
            yyyy = parseInt(split[2], 10),
            date = new Date(yyyy, mm - 1, dd);

          if (
            date.getFullYear() == yyyy &&
            date.getMonth() == mm - 1 &&
            date.getDate() == dd
          ) {
            check = true;
          } else {
            return false;
          }
        }

        //la date affichée est elle conforme (elle a peut-être été entrée par l'utilisateur)
        if ($(element).hasClass("js-mindate-today")) {
          //La date ne peut pas être dans le passé
          var today = new Date();
          var startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          return date.getTime() > startOfToday.getTime() - 1;
        } else if ($(element).hasClass("js-maxdate-today")) {
          //La date ne peut pas être dans le futur
          var today = new Date();
          var demain = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1
          );

          return demain.getTime() > date.getTime();
        } else if ($(element).hasClass("js-maxdate-60")) {
          var today = new Date();
          var dans60jours = new Date(today.getTime() + 60 * 24 * 3600 * 1000);

          return date.getTime() < dans60jours.getTime();
        }

        return check;
      });
      $.validator.addMethod("complexe-password", function(value, element) {
        var pattern = /^(?!(.)\1\1\1).{6,26}$/;
        return this.optional(element) || pattern.test(value);
      });

      $.validator.addMethod("notequal", function(value, element) {
        if (
          typeof $(element).attr("data-notequal") == "undefined" ||
          $(element).attr("data-notequal") == false
        ) {
          return this.optional(element) || true;
        }

        var cpt = 0;
        $('[data-notequal="' + $(element).attr("data-notequal") + '"]').each(
          function() {
            if ($(this).val() == value) {
              cpt++;
            }
          }
        );

        return this.optional(element) || cpt <= 1;
      });

      $.validator.addMethod("alphanum", function(value, element) {
        var pattern = /^[a-z0-9]+$/i;

        return this.optional(element) || pattern.test(value);
      });

      $(".validate-form").each(function() {
        $(this).validate(FormHelper.form_validator_config);
        FormHelper.resetInput($(this));
      });
      $(".validate-form select").on("change", function() {
        $(this).valid();

        //Correction bug épaisseur trait vert sur listes déroulantes sous Firefox
        if (navigator.userAgent.indexOf("Firefox") != -1) {
          $("form select")
            .parent()
            .removeClass("fixFFSelect");
          $("form select.valid, form select.error")
            .parent()
            .addClass("fixFFSelect");
        }
      });

      $("[data-validation-error-msg]").each(function(index) {
        var error_msg = $(this).data("validation-error-msg");
        $(this).rules("add", {
          messages: {
            required: error_msg,
            digits: error_msg
          }
        });
      });

      (function() {
        var $form_custom_dropdown = $("[id^=select-compte-debiter]");
        if ($form_custom_dropdown.length == 0) {
          return;
        }

        $form_custom_dropdown.on("select-custom-dropdown", function() {
          $(this)
            .removeClass("error")
            .addClass("valid")
            .next(".error")
            .remove();
        });

        $(".validate-form").on("submit", function(e) {
          var error = false;
          $form_custom_dropdown.each(function() {
            if (!$(this).hasClass("valid") && $(this).is(":visible")) {
              $(this).addClass("error");
              $(this)
                .after('<em class="error">Veuillez sélectioner un compte.</em>')
                .show();

              error = true;

              return false;
            }
          });
          if (error) {
            return false;
          }
        });
      })();
    },

    form_validator_config: {
      errorElement: "em",
      errorPlacement: function(error, element) {
        if ($(element).hasClass("iban")) {
          return;
        } // Pas de message d'erreur pour iban

        //L'idée ici est de déclancher un évènement sur l'élément
        // qui est validé pour indiquer qu'il n'est pas valide,
        // et en même temps passer en paramètre le nom de l'erreur
        // (Exemple d'utilisation dans dynacaap titre1)
        if ($(element).hasClass("custom-msg")) {
          var errorName = "";
          for (prop in jQuery.validator.messages) {
            if (jQuery.validator.messages[prop] == error[0].textContent) {
              errorName = prop;
            }
          }

          element.trigger("not-valid", [errorName, error]);
          return;
        }

        if (
          element.get(0).tagName.toLowerCase() == "input" &&
          $(element)
            .attr("type")
            .toLowerCase() == "checkbox"
        ) {
          if ($(element).parents(".js-carrousel-cards-built").length > 0) {
            //Input faisant partie du carrousel
            var _carrousel = $(element).parents(".js-carrousel-cards-built");
            if (_carrousel.find('input[type="checkbox"]:checked').length == 0) {
              _carrousel.after(
                '<em class="error">Veuillez sélectionner au moins une carte</em>'
              );
              return;
            }
            return;
          }

          var checkboxInputs = $(
            'input[type="checkbox"][name="' + $(element).attr("name") + '"]'
          );

          if (checkboxInputs.length > 1) {
            if (checkboxInputs.first().data("validation-error-msg")) {
              var code =
                '<em class="error">' +
                checkboxInputs.first().data("validation-error-msg") +
                "</em>";
            } else {
              var code =
                '<em class="error">Veuillez sélectionner au moins une proposition</em>';
            }
            var checkboxParents = checkboxInputs.first().parents();
            for (var i = 0; i < checkboxInputs.length; i++) {
              checkboxParents = checkboxParents.has(checkboxInputs[i]);
            }
            checkboxParents.first().after(code);
            return;
          }
        }

        if (
          element.get(0).tagName.toLowerCase() == "input" &&
          $(element)
            .attr("type")
            .toLowerCase() == "radio"
        ) {
          if ($(element).parents(".js-carrousel-cards-built").length > 0) {
            //Radio faisant partie d'un carrousel => étoile favoris à ne pas valider
            return;
          }

          var radioInputs = $(
            'input[type="radio"][name="' + $(element).attr("name") + '"]'
          );
          var radioParents = radioInputs.first().parents();
          for (var i = 0; i < radioInputs.length; i++) {
            radioParents = radioParents.has(radioInputs[i]);
          }

          var code =
            '<em class="error">Veuillez sélectionner une proposition</em>';
          if (radioInputs.filter("[data-validation-error-msg]").length > 0) {
            code =
              '<em class="error">' +
              radioInputs
                .filter("[data-validation-error-msg]")
                .first()
                .data("validation-error-msg") +
              "</em>";
          }
          if (radioParents.get(0).tagName.toLowerCase() == "tbody") {
            radioParents.parents("table").after(code);
            return;
          }
          radioParents.first().after(code);
          return;
        }
        if ($(element).next("button").length > 0) {
          $(element)
            .parent()
            .after(error);
          return;
        }
        if ($(element).parent(".inline-label").length > 0) {
          error.insertAfter($(element).parent(".inline-label"));
          return;
        }

        if ($(element).parent(".checkbox2").length > 0) {
          error.insertAfter($(element).parent(".checkbox2"));
          return;
        }

        // Error placement resizeBarre
        if ($(element).hasClass("range-barre")) {
          error.insertAfter($(element).closest(".curseur-2"));
          return;
        }
        // Error placement oneCheckbox
        if ($(element).hasClass("oneCheckbox")) {
          var container = $(element).closest(".oneCheckbox-wrapper");
          var customError = $(element).attr("data-validation-error-msg")
            ? $(element).attr("data-validation-error-msg")
            : false;
          if (customError) error.text(customError);
          if (container.find("em.error").length < 1) container.append(error);
          return;
        }

        if ($(element).hasClass("flag-autocomplete")) {
          $(element)
            .parent(".eac-flags")
            .append(error);
          return;
        }

        error.insertAfter(element);

        //Correction bug épaisseur trait vert sur listes déroulantes sous Firefox
        if (navigator.userAgent.indexOf("Firefox") != -1) {
          $("form select")
            .parent()
            .removeClass("fixFFSelect");
          $("form select.valid, form select.error")
            .parent()
            .addClass("fixFFSelect");
        }
      },

      ignore:
        ":hidden:not(.validate-item), .js-init-datepicker:not([required])",

      onfocusout: function(element, event) {
        var $current_element = $(element);
        if ($current_element.hasClass("js-disable-auto-validation")) {
          return;
        }
        if (
          $current_element.val().trim() == "" &&
          !$current_element.prop("required")
        ) {
          return;
        }
        // On ne valide pas les champs datepicker car au blur le champ va être en erreur,
        // on le valide au onclose du datepicker
        if ($current_element.hasClass("hasDatepicker")) {
          return;
        }

        // Valid current field on focus
        if ($current_element.valid()) {
          $current_element.trigger("is-valid");
          FormHelper.storeDatasInSession($current_element);
          FormHelper.hideResetButton($current_element);
          if (
            typeof $current_element.attr("data-group-validation") !=
              "undefined" &&
            $current_element.val() != ""
          ) {
            FormHelper.checkGroupValidation($current_element, false);
          }
        } else {
          // $current_element.trigger('not-valid');
          if (
            typeof $current_element.attr("data-group-validation") != "undefined"
          ) {
            FormHelper.checkGroupValidation($current_element, true);
          }

          // Affiche le bouton reset seulement si le champ est rempli
          if ($current_element.val() != "") {
            FormHelper.showResetButton($current_element);
          } else {
            FormHelper.hideResetButton($current_element);
          }
        }
      },
      onclick: function(element, event) {
        //Only used for checkboxes and radio
        var $current_element = $(element);
        if ($current_element.hasClass("js-disable-auto-validation")) {
          return;
        }
        FormHelper.storeDatasInSession($current_element);
      },
      onkeyup: function(element, event) {
        var $current_element = $(element);

        if ($current_element.hasClass("js-disable-auto-validation")) {
          return;
        }
        if ($current_element.hasClass("error")) {
          // Valide le champ seulement si il est en erreur
          if ($current_element.valid()) {
            $current_element.trigger("is-valid");
            FormHelper.hideResetButton($current_element);
          }
        }
      },
      invalidHandler: function(event, validator) {
        var errors = validator.numberOfInvalids();
        if (errors) {
          $(".form-error-messages").removeClass("hidden");
        } else {
          $(".form-error-messages").addClass("hidden");
        }
      },
      submitHandler: function(form) {
        if (
          $(form)
            .find(".percent-group-validation")
            .hasClass("error")
        ) {
          $(form)
            .find(".percent-group-validation")
            .find(".valid")
            .removeClass("valid");
          return false;
        }

        if (
          $("#total-montant-erreur").length > 0 &&
          !$("#total-montant-erreur").hasClass("hidden")
        ) {
          return false;
        }
        if ($(form).hasClass("custom-submit")) {
          $(form).trigger("submitting");
          return false;
        }
        form.submit();
      },
      rules: {
        duree_financement: {
          min: 2,
          max: 30
        }
      },
      messages: {
        duree_financement: {
          min:
            "La valeur de la durée de financement doit être comprise entre 2 et 30"
        },
        codeSMS: {
          required: "Veuillez saisir le code reçu par SMS"
        }
      }
    },
    checkGroupValidation: function(el, removeEl) {
      var _group = el.attr("data-group-validation");
      $('[data-group-validation="' + _group + '"]').each(function() {
        if (removeEl == false) {
          $(this).attr("required", false);
        } else {
          $(this).attr("required", true);
        }
      });
      if (removeEl == false) {
        el.attr("required", true);
      }
    },
    removeGroupValidation: function(el) {
      var _group = el.attr("data-group-validation");
      $('[data-group-validation="' + _group + '"]').each(function() {
        $(this).attr("required", false);
      });
    },
    storeDatasInSession: function(el) {
      //On enregistre les données de l'élément seulement s'il apparaît dans le fichier de config rsc\contrib\script\client
      if (typeof _fieldsToStoreInSession == "undefined") {
        return;
      }
      formName = el
        .parents("form")
        .first()
        .attr("name");
      elName = el.attr("name");
      var v = $.inArray(elName, _fieldsToStoreInSession[formName]);
      if (v != -1) {
        FormHelper.currentSessionStorage[elName] = el.val();
        sessionStorage.setItem(
          formName,
          JSON.stringify(FormHelper.currentSessionStorage)
        );
      }
    },
    emptyDatasInSession: function() {
      sessionStorage.clear();
    },
    placeholderPolyfill: function() {
      $("[placeholder]")
        .focus(function() {
          var input = $(this);
          if (input.val() == input.attr("placeholder")) {
            input.val("");
            input.removeClass("placeholder");
          }
        })
        .blur(function() {
          _blur($(this));
        });
      function _blur(input) {
        if (input.val() == "" || input.val() == input.attr("placeholder")) {
          input.addClass("placeholder");
          input.val(input.attr("placeholder"));
        }
      }

      $("[placeholder]").each(function() {
        _blur($(this));
      });
    }
  };

  //===========================================
  GlobalSite.exportGlobally({
    FormHelper: FormHelper
  });
  //===========================================
})();

(function GetURLParameterJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies("GlobalSite.exportGlobally");

  //------------------------------------------------
  function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split("&");
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split("=");
      if (sParameterName[0] == sParam) {
        return sParameterName[1];
      }
    }
  }
  //===========================================
  GlobalSite.exportGlobally({
    GetURLParameter: GetURLParameter
  });
  //===========================================
})();
(function CustomDropdownJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================
  var exportGlobally = GlobalSite.checkDependency("GlobalSite.exportGlobally");

  GlobalSite.checkDependency("$");

  var CustomDropdown = {
    init: function(valueSelectorFunc, contextSelector) {
      var _contextSelector = contextSelector ? contextSelector : "body";

      if ($(".dropdown-list-select", _contextSelector).length == 0) {
        return;
      }
      // Définition des classes
      var hidden_value_class = ".hidden-value",
        dropdown_container_class = ".dropdown-container",
        dropdown_selected_class = ".dropdown-selected",
        input_value_class = ".input-value",
        $dropdown = $(".dropdown", _contextSelector);

      // Selection d'un item de la liste
      function clickHandlerItemList(event) {
        if ($(this).is(".titleDisabled")) {
          return event.stopPropagation();
        }

        if (
          $(this).closest(".dropdown-enabled").length > 0 ||
          $(this).parents(".recherche-qualifie-container").length > 0 ||
          $("html").hasClass("maquette") ||
          $(this).parents(".auto-diagnostic-main-container").length > 0 ||
          $("body").find(".save-invest.conseil-enveloppe").length > 0
        ) {
          var $container = $(this).parents(dropdown_container_class),
            $elem = $container.find(dropdown_selected_class);

          $(this)
            .siblings()
            .removeClass("selected");
          $(this).addClass("selected");
          $(this).trigger("select-custom-dropdown");

          // Mise à jour de l'affichage
          $elem.html(
            typeof valueSelectorFunc === "function"
              ? valueSelectorFunc.bind(this)()
              : $(this).html()
          );
          //pour différencier de l'etat intital
          $container.addClass("actif");

          // Mise à jour de la valeur de l'input
          updateInput($elem.find(hidden_value_class));

          $dropdown.trigger("on-dropdown-close");

          //Si le dropdown a la classe submit-dropdown et qu'on est en mode mobile on soumet le formulaire
          if (
            DeviceSize.getDeviceState() == "mobile" &&
            $container.hasClass("submit-dropdown")
          ) {
            $container
              .parents("form")
              .first()
              .submit();
          }
        }
      }
      $(".dropdown-list-select", _contextSelector)
        .on("click.dropdown-list-select", "li", clickHandlerItemList)
        .on("touchstart.dropdown-list-select", "li", clickHandlerItemList);

      // Ne ferme pas le dropdown si on utilise la scrollbar
      $(dropdown_container_class, _contextSelector).on(
        "click",
        ".nano-pane",
        function() {
          if (
            $(this).parents(".recherche-qualifie-container").length > 0 ||
            $("html").hasClass("maquette") ||
            $(this).parents(".auto-diagnostic-main-container").length > 0 ||
            $("body").find(".save-invest.conseil-enveloppe").length > 0
          ) {
            return false;
          }
        }
      );

      // Toggle sur le dropdown
      $dropdown.on("click.dropdown-toggle", function() {
        if ($(this).hasClass("disable")) {
          return;
        }
        if (
          $(this).closest(".dropdown-enabled").length > 0 ||
          $(this).parents(".recherche-qualifie-container").length > 0 ||
          $("html").hasClass("maquette") ||
          $(this).parents(".auto-diagnostic-main-container").length > 0 ||
          $("body").find(".save-invest.conseil-enveloppe").length > 0
        ) {
          var $dropdown_list = $(this).next(".dropdown-list");
          if ($dropdown_list.hasClass("hidden")) {
            $dropdown_list.removeClass("hidden");
            if ($dropdown_list.hasClass("nano")) {
              $dropdown_list.nanoScroller({
                alwaysVisible: true
              });
            }
            $dropdown.trigger("on-dropdown-open");
          } else {
            $dropdown_list.addClass("hidden");
            $dropdown.trigger("on-dropdown-close");
          }

          // Stop propagation
          return false;
        }
      });

      // Ferme les dropdowns ouverts lorsque l'on clique n'importe ou dans la page
      function closeDropDownHandler(e) {
        if (
          $(this).closest(".dropdown-enabled").length > 0 ||
          $(e.target).parents(".recherche-qualifie-container").length > 0 ||
          $("html").hasClass("maquette") ||
          $(this).parents(".auto-diagnostic-main-container").length > 0 ||
          $("body").find(".save-invest.conseil-enveloppe").length > 0
        ) {
          if (
            $(e.target).parents(".dropdown-container").length == 0 &&
            !$(".dropdown-list").hasClass("hidden")
          ) {
            $dropdown.trigger("on-dropdown-close");
          }
          $(".dropdown-list").addClass("hidden");
        }
      }
      $(_contextSelector).on("click.close-dropdown", closeDropDownHandler);

      // Mis a jour du champ input
      var updateInput = function($el) {
        var _input = $el
          .parents(dropdown_container_class)
          .find(input_value_class);
        _input.val(
          typeof valueSelectorFunc === "function"
            ? valueSelectorFunc.bind($el.closest("li"))()
            : $el.text()
        );
        FormHelper.storeDatasInSession(_input);
      };
    }
  };

  exportGlobally({
    CustomDropdown: CustomDropdown
  });
})();

(function HelperDeviceSizeJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies(
    "GlobalSite.exportGlobally",
    "GlobalSite.exportToGlobalSite"
  );
  var logFactory = GlobalSite.checkDependency("GlobalSite.logFactory"),
    Log = logFactory("HelperDeviceSize.js"),
    toExport = {
      size: window.innerWidth,
      device: function() {
        if (this.size >= 769) {
          return "desktop";
        } else if (this.size <= 768) {
          return "mobile";
        }
      },
      class_name: "state-indicator",
      last_device_state: "",
      init: function() {
        var $body = GlobalSite.checkDependency("GlobalSite.$body");
        var self = this;

        Log.log("--> init");

        if ($("." + self.class_name).length <= 0) {
          $body.append('<div class="' + self.class_name + '"></div>');
        }
        self.last_device_state = self.getDeviceState();
        $(window).on("resize", function() {
          self.resizeDevice();
        });
      },
      //Fonction qui renvoie le type de device interprété par la feuille css (media queries)
      getDeviceState: function() {
        if ($("." + this.class_name).length == 0) {
          return "desktop";
        }
        var state = this.getContentState();
        return state || "desktop";
      },
      getContentState: function() {
        var self = this;
        try {
          if (
            typeof window.getComputedStyle === "undefined" ||
            typeof window.getComputedStyle === "null"
          ) {
            return;
          }

          return window
            .getComputedStyle(
              document.querySelector("." + self.class_name),
              ":before"
            )
            .getPropertyValue("content")
            .replace(/(\"|\')/g, "");
        } catch (e) {}
      },
      resizeDevice: function() {
        var state = this.getContentState();

        if (state != this.last_device_state) {
          //On stocke le nouveau state
          this.last_device_state = state;
          // On déclenche un évènement "breakPointReached"
          $(document).trigger("breakPointReached", String(state));
        }
      }
    };

  //===========================================
  GlobalSite.exportGlobally({
    DeviceSize: toExport
  });
  //===========================================
})();

(function ShowHideHelperJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies("GlobalSite.exportGlobally");

  //------------------------------------------------
  /**
   * Les fonctions show/hide
   */
  var ShowHideHelper = {
    /**
     * Init toutes les fonction
     */
    init: function() {
      this.dataShowHideSection();
    },
    
    /**
     * Permet d'afficher un ou des éléments cibles, et cacher d'autre(s) élément(s) cibles
     */
    dataShowHideSection: function() {
      $("[data-show-section],[data-hide-section]").on(
        "click.show-hide-section",
        function() {
          var show_elem_selector = $(this).data("show-section"),
            $elem_to_show = $(show_elem_selector),
            hide_elem_selector = $(this).data("hide-section"),
            $elem_to_hide = $(hide_elem_selector);

          $elem_to_hide.addClass("hidden");
          $elem_to_show.removeClass("hidden");
        }
      );
    }
  };
  //===========================================
  GlobalSite.exportGlobally({
      ShowHideHelper: ShowHideHelper
  });
  //===========================================
})();

(function PopinJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================

  GlobalSite.checkDependencies("GlobalSite.exportGlobally");
  GetURLParameter = GlobalSite.checkDependency("GlobalSite.GetURLParameter");

  //------------------------------------------------

  /**
   * ¨Popin (type enrolement)
   */
  var Popin = {
    popin_class: "popin",
    popin_cache_class: "popin-cache",
    popin_auto: "popin-auto",
    popin_open_active: "popin-open-active",
    popin_action: "popin-action",
    KEYBOARD_KEYS: { ENTER: { name: "Enter", code: 13 }, ESCAPE: { name: "Escape", code: 27 }, TAB: { name: "Tab", code: 9 } },

    init: function () {
      if ($("." + Popin.popin_class).length == 0) {
        return false;
      }
      //Ajout event close popin on escape
      $("body").on("keydown.popin-close", function (e) {
        var isEscapePressed = e.key === Popin.KEYBOARD_KEYS.ESCAPE.name || e.keyCode === Popin.KEYBOARD_KEYS.ESCAPE.code;

        if (isEscapePressed) {
          Popin.hidePopin();
          $("[data-show-popin]").focus();
          $(".action_popin_wcb").focus();
        }
      });

      /**
       * Ajout des event keydown pour l'accessibilité 
       */
      $("[data-show-popin]").on("keydown.popin-open", function (e) {
        //accessibility ACCUX
        if (e.key === Popin.KEYBOARD_KEYS.ENTER.name) {
          e.preventDefault();
          var show_elem_selector = $(this).data("show-popin"),
            $elem_to_show = $(show_elem_selector);
          Popin.showPopin($elem_to_show);
          Popin.attachAccessibilityBehavior(e, $elem_to_show);
          $(this).blur();
          e.key !== Popin.KEYBOARD_KEYS.ENTER.name && $elem_to_show.focus();
        }

      });

      $("." + Popin.popin_class)
        .find(".popin-close")
        .on("keydown.popin-close", function (e) {
          if (e.key === Popin.KEYBOARD_KEYS.ENTER.name) {
            e.preventDefault();
            Popin.hidePopin($(this));
            $("[data-show-popin]").focus();
          }
        });


      // Ajout evenement click sur le boutton pour fermer la popin
      $("." + Popin.popin_class)
        .find(".popin-close")
        .on("click.popin-close", function (e) {
          Popin.hidePopin($(this));
        });

      if (!$(".popin-cache").hasClass("noC")) {
        $("body").on(
          "click.popin-close",
          "." + Popin.popin_cache_class,
          function (e) {
            Popin.hidePopin();
          }
        );
        $("body").on(
          "keydown.popin-close",
          "." + Popin.popin_cache_class,
          function (e) {
            if (e.key === Popin.KEYBOARD_KEYS.ENTER.name) {
              e.preventDefault();
              Popin.hidePopin($(this));
              $("[data-show-popin]").focus();
            }
          }
        );
      }

      $("[data-show-popin]").on("click.popin-open", function (e) {
        var show_elem_selector = $(this).data("show-popin"),
          $elem_to_show = $(show_elem_selector);
        if (
          $("body").hasClass("webview") &&
          $(this).data("show-popin") == "#liste-support"
        ) {
          $(window).scrollTop(0);
        }
        Popin.showPopin($elem_to_show);

        e.key !== Popin.KEYBOARD_KEYS.ENTER.name && $elem_to_show.focus();

        /* setTimeout(function () {
          GlobalSite.initJsLoader();
        }, 500); */
      });

      // Popin se déclenche automatiquement au chargement
      if ($("." + Popin.popin_class + "." + Popin.popin_auto).length > 0) {
        Popin.showPopin($("." + Popin.popin_class + "." + Popin.popin_auto));
      }
    },

    showPopin: function ($popin, cacheParent, forceCacheReCreation) {
      if (forceCacheReCreation) {
        $("." + Popin.popin_cache_class).remove();
      }
      $popin
        .removeClass("hidden")
        .addClass(Popin.popin_open_active)
        .attr("aria-hidden", "false");
      if ($("." + Popin.popin_cache_class).length == 0) {
        if (typeof cacheParent != "undefined") {
          $(cacheParent).append(
            $('<div class="' + Popin.popin_cache_class + '" />')
          );
        } else {
          $("body").append(
            $('<div class="' + Popin.popin_cache_class + '" />')
          );
        }
      } else {
        $("." + Popin.popin_cache_class).removeClass("hidden");
      }
    },

    hidePopin: function ($clicked_elem) {
      // Si la popin a la class popin-action, on ne peut la fermer qu'en cliquant sur un élément bouton
      if (
        $("." + Popin.popin_open_active).hasClass(Popin.popin_action) &&
        $clicked_elem &&
        !$clicked_elem.is("button")
      ) {
        return false;
      }
      $("." + Popin.popin_open_active)
        .addClass("hidden")
        .removeClass(Popin.popin_open_active)
        .attr("aria-hidden", "true");
      $("." + Popin.popin_cache_class)
        .removeClass()
        .addClass("hidden")
        .addClass(Popin.popin_cache_class)
        .attr("aria-hidden", "true");
    },
    attachAccessibilityBehavior: function (event, $popin) {
      var focusableElements =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        focusableContent = $popin.find(focusableElements),
        $firstFocusableElement = $(focusableContent[0]),
        $lastFocusableElement = $(
          focusableContent[focusableContent.length - 1]
        );

      event.keyCode === Popin.KEYBOARD_KEYS.ENTER.code && $firstFocusableElement.focus();

      $popin.on("keydown.accux keypress.accux", function (e) {
        var isTabPressed = e.key === Popin.KEYBOARD_KEYS.TAB.name || e.keyCode === Popin.KEYBOARD_KEYS.TAB.code;

        if (!isTabPressed) {
          return;
        }

        if (e.shiftKey) {
          if ($firstFocusableElement.is(":focus")) {
            $lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if ($lastFocusableElement.is(":focus")) {
            $firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      });
    },

  };
  if (GetURLParameter("rc") === "nopopin") {
    sessionStorage.setItem("nopopin", true);
  }
  //===========================================
  GlobalSite.exportGlobally({
    Popin: Popin,
  });
  //===========================================
})();
(function bySiteVars() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  var exportGlobally = GlobalSite.checkDependency("GlobalSite.exportGlobally");
  var clientTypes = GlobalSite.checkDependency("GlobalSite.CST.CLIENT_TYPES");

  //===========================================

  //===========================================
  exportGlobally({
    sfSiteId: clientTypes.BPF.toLowerCase(),
    typeClientPourMultilingue: clientTypes.BPF.toLowerCase(),
    BY_SITE_VARS: {
      typeClient: clientTypes.BPF,
    },
  });
  //===========================================
})();

(function typeClientUtilsJs() {
  //=============================================
  window.GlobalSite = window.GlobalSite || {};
  var exportToGlobalSite = GlobalSite.checkDependency(
      "GlobalSite.exportToGlobalSite"
    ),
    typeClient = GlobalSite.checkDependency(
      "GlobalSite.BY_SITE_VARS.typeClient"
    ),
    CLIENT_TYPES = GlobalSite.checkDependency("GlobalSite.CST.CLIENT_TYPES");
  //=============================================

  //------------------------- logic -------------------------
  /**
   * and([a, b, c, d]) => a && b && c && d
   * @param array
   * @returns {boolean}
   */
  function and(array) {
    return array.reduce(function(acc, cur) {
      return acc && cur;
    }, true);
  }

  /**
   * or([a, b, c, d]) => a || b || c || d
   * @param array
   * @returns {boolean}
   */
  function or(array) {
    return array.reduce(function(acc, cur) {
      return acc || cur;
    }, false);
  }

  /**
   *
   * @param val
   * @returns {boolean}
   */
  function not(val) {
    return !val;
  }
  //------------------------- URI utils ----------------------------------
  /**
   *
   * @returns {String}
   */
  function getHostName() {
    var res = location.hostname;

    getHostName = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @param hostname
   * @returns {boolean}
   */
  function hostNameIncludesPredicat(hostname) {
    return getHostName().includes(hostname);
  }

  function getPathName() {
    var res = location.pathname;

    getPathName = function() {
      return res;
    };

    return res;
  }

  function pathIncludesPredicat(partialPath) {
    return getPathName().includes(partialPath);
  }

  //----------------------- Dom utils -----------------------------------
  function $getBody() {
    var res = GlobalSite.$body;

    $getBody = function() {
      return res;
    };

    return res;
  }
  //----------------------- type clientele utils ------------------------
  /**
   *
   * @returns {jQuery|HTMLElement}
   */
  function $getEspaceClientSelector() {
    var ESPACE_CLIENT_SELECTOR = not(isHb())
      ? [
          ".bottom-header-logoff #logoutCAS",
          "#logoutCas",
          ".bottom-header-logoff a[href*=logoff]:visible"
        ].join(",")
      : ".to-deconnexion";

    var res = $(ESPACE_CLIENT_SELECTOR);

    $getEspaceClientSelector = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isEspaceClient() {
    var res = $getEspaceClientSelector().length >= 1;

    isEspaceClient = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isPreview() {
    var res = window.ENVIRONNEMENT === "PREVIEW";

    isPreview = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isProd() {
    var res = window.ENVIRONNEMENT === "PROD";

    isProd = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isQualif() {
    var res = window.ENVIRONNEMENT === "QUALIF";

    isQualif = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isInte() {
    var res = window.ENVIRONNEMENT === "INTE";

    isInte = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isNoEnv() {
    var res = window.ENVIRONNEMENT === "NO_ENV";

    isNoEnv = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {*|boolean|boolean}
   */
  function isPart() {
    var res =
      typeClient === CLIENT_TYPES.PART ||
      $getBody().is(".part") ||
      /* bench */ (isNoEnv() && hostNameIncludesPredicat("-part-"));

    isPart = function() {
      return res;
    };

    return res;
  }

  function isSecure() {
    var res = pathIncludesPredicat("/secure/");

    isSecure = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {*|boolean|boolean}
   */
  function isBpf() {
    var res =
      typeClient === CLIENT_TYPES.BPF ||
      $getBody().is(".bpf") ||
      /* bench */ (isNoEnv() && hostNameIncludesPredicat("-bpf-"));

    isBpf = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {*|boolean}
   */
  function isPro() {
    var res =
      typeClient === CLIENT_TYPES.PRO ||
      $getBody().is(".pro") ||
      or(
        ["mabanquepro", "pro.mabanque", "canalnet-pro", "mabanque-pro"].map(
          hostNameIncludesPredicat
        )
      );

    isPro = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {*|boolean}
   */
  function isHb() {
    var res =
      typeClient === CLIENT_TYPES.HB.toLowerCase() || 
      $getBody().is(".hb, .hellobank:not(.hbpro)") || 
      hostNameIncludesPredicat("hellobank-part");

    isHb = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {*|boolean}
   */
  function isHbPro() {
    var res =
      typeClient === CLIENT_TYPES.HBPRO.toLowerCase() ||
      $getBody().is(".hbpro-secure, .hbpro");

      isHbPro = function() {
      return res;
    };

    return res;
  }


  function isHomePage() {
    var res = document.location.pathname === "/";

    isHomePage = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean | *}
   */
  function isConnectionPage() {
    var res =
      getPathName().endsWith("connexion") ||
      getPathName().endsWith("espace-prive") ||
      (isHb() && $("#ident-header").length > 0);

    isConnectionPage = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {any | boolean}
   */
  function isModeWebView() {
    var res =
      (sessionStorage.modeWebview && sessionStorage.modeWebview === "true") ||
      location.search.includes("rc=webview") ||
      location.pathname.includes("webview");

    isModeWebView = function() {
      return res;
    };

    return res;
  }

  function getEnv() {
    return GlobalSite.ENVIRONNEMENT || window.ENVIRONNEMENT;
  }

  function getQualifNumber() {
    var _isQualif = isQualif();
    var res = 0;
    if (_isQualif) {
      switch (true) {
        case hostNameIncludesPredicat("-we1-ap1"):
          res = 1;
          break;
        case hostNameIncludesPredicat("-we2-ap2"):
          res = 2;
          break;
        case hostNameIncludesPredicat("-we3-ap3"):
          res = 3;
          break;
        case hostNameIncludesPredicat("-we4-ap4"):
          res = 4;
          break;
      }
    }
    getQualifNumber = function() {
      return res;
    };

    return res;
  }

  /**
   *
   * @returns {boolean}
   */
  function isQualif1() {
    var res = getQualifNumber() === 1;

    isQualif1 = function() {
      return res;
    };

    return res;
  }

  function isQualif2() {
    var res = getQualifNumber() === 2;

    isQualif2 = function() {
      return res;
    };

    return res;
  }

  function isQualif3() {
    var res = getQualifNumber() === 3;

    isQualif3 = function() {
      return res;
    };

    return res;
  }

  function isQualif4() {
    var res = getQualifNumber() === 4;

    isQualif4 = function() {
      return res;
    };

    return res;
  }

  function isMobile() {
    var res = isModeWebView() || window.CANAL === "mobile";

    isMobile = function() {
      return res;
    }

    return res;
  }

  function isDesktop() {
    var res = !isModeWebView() || window.CANAL === "desktop";

    isDesktop = function() {
      return res;
    }

    return res;
  }

  function isAsyncC2() {
    var res = $.Deferred();

    $.ajax({url: "/content/dam/c2.json"})
      .always(function(response) {
        res.resolve(response.active);
      });
      
    isAsyncC2 = function() {
      return res;
    }

    return res;
  }

  function getAsyncC2BaseUrl() {
    var res = $.Deferred();

    $.ajax({url: "/content/dam/c2.json"})
      .always(function(response) {
        res.resolve(response.baseUrl[typeClient.toLowerCase()]);
      });
      
    getAsyncC2BaseUrl = function() {
      return res;
    }

    return res;
  }

  //=============================================
  exportToGlobalSite({
    clientUtils: {
      and: and,
      or: or,
      not: not,
      getHostName: getHostName,
      hostNameIncludesPredicat: hostNameIncludesPredicat,
      pathIncludesPredicat: pathIncludesPredicat,
      getPathName: getPathName,
      $getBody: $getBody,
      $getEspaceClientSelector: $getEspaceClientSelector,
      isEspaceClient: isEspaceClient,
      isPreview: isPreview,
      isProd: isProd,
      isQualif: isQualif,
      isQualif1: isQualif1,
      isQualif2: isQualif2,
      isQualif3: isQualif3,
      isQualif4: isQualif4,
      getQualifNumber: getQualifNumber,
      isInte: isInte,
      isNoEnv: isNoEnv,
      isPart: isPart,
      isBpf: isBpf,
      isPro: isPro,
      isHb: isHb,
      isHbPro: isHbPro,
      isSecure: isSecure,
      isHomePage: isHomePage,
      isConnectionPage: isConnectionPage,
      isModeWebView: isModeWebView,
      getEnv: getEnv,
      isMobile: isMobile,
      isDesktop: isDesktop,
      isAsyncC2: isAsyncC2,
      getAsyncC2BaseUrl: getAsyncC2BaseUrl
    }
  });
  //=============================================
})();

/**
 * Utilitaires globaux liés au fonctionnel
 */
(function mainJs() {
  //===========================================
  window.GlobalSite = window.GlobalSite || {};
  //===========================================
  var logFactory = GlobalSite.checkDependency("GlobalSite.logFactory"),
    Log = logFactory("main.js"),
    infosClientMode0Util = GlobalSite.checkDependency(
      "GlobalSite.infosClientMode0Util"
    ),
    isConnected = GlobalSite.checkDependency("GlobalSite.isConnected"),
    removeFromSession = GlobalSite.checkDependency(
      "GlobalSite.removeFromSession"
    );
  //------------------------------------------------
  $(function () {
    Log.log("-->");
    
    if (isConnected) {
      infosClientMode0Util.getAsyncInfos().then(function (infoClient) {
        console.log(infoClient);
        if (infoClient) {
          // Add body's class for logged in, etc...
          $('body').addClass('client');
        }
      });
    } else {
      removeFromSession("info_client");
      removeFromSession("info_client_1");

      if ($('body').hasClass('client')) {
        $('body').removeClass('client');
      }

    }

    Log.log("<--");
  });
  //------------------------------------------------
})();

(function () {
  //---------------------------
  window.GlobalSite = window.GlobalSite || {};
  window.BPF = window.BPF || {};
  //----------------------------
  /**
   *
   * @param key
   * @param val
   */
  function updateSession(key, val) {
    sessionStorage[key] = JSON.stringify(val);
  }

  /**
   *
   * @param key
   * @param val
   */
  function updateLocalStorage(key, val) {
    localStorage[key] = JSON.stringify(val);
  }

  /**
   *
   * @param key
   * @returns {any}
   */
  function getFromLocalStorage(key) {
    var _localVal = localStorage[key];
    var localVal = _localVal === "undefined" ? null : _localVal;

    return JSON.parse(localVal || null);
  }

  /**
   *
   * @param key
   * @returns {any}
   */
  function getFromSessionStorage(key) {
    var _sessionVal = sessionStorage[key];
    var sessionVal = _sessionVal === "undefined" ? null : _sessionVal;

    return JSON.parse(sessionVal || null);
  }

  /**
   *
   * @param key
   */
  function removeFromLocal(key) {
    delete localStorage[key];
  }

  /**
   *
   * @param key
   */
  function removeFromSession(key) {
    delete sessionStorage[key];
  }

  /**
   *
   * @param key
   */
  function removeFromStorage(key) {
    removeFromLocal(key);
    removeFromSession(key);
  }

  function exportToNamespace(obj) {
    $.extend(true, window.BPF, obj);
  }

  function activeDebug() {
    updateLocalStorage(DEBUG_MODE, true);
  }

  var DEBUG_MODE = "debugMode",
    isDebug = (function () {
      var _isDebug = !!(
        getFromSessionStorage(DEBUG_MODE) === true ||
        getFromLocalStorage(DEBUG_MODE) === true ||
        !!document.location.search.split("?").find(function (item) {
          return item.indexOf("debug") >= 0;
        })
      );

      if (_isDebug) {
        sessionStorage.trace = 1;
        document.cookie =
          'bnpp_sav={"tracing":true}; expires=' +
          new Date(
            new Date().getTime() + 365 * 24 * 60 * 60 * 1000
          ).toGMTString() +
          "; path=/";
      }

      return _isDebug;
    })(),
    Log = {
      log: isDebug
        ? function (message) {
            var _message = {
              "requireDac.js": message,
            };
            console.log(JSON.stringify(_message, null, 2));
          }
        : function () {},
      error: isDebug
        ? function (errorMessage) {
            var _message = {
              "requireDac.js": errorMessage,
            };
            console.error(JSON.stringify(_message, null, 2));
          }
        : function () {},
    },
    SEARCH_REQUIREDAC_STRING = "requiredDAC=3",
    SCRIPT_NAME = "requireDac",
    STORAGE_REQUIREDAC3_OBJ_KEY = "REQUIREDAC3_OBJ",
    STORAGE_TIME_CACHE = 2 * 60 * 1000, // 2 minutes
    FORCE_AUTHENT_URL = "/aiguillage-wspl/redirect/identification",
    isConnected = window.GlobalSite.isConnected;

  //======================================================================================================================
  Log.log("--> ");
  //======================================================================================================================
  function isRequireDac3() {
    var search = document.location.search;
    return search
      .toLowerCase()
      .includes(SEARCH_REQUIREDAC_STRING.toLowerCase());
  }

  function getRegisteredSessionRequireObj() {
    var res = getFromLocalStorage(STORAGE_REQUIREDAC3_OBJ_KEY);

    getRegisteredSessionRequireObj = function () {
      return res;
    };

    return res;
  }

  function removeRegisteredSessionRequireObj() {
    removeFromLocal(STORAGE_REQUIREDAC3_OBJ_KEY);
    Log.log({
      ctx: "removeRegisteredSessionRequireObj()",
      msg: "STORAGE_REQUIREDAC3_OBJ_KEY " + " removed from storage",
    });
  }

  function hasRequireDac3InSession() {
    Log.log("hasRequireDac3InSession: ->");

    var registeredSessionObj = getRegisteredSessionRequireObj();
    var isRegistered = !!(registeredSessionObj || {}).isRegistered;
    var isCacheExpired =
      !isRegistered ||
      (isRegistered &&
        (function () {
          var now = new Date().getTime(),
            registeredTime = Number((registeredSessionObj || {}).time),
            delta = now - registeredTime,
            result =
              Number.isNaN(delta) ||
              (!Number.isNaN(delta) && delta >= STORAGE_TIME_CACHE);

          return result;
        })());
    var res = isRegistered && !isCacheExpired;

    Log.log({
      ctx: "hasRequireDac3InSession()",
      registeredSessionObj: registeredSessionObj,
      isRegistered: isRegistered,
      isCacheExpired: isCacheExpired,
      res: res,
    });

    if (isCacheExpired) {
      removeRegisteredSessionRequireObj();
    }

    hasRequireDac3InSession = function () {
      return res;
    };

    return res;
  }

  function getRefererPath() {
    var registeredSessionObj = getRegisteredSessionRequireObj();
    var res = (registeredSessionObj || {}).refererPath;

    getRefererPath = function () {
      return res;
    };

    return res;
  }

  function detectingRequireDac() {
    Log.log("detectingRequireDac: ->");
    var refererPath, rg;

    rg = new RegExp(SEARCH_REQUIREDAC_STRING, "gi");

    if (isRequireDac3()) {
      if (isConnected) {
        return;
      }
      refererPath =
        window.location.pathname + window.location.search.replace(rg, "");

      updateLocalStorage(STORAGE_REQUIREDAC3_OBJ_KEY, {
        isRegistered: true,
        refererPath: refererPath,
        time: new Date().getTime(),
      });

      Log.log(
        JSON.stringify({
          detectingRequireDac: {
            refererPath: refererPath,
          },
        })
      );

      window.location.replace(FORCE_AUTHENT_URL);
    } else if (hasRequireDac3InSession()) {
      refererPath = getRefererPath();
      Log.log(
        JSON.stringify({
          detectingRequireDac: {
            hasRequireDac3InSession: hasRequireDac3InSession(),
            nextAction: "redirection to refererPath",
            "refererPath from session": refererPath,
          },
        })
      );
      removeRegisteredSessionRequireObj();
      window.location.replace(refererPath);
    }
  }

  detectingRequireDac();

  exportToNamespace({
    detectingRequireDac: detectingRequireDac,
    activeDebug: activeDebug,
    isDebug: isDebug,
  });
})();

