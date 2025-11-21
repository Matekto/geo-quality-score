(function() {
  function ParametersForEER() {
    var liste_parametres = ["code_avantage", "perf_origine", "code_partenaire", "subtracking"];
    var search = document.location.search;
    for (var i = liste_parametres.length - 1; i >= 0; i--) {
      var valeur_param = this.readParameter(liste_parametres[i], search)
      if (typeof valeur_param != "undefined") {
        sessionStorage.setItem(liste_parametres[i], valeur_param);
      }
    }
  }
  ParametersForEER.prototype.readParameter = function(key, paramsString) {
    var result = paramsString.match(
      new RegExp("(\\?|\\#|&)" + key + "(\\[\\])?=([^&]*)")
    );

    return result ? decodeURIComponent(result[3]) : undefined;
  };

  if (!window.bnpp) window.bnpp = {};
    window.bnpp.parameter4EER = new ParametersForEER();
})();
