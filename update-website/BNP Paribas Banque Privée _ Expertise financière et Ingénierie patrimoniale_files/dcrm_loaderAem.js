// Constantes
const DCRMOn = true;
const versCelebrus = { qual:"v9-7-3", prev: "v9-7-3", prod: "v9-7-3", int:"v9-7-3", default: "v9" };
const currentURL = new URL(location.href);
const env = currentURL.host.match(/(qual|prev|int)/i) ? currentURL.host.match(/(qual|prev|int)/i)[1] : "prod";
const debugDCRM = window.debugDCRM =  env != "prod" || localStorage?.debugMode == 'true' || false;
const modulesLayer = { crmd: { banners: [], actions: [] } }; // On set le dataLayer pour Adobe Launch
const DCRMScripts = ["dcrmAem.js","banner-containers/banners_mb.js","emergencyBannersMB.js"];
const cookies = decodeURIComponent(document.cookie);

// Variables globales
var DCRMChannel = window.DCRMChannel = new MessageChannel();
var VCXsubmit = window.VCXsubmit = new MessageChannel(); 
var currentPathname = currentURL.pathname;
var urlDomain = currentURL.searchParams.get('redirect_uri') ? decodeURI(currentURL.searchParams.get('redirect_uri')) : currentURL.origin;
var envFolders = {  qual:"qualif_mb", prev:"pprod_mb", prod:"prod_mb", int:"inte_mb" };
var celebrusPath = "/rsc/contrib/script/aem/celebrus/";
var registeredBanners = [ 'udc-banner-rebond', 'udc-banner-animation', 'udc-banner-sticky', 'udc-banner-popin', 'confirmation-virement'];
var DCRMclientele = /(mabanque\.bnpparibas|part)/.test(currentURL.host) ? 'part':
                /pro/.test(currentURL.host) ? 'pro':
                /(mabanqueprivee\.bnpparibas|bpf|privee)/.test(currentURL.host) ? 'bpf':"";
var univers = "BNPP";
var getConsent = () => ( decodeURIComponent(document.cookie) )?.match(/BDDFCSAP3P=([^;]+)/)?.[1] || false;

window.celebrus = { version : versCelebrus[env] };
window.GlobalSite = window.GlobalSite || {};
if ( !!window.digitalData ) { window.digitalData["modules"] = modulesLayer }
else { window.digitalData = { modules: modulesLayer } };

// Méthodes utiles
var logDebug = (string) => !!debugDCRM ?  console.log(`%c DCRM `,'color: #fff; font-weight: bold; background: #08b; border-radius:3px', string) : ""; // Fonction de debug
var addScript = (source) => {
  const script = document.createElement('script'); script.src = source;
  document.querySelector('body').append(script);
}

var waitForCondition = (condition) =>  new Promise(( resolve )=> { let waiter = setInterval( () => { if ( !!condition() ) { clearInterval(waiter); resolve() } } ) });
var waitForPlacement = (condition) => {
  return new Promise((resolve)=>{
    let observer = new MutationObserver( () => { if (!!condition()) { resolve(); observer.disconnect() } } );
    observer.observe(document.querySelector('body'),{childList:true, subtree:true});
  })
}
var waitForConsent = (delay=5000)=>{
  return new Promise( (resolve, reject) => {
    let waiter = setInterval(()=>{
      let consent = getConsent();
      if(!!consent) clearInterval(waiter); resolve(consent);
    })
    setTimeout(()=> reject(), delay)
  })
}

logDebug('initialisation de DCRM')
if (DCRMOn) DCRMScripts.forEach((entry) => addScript(urlDomain + celebrusPath + entry) ) // Injection des scripts