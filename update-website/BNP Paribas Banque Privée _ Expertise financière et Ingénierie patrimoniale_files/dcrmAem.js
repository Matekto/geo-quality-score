logDebug('Lancement de dcrmAem');

// Définition de l'objet DCRM
var dcrm = {
  csaName: "BDDFCSA",
  Placement: function (el, type, args) {
    "use strict";
    if (!el) throw "DCRM Placement does not allow undefined element";
    if (el.selector !== undefined) throw "DCRM Placement does support jquery object, give us the DOM Element please: obj.get(0)";
    if (!el.parentNode) throw "DCRM Placement must have an element from the page";
    if (!type) throw "DCRM Placement must have a type";

    var _el = el,  _type = type, _args = args;
    return { type:() => _type, args: () => _args === undefined ? {} : _args, replaceWith: (content) => _el.parentNode.replaceChild(content, _el) };
  },
  ResponseHandler: function (offerId, callbackId) {
    "use strict";
    var _offerId = offerId, _callbackId = callbackId, _handlers = {
      extended: function () {
        logDebug(`extended sent.\nbannerID: ${offerId} \nmessagePathID: ${callbackId}`);
        window[dcrm.csaName + "SendJsonData"]({
          events: [ { eventType: "RTIMresponse", eventGroup: "Scenario", bannerID: offerId, messagePathID: callbackId, responseLevel: "extended" }],
        });
      },
      accepted: function () {
        logDebug( `accepted message sent.\n bannerID: ${offerId}\nmessagePathID:${callbackId}`);
        window[dcrm.csaName + "SendJsonData"]({
          events: [ { eventType: "RTIMresponse", eventGroup: "Scenario", bannerID: offerId, messagePathID: callbackId, responseLevel: "accepted" }]});
      },
      refused: function () {
        logDebug(`refused sent. \nbannerID: ${offerId}\nmessagePathID: ${callbackId}`);
        window[dcrm.csaName + "SendJsonData"]({
          events: [ { eventType: "RTIMresponse", eventGroup: "Scenario", bannerID: offerId, messagePathID: callbackId, responseLevel: "refused" }]
        });
      },
      custom: function (custom) {
        logDebug(`custom message : "${custom}" sent\nbannerID: ${offerId}\nmessagePathID: ${callbackId}`);
        window[dcrm.csaName + "SendJsonData"]({
          events: [ { eventType: "RTIMresponse", eventGroup: "Scenario", bannerID: offerId, messagePathID: callbackId, responseLevel: custom }]
        });
      },
    };
    // Add the celebrus response handlers to the global scope.
    window.celebrusHandlers = _handlers;
    return _handlers;
  },

  /* Une méthode permettant de trouver un élément dans un DOM ou un shadowDOM */
  GetAnyElement : ( selector ) => {
    let output = null;
    const shadowSearcher = ( searched, referenceElement = "" ) => {
      let reference = referenceElement?.shadowRoot || document;
      Array.from( reference.querySelectorAll('*') )
        .map( (child) => {
          if ( child.matches(searched) ) output  = (child);
          if ( !!child.shadowRoot ) shadowSearcher(searched, child);
        })
    }
    shadowSearcher(selector);
    return output;
  },

  insertStrElementAfter: ( element, stringElement ) => document.querySelector(element).insertAdjacentHTML('afterend',stringElement) ,
  insertStrElementBefore: ( element, stringElement ) => document.querySelector(element).insertAdjacentHTML('beforebegin',stringElement),
  prependStrElement: ( element, stringElement ) => document.querySelector(element).insertAdjacentHTML('afterbegin',stringElement),
  appendStrElement: ( element, stringElement ) => document.querySelector(element).insertAdjacentHTML('beforeend',stringElement),

  manager: new (function () {
    "use strict";
    var _finder = null, _builders = {};

    return {
      registerFinder: function (finder) {
        if (!finder) finder = null;
        if (!typeof finder === "function") throw "DCRM Finder should be a function";
        _finder = finder;
      },
      registerBuilder: function (type, builder) {
        if (!type) throw "DCRM Builder should have a type";
        if (!builder) _builders[type] = null;
        if (!typeof builder === "function") throw "DCRM builder should be a function";
        _builders[type] = builder;
      },
      updateContent: function (offerId, callbackId, offerArgs) {
        if(!!offerArgs && !!offerArgs.variation_aem_logout_page){
          localStorage.setItem('deconnexionDCRM',offerArgs.variation_aem_logout_page);
          if(debugDCRM) console.log('DCRM',"Ajout du contenu de la page déconnexion");
          return;
        }
        try {
          if (!_finder) return false;
          _finder( offerArgs )
            .then((placement) => {                                                                                                                  // On test l'emplacement 
              if ( !placement || !placement instanceof dcrm.Placement ) return false;
              if ( !_builders[placement.type()] ) { logDebug( `Emplacement ${placement.type()} non trouvé aprÃ¨s reception du span` );              // On test le builder
                return false;
              }

              logDebug(`UpdateContent : Emplacement ${placement.type()} matche le span reçu`);
              var handler = new dcrm.ResponseHandler(offerId, callbackId), content = _builders[placement.type()]( offerArgs, placement.args(), handler );           
              if (!content) return false;              
              handler.extended();
              return true;
            })
        } catch (ex) { console.log(ex) }
      },
    };
  }) (),
};

