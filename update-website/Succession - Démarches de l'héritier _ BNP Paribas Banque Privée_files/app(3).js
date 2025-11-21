function initNewFaqAutocomplete(item) {
  GlobalSite.checkDependency("GlobalSite.waitFor")(() => typeof window.faq !== "undefined").then(() => {
    window.faq.getInstance().then(() => {
      window.faq.autocomplete = window.faq.autocomplete || [];
      let a = new Autocomplete('#' + item);
      window.faq.autocomplete[item.split("_")[3] || "page"] = a;
      $('.join-unit-autocomplete input').on('keyup', (e) => {
        const method = e.currentTarget.value.length ? 'addClass' : 'removeClass';
        $(e.currentTarget).parent('.join-unit-autocomplete').siblings('.join-unit')[method]('active');
      });
      $(document).on("click", ".js-open-question[data-slug]", function (e) {
        e.stopPropagation();
        $('.join-unit-autocomplete input').val($(e.currentTarget).data("rawTitle"));
        a.search("instant")
        /*** detection si les résultats sont générer depuis autocomplete et créer la valeur <<searchType>> ***/
        window.faq.searchType = "autocompletion";
      });
    });
  })
}