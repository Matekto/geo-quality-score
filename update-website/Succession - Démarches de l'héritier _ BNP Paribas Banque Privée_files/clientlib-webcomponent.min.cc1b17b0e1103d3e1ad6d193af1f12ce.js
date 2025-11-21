(function webComponentLauncherJs() {
  //=============================================
  window.GlobalSite = window.GlobalSite || {};
  const exportToGlobalSite = GlobalSite.checkDependency(
      "GlobalSite.exportToGlobalSite"
    ),
    SimpleWaitAsync = GlobalSite.checkDependency("GlobalSite.SimpleWaitAsync"),
    logFactory = GlobalSite.checkDependency("GlobalSite.logFactory"),
    WEBCOMPONENT_SELECTOR = "[type='webcomponent']",
    WEBCOMPONENT_SRC_PATH="/rsc/contrib/script/simulateur/",
    WEBCOMPONENT_LOADED_CLASS="webComponentLoaded",
    Logger = logFactory("Web Component launcher.js");

  var processIsLoading = false,
    loadedList = [];

  //=============================================

  // Extending .attr so that you can call it like .attr() to get a plain object of all attributes:
  const getArrayAttributes = function(element) {
    return element.getAttributeNames().reduce(function(current, next) {
      current[next] = element.getAttribute(next);
      return current;
    }, {});
  }

  function run() {
    SimpleWaitAsync({predicat: function() {
      const notLoadedNextOutilList = document.querySelectorAll(WEBCOMPONENT_SELECTOR + ':not(.' + WEBCOMPONENT_LOADED_CLASS + ')');

      if(notLoadedNextOutilList.length && !processIsLoading) {
        processIsLoading = true;
        Logger.log("Chargement en cours")
        notLoadedNextOutilList.forEach(function(currentItem) {
          return loadElement(currentItem);
        });
        processIsLoading = false;
        Logger.log("Fin du chargement")
      }
      return false;
    }});

  }

  function loadElement(elementOrName) {
    var element;

    if (!(elementOrName instanceof HTMLElement)) {
      element = document.querySelector(WEBCOMPONENT_SELECTOR + "[name=" + elementOrName + "]");
    } else {
      element = elementOrName;
    }

    if(typeof element === "undefined" || !element.getAttribute('name')) {
      element.classList.add(WEBCOMPONENT_LOADED_CLASS);
      return;
    }

    loadElementDependencies(element);
    const nextOutilObject = {
      [element.getAttribute('name')]: getArrayAttributes(element)
    };
    Logger.log(nextOutilObject);
    loadedList.push(nextOutilObject);
  }

  function loadElementDependencies(element) {
    var attributes = getArrayAttributes(element);

    if(attributes.configFilePath) {
      Object.assign(attributes.config,
        {},
        loadConfigFile(attributes.configFilePath)
      );
    }

    injectElement(element);
  }

  async function loadConfigFile(url) {
    try {
      const response = await fetch(url);
      const config = await response.json();
      return config;
    } catch (error) {
      Logger.error(`Erreur lors du téléchargement : ${error.message}`);
      return null;
    }
  }

  function injectElement(element) {
    var attributes = getArrayAttributes(element);

    var script = document.createElement('script');
    script.src = WEBCOMPONENT_SRC_PATH + attributes.name + '/' + attributes['entry-file'];
    script.type = "module";
    document.head.appendChild(script);

    var webComponentTag = element.tagName;
    var newElement = document.createElement(webComponentTag + "-" + attributes.name);
    delete attributes.configFilePath;
    delete attributes.name;
    delete attributes.type;
    delete attributes['entry-file'];

    for(var key in attributes) {
      newElement.setAttribute(key, attributes[key]);
    }

    var urlParams = Object.fromEntries(new URLSearchParams(window.location.search));
    newElement.setAttribute("url-params", urlParams);

    element.replaceWith(newElement);
  }

  run();

  //=============================================
  exportToGlobalSite({
    webComponentHelper: {
      loadedList,
      processIsLoading,
      runLoading: run,
      loadElement,
    }
  });
  //=============================================
})();