/* Enregistrement des méthodes ------------------*/
dcrm.manager.registerFinder(
  function( contentArgs ) {
    return new Promise((resolve, reject) => {
      var createPlacementInstance = (placement) => {
        let type = placement.id;
        if(placement.hasAttribute("data-celebrus-type")){
          type = placement.getAttribute("data-celebrus-type") != "virement" ? placement.getAttribute("data-celebrus-type") : "confirmation-virement";
        }
        
        const placementInstance = new dcrm.Placement(
          placement,
          type,
          {
            id: placement.getAttribute("id"),
            size: placement.getAttribute("data-celebrus-size"),
            zone: placement.getAttribute("data-celebrus-zone"),
          })
        resolve(placementInstance);
      };
      waitForCondition( () => !!dcrm.GetAnyElement(`#${contentArgs.emplacement}`))
      .then( () => { 
        let el = dcrm.GetAnyElement(`#${contentArgs.emplacement}`);
          createPlacementInstance( el )
        }
      );
      DCRMChannel.port2.onmessage = (e) => {
        logDebug(`message reçu ${e.data}`);
        let el = dcrm.GetAnyElement(`${e.data}`);
        if (!!el.id && el.id == contentArgs.emplacement ) {
          createPlacementInstance( dcrm.GetAnyElement(`${e.data}`));
        }
      }
    })
  }
)

// Methodes du builder --------------------------*/
registeredBanners
  .forEach( (placementName) => {
    dcrm.manager.registerBuilder(
      placementName,
      (contentArgs,placementArgs, celebrusHelper ) => {
        /* contentArgs.nom_gabarit = /((g)(ab))(\d+)(.+)/i.test(contentArgs.nom_gabarit) ? 
                                  contentArgs.nom_gabarit.replace(/((g)(ab))(\d{2})(.+)/i,(match,$1,$2,$3,$4) =>$2.toUpperCase()+$3.toLowerCase()+$4):
                                  contentArgs.nom_gabarit;*/
        window.dispatchEvent( new CustomEvent( `rtim-banner:${placementName}`, { detail: { "content": contentArgs, "placement": placementArgs, "celebrusHelper": celebrusHelper } } ) );
      }
    );
  });

var exportGlobally = GlobalSite.checkDependency("GlobalSite.exportGlobally");
exportGlobally({ dcrm: dcrm});

// Le builder est chargé

  waitForConsent()
    .then( (consent) => { 
      logDebug('les cookies ont été trouvé');
      if ( consent != "optedOut" ) { 
        logDebug('le client est optedIn');
        addScript( urlDomain + celebrusPath + envFolders[env] + "/CelebrusDynamicInsert.js" );
        logDebug('Ajout de Celebrus');
        waitForCondition( ()=>!!sessionStorage.getItem("info_client") ) // On récupère info_client
        .then( () => {  logDebug("info client trouvé");
          const idTelematiqueClient = sessionStorage?.getItem("info_client")?.match(/"idTelematiqueClient":"([^"]+)"/)?.[1] || false;
          let portee = sessionStorage?.getItem("info_client")?.match(/"indicTypePro":([^,]+)/)?.[1] || false;
          portee = portee == 'false' ? 'PRI': portee == 'true' ? 'PRO': "";
          const IKPI = sessionStorage?.getItem("info_client")?.match(/"ikpiPersonne":"(\d+)"/)?.[1] || false;

          if ( !!idTelematiqueClient && !!portee && !!IKPI) {
            let simulatedForm = { name: "SMIDForm", elements: [] };
            [ `SMID1:${idTelematiqueClient}` , `IKPI:${IKPI}` , `enseigne:${univers}` ,`portee:${portee}` ]
              .forEach( (entry) => { simulatedForm.elements.push( { name: entry.split(":")[0], id: entry.split(":")[0], value: entry.split(":")[1], type: "text" } ) } ) ;

            waitForCondition(() => window.hasOwnProperty("BDDFCSAformsubmit"))
              .then(() => { 
                window.BDDFCSAformsubmit(simulatedForm);
                logDebug("Log to VCX");
                logDebug(`Démarrage du mécanisme d'urgence après envoi du formulaire`);
                VCXsubmit.port1.postMessage({ status: "optin" });
              });
          } else  {
            logDebug(`Données du formulaires invalides ou inaccessibles: echec de l'envoi`);
            VCXsubmit.port1.postMessage({ status: "optout" });
          }
        } )
      }
      else {
        logDebug('le client est optedOut, démarrage des bannières de secours');
        VCXsubmit.port1.postMessage({ status: "optout" });
      }
    },  () => {
      logDebug("Les cookies n'ont pas été trouvé, démarrage des bannières de secours");
      VCXsubmit.port1.postMessage({ status: "optout" });
    } )


