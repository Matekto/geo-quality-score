function initUnblu() {
  function log(msg) {
    console.log(msg);
  }

  /** function predicat pour un set interval avec un compteur */
  function buildPredicatWithMaxcount(predicat, _maxcount, labelCounter) {
    var maxcount = _maxcount || 10;
    var id = new Date().getTime();
    var counterName = "count" + id;
    var isValidPredicat = typeof predicat === "function";
    var _predicat = !isValidPredicat
      ? function() {
          return true;
        }
      : predicat;

    var __predicat = function() {
      _predicat[counterName] = _predicat[counterName] || 0;
      var counter = ++_predicat[counterName];
      var res = _predicat() || counter >= maxcount;

      if (res) {
        log({
          ctx: "built predicat with max counter",
          id: id,
          labelCounter: labelCounter,
          maxcount: maxcount,
          counter: counter,
        });
      }
      return res;
    };

    if (!isValidPredicat) {
      log({
        ctx: "buildPredicatWithMaxcount",
        error: "predicat is not defined or is not a function",
      });
    }
    return __predicat;
  }
  var vision = {
    _excludeURL: {
      connexion: /\/connexion\/?$|\/espace-pro\/?$|\/secure\/?$|\/espace-prive\/?$|\/login\/?$/,
      messagerie: /\/mes-outils\/messagerie\/?$/,
      majmdp: /\/mes-outils\/profil\/code-secret\/?$/,
      agreg: /\/ajouter-compte\/?$/,
      nummobile: /\/profil\/numero-de-mobile\/?$/,
      kyc: /\/profil\/kyc-informations-personnelles\/?$|\/profil\/profil-client\/?$/,
      mail: /\/modifier-mail\/?$/,
      cledigi: /\/cle-digitale\/?$/,
    },
    addFooter: function() {
      var $tmp;
      if ($("body").hasClass("bpf") || GlobalSite.clientUtils.isBpf())
        $tmp = bnpp.$("<li style='width:100%;margin:auto;padding:0'>");
      else $tmp = bnpp.$("<p style='margin:20px auto 0;padding:0'>");
      bnpp
        .$(
          "#foot-content.nav-cross-footer, #footerContent.nav-cross-footer, .footer-section_mentions-legales:last"
        )
        .append(
          $tmp.append(
            bnpp
              .$("<a>")
              .css("cursor", "pointer")
              .text(this.footer.message)
              .addClass(this.footer.class)
          )
        );

      if (
        window.location.href.indexOf("/secure/comptes-et-contrats") !== -1 &&
        window.ENVIRONNEMENT === "QUALIF"
      ) {
        bnpp.$(".icones-footer-contact-bddf:last").append(
          $tmp.append(
            bnpp
              .$("<a>")
              .css("cursor", "pointer")
              .text(this.footer.message)
              .addClass(this.footer.class)
          )
        );
      }
    },
    init: function() {
      this.bandeau.init();
      var _this = this;
      bnpp.$(document).ready(function() {
        if (vision.noUnblu()) return;
        if ($("body").hasClass("bpf")) {
          _this.tmpCompteur = 0;
          _this.tmpInterval = setInterval(function() {
            _this.tmpCompteur++;
            if (
              $("#footerContent #footerContent").length > 0 ||
              _this.tmpCompteur > 10
            ) {
              clearInterval(_this.tmpInterval);
              _this.addFooter();
            }
          }, 500);
        } else _this.addFooter();
      });
      bnpp.$(document).on("click", "." + _this.footer.class, function(e) {
        e.preventDefault();
        _this.generatePopin("ask");
        $("#code_conseiller").on("keypress", function(e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            $(_this.popin.ask.submit).trigger("click");
          }
        });
        if (bnpp.$(this).hasClass("loaded")) return;
        bnpp.$(this).addClass("loaded");
        _this.loadUnblu();
      });
      bnpp.$(document).on("click", _this.popin.ask.submit, function(e) {
        e.preventDefault();
        if ($("#code_conseiller").val() === "") return;
        Popin.hidePopin();
        if (bnpp.$("#vision-mention").is(":visible")) {
          //bnpp.$("[uwtclass='com.unblu.platform.client.uwt.yi']").next("[uwtclass='com.unblu.platform.client.uwt.label.Zp']").find("p").text("");
          setTimeout(function() {
            _this.closeMention(true);
          }, 500);
        } else {
          /*bnpp.$("#x-unblu-root-container [x-unblu-owner='dialog_root']").css("display", "none");
            bnpp.$("#x-unblu-root-container [x-unblu-owner='NotificationService']").css("display", "none");
            bnpp.$("#x-unblu-root-container #HBTab").css("display", "none");
            bnpp.$("#x-unblu-root-container #engagementTab").css("display", "none");*/
          _this.showMention();
        }
      });
      bnpp.$(document).on("click", _this.popin.exit.submit, function(e) {
        e.preventDefault();
        Popin.hidePopin();
        _this.bandeau.close();
        console.log(vision._conv);
        if (vision._conv !== null) {
          vision._conv.endConversation();
        }
      });

      bnpp.$(document).on("click", _this.popin.exit.continue, function(e) {
        e.preventDefault();
        Popin.hidePopin();
      });

      bnpp.$(document).on("click", "#vision-mention .close-vision", function(e) {
        _this.closeMention(false);
      });
      bnpp.$(document).on("click", "#vision-mention .share-vision", function(e) {
        _this.closeMention(true);
      });
      bnpp.$(document).on("click", "#vision-bandeau .exit-share", function(e) {
        _this.generatePopin("exit");
      });
    },
    bandeau: {
      init: function() {
        this.content = bnpp.$(
          '<section id="vision-bandeau"><div class="vision-content row"><div class="col-2 mob-100"><p >Vous êtes en cours de partage d’écran avec votre conseiller</p></div><div class="col-2 mob-100"><button class="btn-secondary small pull-left exit-share">Arrêter le partage d’écran</button></div></div></section>'
        );
        this.content_disabled = bnpp.$(
          '<section id="vision-bandeau"><div class="vision-content row"><p >Pour des raisons de sécurité, le partage d\'écran est désactivé sur cette page</div></div></section>'
        );
        this.style = bnpp.$(
          "<style>#vision-bandeau{background-color: #b4174e;left: 0;right: 0;position: fixed;text-align: center;z-index: 210;bottom: 0;}#vision-bandeau .vision-content{float: none;margin: 0 auto;}#vision-bandeau p {color: #FFF;font-size: 1.1rem;padding-top: 0; padding-bottom: 0}#vision-bandeau>div>div>p{text-align:right;margin:16.5px 0;}#vision-bandeau button {margin-top: 10px;color: #682c46; border-radius : 20px;}@media screen and (max-width: 768px){#vision-bandeau p {text-align:center}}</style>"
        );
      },
      show: function() {
        if (bnpp.$("#vision-bandeau").length > 0) {
          bnpp.$("#vision-bandeau").removeClass("hidden");
        } else {
          bnpp.$("body").append(this.style);
          bnpp
            .$("body")
            .append(vision.noUnblu() ? this.content_disabled : this.content);
        }
        /*bnpp.$("#x-unblu-root-container > div:first-child").css("display", "none");
          bnpp.$("#x-unblu-root-container #HBTab").css("display", "none");
          bnpp.$("#x-unblu-root-container #engagementTab").css("display", "none");
          bnpp.$("[uwtclass='com.unblu.platform.client.uwt.label.Zp'] p").text("Votre conseiller");*/
        bnpp.$("body>#sf-master").css("margin-bottom", "55px");
        sessionStorage.cobrowsing = true;
      },
      close: function() {
        bnpp.$("#vision-bandeau").addClass("hidden");
        sessionStorage.removeItem("cobrowsing");
        //bnpp.$("#x-unblu-root-container").css("display", "none");
        bnpp.$(".x-unblu-icon-close").click();
        var tmp = setInterval(function() {
          if (bnpp.$(".x-unblu-dialog-btn-ok").length > 0) {
            clearInterval(tmp);
            bnpp.$(".x-unblu-dialog-btn-ok").click();
          }
        }, 500);
      },
    },
    showMention: function() {
      bnpp.$.get(
        "/rsc/contrib/script/simulateur/unblu/retail/index.html",
        function(data) {
          var bnp_acquisition = $(".page-content-wrapper").find(".basic-html");
          bnp_acquisition.addClass("hidden");
          bnpp.$(".page-content").addClass("hidden");
          bnpp.$("#mainMenu").addClass("hidden");
          bnpp.$(".page-content, .page-content-wrapper").after(data);
          bnpp.$("html, body").animate(
            {
              scrollTop: 0,
            },
            "slow"
          );
        }
      );
      /*var tmp = setInterval(function () {
          console.log('seach body?x-unblu-scroll-lock');
          if (bnpp.$("body").hasClass("x-unblu-scroll-lock")) {
            clearInterval(tmp);
            bnpp.$("body").removeClass("x-unblu-scroll-lock");
            bnpp.$("html, body").animate({
              scrollTop: 0
            }, 'slow');
          }
        }, 500);*/
    },
    closeMention: function(state) {
      var bnp_acquisition = $(".page-content-wrapper").find(".basic-html");
      if (state) {
        bnpp.$("#userNameInputField").val("Votre interlocuteur");
        bnpp.$("#tokenInput").val(bnpp.$("#code_conseiller").val());
        bnpp.$("#submitButton_cover").click();
        this.waitUnbluStatus(false);
        bnpp.$("#vision-mention").remove();
        bnp_acquisition.removeClass("hidden");
        bnpp.$(".page-content, .page-content-wrapper").removeClass("hidden");
        bnpp.$("#mainMenu").removeClass("hidden");
        bnpp.$("html, body").animate(
          {
            scrollTop: 0,
          },
          "slow"
        );
        /*bnpp.$("[uwtclass='com.unblu.platform.client.uwt.yi']").next("[uwtclass='com.unblu.platform.client.uwt.label.Zp']").appendTo(bnpp.$(".message"))
          _this.ask.show();*/

        //this.bandeau.show();
      } else {
        bnpp.$("#vision-mention").remove();
        bnpp.$("#wrapper").removeClass("hidden");
        bnpp.$("#mainMenu").removeClass("hidden");
        bnp_acquisition.removeClass("hidden");
        bnpp.$(".page-content, .page-content-wrapper").removeClass("hidden");
        bnpp.$("html, body").animate(
          {
            scrollTop: 0,
          },
          "slow"
        );
      }
    },
    generatePopin: function(param) {
      if (bnpp.$("#" + param + "_popin").length != 0)
        bnpp.$("#" + param + "_popin").remove();
      if (bnpp.$("#" + param + "_popin").length == 0) {
        var popin = this.popin.template;
        popin = popin.replace(/{id}/g, param + "_popin");
        popin = popin.replace(/{content-text}/g, this.popin[param].content.text);
        popin = popin.replace(
          /{title}/g,
          this.popin[param].title ? this.popin[param].title : ""
        );
        var inputs = "";
        if (this.popin[param].content.input) {
          this.popin[param].content.input.forEach(function(element) {
            if (element.type == "text")
              inputs +=
                '<div class="input-container"><input class="form-control ' +
                element.class +
                '" type="text" name="input_' +
                element.id +
                '" id="' +
                element.id +
                '" required="" autofocus></div>';

            if (element.type == "div")
              inputs +=
                '<div id="' +
                element.id +
                '" class="small ' +
                element.class +
                '" required>' +
                element.value +
                "</div>";
          });
        }
        popin = popin.replace(/{content-input}/g, inputs);
        var buttons = "";
        if (this.popin[param].button) {
          this.popin[param].button.forEach(function(element) {
            buttons +=
              '<button class="' +
              element.class +
              '">' +
              element.text +
              "</button>";
          });
        }
        popin = popin.replace(/{button}/g, buttons);
        bnpp.$("body").append(bnpp.$(popin));
        try {
          FormHelper.formValidation();
        } catch (e) {}
        Popin.init();
      }
      Popin.showPopin(bnpp.$("#" + param + "_popin"));
    },
    footer: {
      message: "Pour partager votre écran avec un conseiller, cliquez ici.",
      class: "open_vision",
    },
    popin: {
      template:
        '<div id="{id}" class="popin popin-alert hidden"><a class="close popin-close">✕</a><div class="popin-content confirmation"><p class="big">{title}</p><p>{content-text}</p><form class="form validate-form" novalidate="novalidate" autocomplete="off" action="#" onsubmit="return false;" ><div class="row">{content-input}</div></form><div class="row">{button}</div></div></div>',
      ask: {
        title: "BESOIN D’AIDE ?",
        content: {
          text: "Saisissez le code PIN communiqué par le conseiller ici :",
          input: [
            {
              id: "code_conseiller",
              type: "text",
              class: "numeric digits",
            },
            {
              id: "unblu_activation_element_start",
              type: "div",
              class: "btn-primary",
              value: "OK",
            },
          ],
        },
        submit: "#unblu_activation_element_start",
      },
      exit: {
        content: {
          text:
            "Êtes-vous sûr de vouloir quitter le mode de partage d’écran avec votre conseiller ?",
        },
        button: [
          {
            text: "Oui, arrêter le partage",
            class: "btn-primary confirm-exit-share ",
          },
          {
            text: "Non, continuer",
            class: "btn-secondary continue-share",
          },
        ],
        submit: ".confirm-exit-share",
        continue: ".continue-share",
      },
    },
    noUnblu: function() {
      return (
        this._excludeURL.connexion.test(document.location.pathname) ||
        //this._excludeURL.messagerie.test(document.location.pathname) ||
        this._excludeURL.majmdp.test(document.location.pathname) ||
        this._excludeURL.agreg.test(document.location.pathname) ||
        this._excludeURL.nummobile.test(document.location.pathname) ||
        this._excludeURL.kyc.test(document.location.pathname) ||
        this._excludeURL.mail.test(document.location.pathname) ||
        this._excludeURL.cledigi.test(document.location.pathname)
      );
    },
    loadUnblu: function() {
      if (this.noUnblu()) {
        vision.bandeau.show();
        //return;
      }
      /*unblu.c = [];
        unblu.registerApiConsumer = function(callback, errorCallback, apiNames) {
          if (callback instanceof Array) {
            if (window["Promise"]) {
              return new Promise(function(resolve, reject) {
                unblu.c.push({a: callback, c: resolve, e: reject});
              });
            } else {
              throw new Error("Promise not available");
            }
          }
          unblu.c.push({a: apiNames, c: callback, e: errorCallback});
        }
        unblu.setLocale = function(locale) {
          unblu.l = locale;
        }
        if (!window["x-unblu-tmp-window-name"])
          window["x-unblu-tmp-window-name"]=window.name;*/
      var q = document.getElementsByTagName("script")[0];
      if (q) {
        var g = document.createElement("script"),
          f = document.createElement("script");

      if (window.ENVIRONNEMENT !== "QUALIF")
        g.setAttribute(
          "src",
          "https://unblu.mabanque.bnpparibas/unblu/visitor.js?x-unblu-apikey=DaxS9eihTqSmF2u3bqywDg"
        );
      else
      g.setAttribute(
        "src",
        "https://staging.unblu.mabanque.bnpparibas/unblu/visitor.js?x-unblu-apikey=z38JfLdtR_SDZWs4BZMjVQ"
      );
      g.setAttribute("type", "text/javascript");
      g.setAttribute("defer", "defer");
      q.parentNode.appendChild(g);

      f.setAttribute(
        "onload",
        (function() {
        console.log("unblu!!!!", window.unblu);
        })()
      );
      if (window.ENVIRONNEMENT !== "QUALIF")
        f.setAttribute(
          "src",
          "https://unblu.mabanque.bnpparibas/unblu/js-api/v2/visitor/visitor-api.min.js"
        );
      else
        f.setAttribute(
          "src",
          "https://staging.unblu.mabanque.bnpparibas/unblu/js-api/v2/visitor/visitor-api.min.js"
        );

      f.setAttribute("type", "text/javascript");
      f.setAttribute("defer", "defer");
      q.parentNode.appendChild(f);
      }
      this.waitUnbluStatus();
    },
    unbluStart: function() {
      const pinInput = document.getElementById("code_conseiller");

      if (window.unblu && pinInput.value !== "") {
        window.unblu.api
          .initialize()
          .then(function(api) {
            api.on("activeConversationChange", function(e) {
              console.log("!!!!", e);
            });
            return api.joinConversation(pinInput.value);
          })
          .then(
            function(conv) {
              this.setConvEvents(conv);
              sessionStorage.cobrowsing = true;
              pinInput.value = "";
            }.bind(this)
          )
          .catch(function(e) {
            if (e.type === "EXECUTION_EXCEPTION") {
              sessionStorage.removeItem("cobrowsing");
              alert("Code PIN incorrecte!!");
            }

            console.log(e);
          });
      }
    },
    setConvEvents: function(conv) {
      conv.on("close", function(e) {
        console.log("close", e);
      });
      conv.on("connectionStateChange", function(e) {
        console.log("connectionStateChange", e);
      });
      conv.on("end", function(e) {
        vision.bandeau.close();
        sessionStorage.removeItem("cobrowsing");
        console.log(sessionStorage.getItem("cobrowsing"));
      });

      var predicateUnblu = buildPredicatWithMaxcount(this.predicat, 20, "unblu");
      var idint = setInterval(
        function() {
          var test = predicateUnblu();
          if (test) {
            clearInterval(idint);
            if (this.perdicatUnbluButton()) {
              $('[component="VisitorLayerControlsComponentLarge"]').hide();
              vision.bandeau.show();

              this.reloadEER();
            }
            if (this.noUnblu()) {
              console.log("no unbluuu ______not sharing ----------------");
              $("body").attr("x-unblu-skip-element", "true");
            }
          }
        }.bind(this),
        300
      );
      vision.bandeau.show();
      vision._conv = conv;
    },
    setConvEvents_: function(conv) {
      conv.on("close", function(e) {
        console.log("close", e);
      });
      conv.on("connectionStateChange", function(e) {
        if (e === "CONNECTED") vision.bandeau.show();
        console.log("connectionStateChange", e);
      });
      conv.on("end", function(e) {
        vision.bandeau.close();
        sessionStorage.removeItem("cobrowsing");
        console.log(sessionStorage.getItem("cobrowsing"));
      });

      vision._conv = conv;
    },
    /** reload eer form if the client start a cobrowsing session from the form page. In
     * order to pass the cobrowsing param to mosaic
     */
    reloadEER: function reloadEER() {
      if (
        window.location.pathname.indexOf("comment-souscrire") === 0 &&
        window.location.pathname.indexOf("ouvrir-un-compte") !== -1 &&
        !window.location.hash
      ) {
        window.location = window.location + "#loaded";
        window.location.reload();
      }
    },
    /** predicat sur l'exsitance de l'instance unblu sur le site */
    predicat: function predicat() {
      return typeof window.unblu !== "undefined";
    },

    /** predicat sur l'apparence du bouton injecté par Unblu */
    perdicatUnbluButton: function perdicatUnbluButton() {
      return $('[component="VisitorLayerControlsComponentLarge"]').length > 0;
    },
    waitUnbluStatus: function(allreadyActive) {
      if (sessionStorage.getItem("cobrowsing") === "true") {
        var predicateUnblu = buildPredicatWithMaxcount(
          this.predicat,
          20,
          "unblu"
        );
        var idint = setInterval(
          function() {
            var test = predicateUnblu();
            if (test) {
              clearInterval(idint);
              if (this.predicat()) {
                this._unbluApi = window.unblu;
                var _this = this;
                var int_unblu = setInterval(function() {
                  window.unblu.api.initialize().then(function(api) {
                    clearInterval(int_unblu);
                    window.apiUi = api;
                    api.on("activeConversationChange", function(newConv) {
                      console.log("change conv state", newConv);
                      if (newConv !== null) {
                        _this.setConvEvents(newConv);
                      }
                    });
                  });
                }, 300);
              } else {
                alert("Erreur lors du chargement du cobrowsing");
              }
            } else {
              console.log("searching");
            }
          }.bind(this),
          300
        );
      } else {
        this.unbluStart();
      }
    },
  };

  (function() {
    var monInterval = {
      cpt: 0,
      interval: 500,
      max: 10000,
    };
    monInterval.id = setInterval(function() {
      monInterval.cpt++;
      if (!bnpp || !bnpp.$) {
        if (monInterval.cpt * monInterval.interval > monInterval.max)
          clearInterval(monInterval.id);
        return;
      }
      clearInterval(monInterval.id);

      if (!window["unblu"]) {
        /*window.unblu = {
            APIKEY: "kPz-QAgmTpO-76BEks2rlg", 
            SERVER: "https://start.unblu.com",
            ACTIVATE : {
              PROD:true, 
              MACHINE:true, 
              PREVIEW:true, 
              QUALIF:true,
              NO_ENV:true,
              LOCAL:true
            }
                };*/
        const unb = {
          ACTIVATE: {
            PROD: true,
            MACHINE: true,
            PREVIEW: true,
            QUALIF: true,
            NO_ENV: true,
            LOCAL: true,
          },
        };
        if (!unb.ACTIVATE[window.ENVIRONNEMENT]) return;
        vision.init();

        if (sessionStorage.cobrowsing) {
          vision.loadUnblu();
        }
      }
    }, monInterval.interval);
  })();
}