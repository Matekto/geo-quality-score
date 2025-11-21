var data;

const emergencyBanners = {
  // Bannières de Part -------------------------
  part: {
    in: [
      {
          id: "udc-banner-animation",
          content: {
              emplacement: "udc-banner-animation",
              nom_gabarit: "Gab13",
              picto_banner: "icon-telmi",
              texte_accroche: "Une question ? Telmi vous répond.",
              texte_description: "Découvrez Telmi, votre assistant virtuel disponible 24h/24 et 7j/7 pour vous accompagner.",
              cta_1_texte: "Découvrir",
              cta_1_reponse: "accepted",
              cta_1_url:"/fr/ma-banque-et-moi/assistant-virtuel-telmi?perf_origine=TRA00290",
              univers_campagne: "banque-au-quotidien",
              croix_presence: "true",
              message_id: "BAN_SECOURS_ANIMATION",
              messageweight: "1000",
        },
      },
      // Bannière alternative
      {
          id:"udc-banner-animation",
          content: {
              emplacement: 'udc-banner-animation',
              nom_gabarit: "Gab13",
              picto_banner: "irop-n1102",
              texte_accroche: "L'application Mes Comptes BNP Paribas",
              texte_description: "Gérez vos comptes où que vous soyez avec l'application Mes Comptes, la banque dans votre poche !",
              cta_1_texte: "Découvrir",
              cta_1_reponse: "accepted",
              cta_1_url: "/fr/ma-banque-et-moi/nos-applications/mobile",
              univers_campagne: "banque-au-quotidien",
              croix_presence: "false",
              message_id: "BAN_SECOURS_ANIMATION",
              messageweight: "1000"
          }
      },

      {
        id: "udc-banner-popin",
        content: {
          emplacement: "udc-banner-popin",
          nom_gabarit: "Gab05",
          message_id: "BAN_SECOURS_KYC_POPIN",
        },
      },
    ],
    out: [],
    cookieconsent: [
      {
        id: "udc-banner-animation",
        content: {
          emplacement: "udc-banner-animation",
          nom_gabarit: "Gab13",
          picto_banner: "icon-computer",
          texte_accroche:"Ne passez plus à coté de nos offres personnalisées grâce aux cookies",
          texte_description:"Vos choix en matière de cookies ont déjà  été enregistés. Vous pouvez les modifier à  tout moment pour bénéficier de nos recommandations d'offres adaptées à vos besoins.",
          cta_1_texte: "Paramétrer mes cookies",
          cta_1_reponse: "accepted",
          cta_1_url: "https://cookieconsent",
          cta_1_target: "false",
          cta_1_keep_banner: "true",
          univers_campagne: "banque-au-quotidien",
          croix_presence: "false",
          messageweight: "1000",
          message_id: "BAN_RATTRAPAGE_COOKIES_ANIMATION",
        },
      },
    ],
  },
  /* Fin Bannières de part -------------------------*/
  /* Bannières de Pro ------------------------------*/
  pro: {
    in: [], out: [],
    cookieconsent: [
      {
        id: "udc-banner-animation",
        content: {
          emplacement: "udc-banner-animation",
          nom_gabarit: "Gab13",
          picto_banner: "icon-computer",
          texte_accroche: "Ne passez plus à  coté de nos offres personnalisées grâce aux cookies",
          texte_description: "Vos choix en matière de cookies ont déjà  été enregistés. Vous pouvez les modifier à  tout moment pour bénéficier de nos recommandations d'offres adaptées à  vos besoins.",
          cta_1_texte: "Paramétrer mes cookies",
          cta_1_reponse: "accepted",
          cta_1_url: "https://cookieconsent",
          cta_1_target: "false",
          cta_1_keep_banner: "true",
          univers_campagne: "banque-pro",
          croix_presence: "false",
          messageweight: "1000",
          message_id: "BAN_RATTRAPAGE_COOKIES_ANIMATION",
        },
      },
    ],
  },
  /* Fin Bannières de Pro -------------------------*/
  /* Bannières de BPF -----------------------------*/
  bpf: { in: [], out: [], cookieconsent: []  },
  /* Fin Bannières de BPF -------------------------*/

  // Permet de céer une rotation de banières si plusieurs banières sont définies pour un emplacement 
  banRotation: function (banners) {
      let out = [], banList = banners;
      const placementList = banList.reduce( (prev, current) => !prev.includes(current.id) ? prev.concat(current.id) : prev , [] );  // On extrait la liste des différents emplacements  
      
      // Pour chaque emplacement on choisit la banière par ordre de rotation
      placementList.forEach((placement)=>{
        // On écupère les bannières correspondant aux emplacements
        let banPlacements = banList.filter(banner => banner.id == placement), banCount = sessionStorage.getItem(placement+'Counter') || 0, banIndex = 0;
        if ( banCount <= ( banPlacements.length - 1 ) ) {
          sessionStorage.setItem( placement + 'Counter', Number(banCount) + 1);
          banIndex =  banCount;
        }  
        if ( banCount > (banPlacements.length - 1)) { 
          banIndex =  0;
          sessionStorage.setItem( placement + 'Counter' ,1 );
        }

        // On pousse la banière dans l'output
        out.push(banPlacements[banIndex])
      })
      return out;
  },
  showEmergencyBanners: function (opt) { (this.banRotation(this[DCRMclientele][opt])).forEach( (banner) => emergencyBanners.triggerBanner( banner ) ) }, // Rotation de bannières à  afficher
  triggerBanner: function ( banner ) {
    waitForCondition( () => !!document.querySelector(`#${banner.id}`) )
    .then (()=>{
      window.dispatchEvent(
        new CustomEvent(`rtim-banner:${banner.id}`, {
            detail: {
                placement: { id: banner.id, size: "1260x630", zone: "udc-middle" },
                celebrusHelper: {
                  extended: () => logDebug("extended action sent"),
                  accepted: () => logDebug("accepted action sent"),
                  refused:  () => logDebug("refused action sent"),
                  custom:   (customAction) => logDebug(`custom action: ${customAction}`),
                },
                content:banner.content,
            },
        })
      );
    })
  },
  getRefusalBanner: function () {
    let oneOnFourCounter = Number(sessionStorage.getItem("1on4DCRMBanner")) || 0;
    if ( !( oneOnFourCounter % 4 ) ) emergencyBanners.triggerBanner(emergencyBanners[DCRMclientele].cookieconsent[0]);
    sessionStorage.setItem("1on4DCRMBanner",Number(oneOnFourCounter) + 1);
  }
};

if ( DCRMclientele !== 'bpf') {
  VCXsubmit.port2.onmessage = (message) => {
    var cas = message.data.status;
    
    logDebug("Consent: "+cas);
    
    // Optin
    if (cas == "optin" ) { 
      fetch('/content/dam/mabanque/rsc/contrib/json/celebrus/emergencyBannersSettingsMB.json')
      .then((response) => response.json()).then((retour) => {
        data = retour;    
        logDebug(`Délai avant affichage des bannières d'urgence ${data.timer/1000} sec`);
        setTimeout(() => {
          if ( /\/fr\/secure\/comptes-et-contrats(\/|)$/.test(currentPathname) && !document.querySelector("body>span>script") && !!DCRMclientele ) {
            logDebug('Délai écoulé : chargement des banières de secours');
            emergencyBanners.showEmergencyBanners('in');
          }else{
            logDebug(`Délai écoulé : les spans ont été trouvés, pas d'affichage de bannière de secoours`);
          }
        },data.timer);
      })
    }
    
    // Optout
    if ( cas == "optout" ){
      logDebug('Chargement des bannière de refus');
      emergencyBanners.getRefusalBanner();
    } 
  }
}
else logDebug("Pas de bannière de rattrapage / refus sur BPF");