// Ajout des emplacements
/* Part
---------------------------------------------------*/
if ( DCRMclientele == "part" ) {  logDebug("chargement des emplacements Part ");
  if ( /secure\/comptes-et-contrats/.test( currentURL.pathname ) ) {  // UDC 
    // Rebond
    waitForCondition(()=>!!document.querySelector('.global-udc[class*="item"]'))
      .then( () => { 
        dcrm.insertStrElementAfter('.global-udc[class*="item"]','<div id="udc-banner-rebond" data-celebrus-zone="udc-top" data-celebrus-type="udc-banner-rebond" data-celebrus-size="1260x630" data-celebrus-priority="1000"></div>') 
        logDebug("Rebond ajouté");
      });

    // Animation 
    waitForCondition( ()=> !!document.querySelector("#template-udc-vue-liste") && !!document.querySelector("#udc-famille-ancre") && !document.querySelector('#udc-banner-animation'))
      .then( () => {
        dcrm.insertStrElementAfter("#udc-famille-ancre",'<div  id="celebrus-udc" data-celebrus-zone="udc-top" data-celebrus-type="banner-udc" data-celebrus-size="1260x630" data-celebrus-priority="0"></div>');
        dcrm.insertStrElementAfter("#template-udc-vue-liste > section > div:nth-child(1)",'<div id="zp_udc"></div>');
        dcrm.insertStrElementAfter("#template-udc-vue-liste",'<div id="zp_udc_bottom"></div>');
        dcrm.insertStrElementAfter("#zp_udc",'<div id="udc-banner-animation" data-celebrus-zone="udc-middle" data-celebrus-type="udc-banner-animation" data-celebrus-size="1260x630" data-celebrus-priority="800"></div>');
        logDebug("Animation ajouté");
      })

    // Ajout de Sticky
    waitForCondition( ()=>!!document.querySelector(".page-content") && !document.querySelector("#udc-banner-sticky") )
      .then( () => {
        dcrm.prependStrElement('.page-content','<div id="udc-banner-sticky" data-celebrus-zone="udc-overlay" data-celebrus-type="udc-banner-sticky" data-celebrus-priority="800"></div>');
        logDebug("Sticky ajouté");
      })

    // Popin
    waitForCondition( ()=>!!document.querySelector("#udc-banner-rebond") && !document.querySelector("#udc-banner-popin") )
      .then( () => {
        dcrm.insertStrElementAfter("#udc-banner-rebond", '<div  id="udc-banner-popin" data-celebrus-zone="udc-overlay" data-celebrus-type="udc-banner-popin" data-celebrus-priority="800"></div>');
        logDebug("Popin ajouté");
      })
    }

    // ROP / Titres / Mes cartes / Mes contrats
    if ( /releve-operations|mes-titres|mes-cartes|mes-contrats/.test(currentURL.pathname) ) {
      // Rebond
      waitForCondition( ()=>!!document.querySelector(".ia-title-banner.aem-GridColumn") || (!!document.querySelector(".header-page") && !document.querySelector("#udc-banner-rebond")) )
      .then( () => { 
        let placement = !!document.querySelector(".ia-title-banner.aem-GridColumn") ? ".ia-title-banner.aem-GridColumn":
                        !!document.querySelector(".header-page") ? ".header-page" : false;
        if (!!placement){
          dcrm.insertStrElementAfter(placement,'<div  id="udc-banner-rebond" data-celebrus-zone="udc-top" data-celebrus-type="udc-banner-rebond" data-celebrus-size="1260x630" data-celebrus-priority="1000"></div>') 
          logDebug("Rebond ajouté");
        }        
      });
      // Animation
        waitForCondition(()=>!!document.querySelector('#udc-banner-rebond') && !document.querySelector("#udc-banner-animation"))
        .then(()=> dcrm.insertStrElementAfter('#udc-banner-rebond','<div  id="udc-banner-animation" data-celebrus-zone="udc-overlay" data-celebrus-type="udc-banner-animation" data-celebrus-priority="800"></div>'))
        logDebug("Animation ajouté");
    }

    // Relevés en ligne
    if ( /virements-services\/releves-en-ligne/.test( currentURL.pathname)){
      waitForPlacement(() => !!document.querySelector(".container-mes-documents .pull-left") && !!document.querySelector(".list-") && !!document.querySelector(".list-fav"))
        .then(()=>{
          dcrm.insertStrElementBefore(".container-mes-documents .pull-left",'<div  id="udc-banner-rebond" data-celebrus-zone="udc-top" data-celebrus-type="udc-banner-rebond" data-celebrus-size="1260x630" data-celebrus-priority="1000"></div>');
          logDebug('Rebond ajouté');
          dcrm.insertStrElementAfter(".list-fav",'<div id="udc-banner-animation" data-celebrus-zone="bourse-middle" data-celebrus-type="udc-banner-animation" data-celebrus-size="960x52" data-celebrus-priority="0"></div>');
          logDebug('Animation ajouté');
        })
    }
}

