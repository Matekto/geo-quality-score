(function() {
  if (!window.GetURLParameter)
  {
    window.GetURLParameter = function(sParam) {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
          return sParameterName[1];
        }
      }
    }
  }

  window.launchSatelliteLoader = function (){

    var dtmHost;
    var script;
    var scripts = {
      SelfHosted: {
        PREVIEW: '/rsc/contrib/script/dtm/37617e04bc40/148ea22e9d02/launch-28ef65699427-development.min.js',
        PROD: '/rsc/contrib/script/dtm/37617e04bc40/148ea22e9d02/launch-5750c52f9e9a-staging.min.js'
      },
      Akamai: {
        PREVIEW: '//assets.adobedtm.com/37617e04bc40/148ea22e9d02/launch-28ef65699427-development.min.js',
        DEV2: '//assets.adobedtm.com/37617e04bc40/148ea22e9d02/launch-ac8048aaa0b5-development.min.js',
        DEV3: '//assets.adobedtm.com/37617e04bc40/148ea22e9d02/launch-3673d8a6297d-development.min.js',
        PROD: '//assets.adobedtm.com/37617e04bc40/148ea22e9d02/launch-b85999266f92.min.js'
      }
    };
    var mode = GetURLParameter('mode');

    var isEnv = function(strToTest) { return window.ENVIRONNEMENT && window.ENVIRONNEMENT === strToTest };
    var isEnv2 = function(strToTest) { return window.ENV && window.ENV.indexOf(strToTest) > -1 };
    var isMode = function(mode) { return (window.GetURLParameter && GetURLParameter("mode") === mode) };

    var webviewiOS = !!window.navigator.platform && /iPad|iPhone|iPod/.test(window.navigator.platform) && GetURLParameter('rc') === 'webview';

    if (typeof mode !== 'undefined') {
      var modes = mode.split('|');
      for (var m in modes) {
        switch (modes[m]) {
          case 'dtm-Activated':
            sessionStorage.setItem('dtm-Activated', true);
            break;

          case 'dtm-Deactivated':
            sessionStorage.setItem('dtm-Activated', false);
            break;

          case 'dtm-Akamai':
            sessionStorage.setItem('dtm-Akamai', true);
            break;

          default:
            break;
        }
      }
    }

    dtmHost = ( isEnv('PREVIEW') || isEnv('QUALIF') || isEnv('MACHINE') || isEnv2('preview') || isEnv2('qualif') || isMode('dtm-Akamai') || isMode('launch-dev2') || isMode('launch-dev3') || window.ENV_IS_CAS) ? 'Akamai' : 'SelfHosted';

    if (!isEnv("PROD") && !isEnv("PREVIEW") && !isEnv("QUALIF") && !isEnv("MOBILE") && !isEnv("MACHINE") && !isEnv2('preview') && !isEnv2('qualif') && !isEnv2('prod')) { return false; } 
    else { script = (isEnv("PROD") || isEnv2("prod") || isMode("PROD") || isEnv("MOBILE") || isMode("MOBILE")) ? scripts[dtmHost].PROD : isMode('launch-dev2') ? scripts[dtmHost].DEV2 : isMode('launch-dev3') ? scripts[dtmHost].DEV3 : scripts[dtmHost].PREVIEW; }

    // Load the header and footer code into the <head> and <body> tags
    if (script && !webviewiOS && document.querySelectorAll("script[src*='"+script+"']").length == 0) {
      window.addEventListener('load', function() {
        _satellite.logger.info("******************************");
        _satellite.logger.info("EVENT LOAD");
        if (typeof _satellite.pageBottomFired === 'undefined' || !_satellite.pageBottomFired) {
          _satellite.pageBottom();
          if (dtmHost === 'Akamai') { _satellite.setDebug(true); }
          _satellite.logger.info('--> Satellite footer code loaded <--');
        }
      });

      var sc = document.createElement('script');
      sc.type = 'text/javascript';
      sc.src = script; 
      sc.async = true;
      document.head.appendChild(sc);
    }
  }

  if (window.ENV_IS_CAS)
    launchSatelliteLoader();
  else {
    const launchPromise = new Promise((resolve,reject)=>{
      let counter = 0;
      let interval = setInterval(() => {        
        if(!!(window.$ && window.bnpp && bnpp.gestioncookies)) {
          resolve('Running launchSatelliteLoader');
          clearInterval(interval);
        }
        if(counter >= 15) {
          clearInterval(interval);
          if(!!window.$) 
            resolve('Running launchSatelliteLoader');
          else
            reject('launchSatelliteLoader rejected');
        }
        counter++;
      }, 500)
    });  
    launchPromise.then((message) => {
      console.log(message);
      launchSatelliteLoader();
    },
    (message) => {
      console.log(message);
    })
  }  
})();