/* Pro --------------------------------------------*/
if ( DCRMclientele == "pro" ) {
  if ( /secure\/comptes-et-contrats(\/mes-contrats|\?types=A-C-R|\/releve-d-operations|)/.test(currentURL.pathname) ){      logDebug("chargement des emplacement PRO");
    // Rebond
    waitForPlacement(()=> !! $('#nextoutils_monbusinessassistant_udc').prev().is('.header-page'))
      .then(()=>{
        dcrm.insertStrElementAfter(".header-page",'<div  id="udc-banner-rebond" data-celebrus-zone="udc-top" data-celebrus-type="udc-banner-rebond" data-celebrus-size="1260x630" data-celebrus-priority="1000"></div>')
        logDebug("rebond ajouté");
      });
    // Popin
    waitForPlacement(() => !!document.querySelector("#udc-banner-rebond") && !document.querySelector("#udc-banner-popin"))
      .then(()=>{
        dcrm.insertStrElementAfter("#udc-banner-rebond",'<div  id="udc-banner-popin" data-celebrus-zone="udc-overlay" data-celebrus-type="udc-banner-popin" data-celebrus-priority="800"></div>');
        logDebug("Popin ajouté");
      })
    // Animation
    waitForPlacement(() => !!document.querySelector("#template-udc-vue-pro") && !document.querySelector("#udc-banner-animation"))
      .then( () => {
        dcrm.insertStrElementAfter("#template-udc-vue-pro > section > div:nth-child(1)",'<div id="zp_udc"><div id="udc-banner-animation" data-celebrus-zone="udc-middle" data-celebrus-type="udc-banner-animation" data-celebrus-size="1260x630" data-celebrus-priority="800"></div></div>');
        logDebug("Animation ajouté");
      })
  }
}
/* BPF -------------------------------------------------*/
if ( DCRMclientele == "bpf" ) {    logDebug("chargement des emplacement BPF");

  // UDC 
  if ( /secure\/comptes-et-contrats/.test( currentURL.pathname ) ){
    // Rebond  
    waitForPlacement(() => !!document.querySelector('.global-udc[class*="item"]'))
      .then(()=>{
        dcrm.insertStrElementAfter('.global-udc[class*="item"]','<div  id="udc-banner-rebond" data-celebrus-zone="udc-top" data-celebrus-type="udc-banner-rebond" data-celebrus-size="1260x630" data-celebrus-priority="1000"></div>')
        logDebug('Rebond ajouté');
      })
    
    // Animation
    waitForPlacement(() => !!document.querySelector("#template-udc-vue-liste"))
      .then(()=>{
        dcrm.appendStrElement("#template-udc-vue-liste > section > div:nth-child(1)",'<div id="zp_udc"></div>');
        dcrm.appendStrElement("#zp_udc",'<div id="udc-banner-animation" data-celebrus-zone="udc-middle" data-celebrus-type="udc-banner-animation" data-celebrus-size="1260x630" data-celebrus-priority="800"></div>');
        logDebug('Animation ajouté');
      })

    // Popin
    waitForPlacement(()=> !!document.querySelector("#udc-banner-rebond") && !document.querySelector("#udc-banner-popin"))
      .then(()=>{
        dcrm.insertStrElementAfter("#udc-banner-rebond",'<div  id="udc-banner-popin" data-celebrus-zone="udc-overlay" data-celebrus-type="udc-banner-popin" data-celebrus-priority="800"></div>');
        logDebug("Popin ajouté")
      })
  }
}