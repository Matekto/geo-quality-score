function initNewFaqSearchEngine(item) {
  window.GlobalSite = window.GlobalSite || {};
  const waitFor = GlobalSite.checkDependency("GlobalSite.waitFor");

  waitFor(() => typeof window.faq !== "undefined").then(() => {
    window.faq.getInstance().then(init);
  });

  function init() {
    waitFor(() => typeof OApp !== "undefined").then(() => {
      OApp.runLoading("nextoutils_new-faq_mbbpf-autocomplete_search-engine");
      OApp.runLoading("nextoutils_new-faq_mbbpf-popin");
      OApp.runLoading("nextoutils_new-faq_mbbpf-question");
    });
    waitFor(
      () =>
        faq.autocomplete &&
        typeof faq.autocomplete["search-engine"] !== "undefined"
    ).then(redefineAutocomplete);

    initEvents();
  }

  function redefineAutocomplete() {
    Object.assign(window.faq.autocomplete["search-engine"], {
      manageSearchResults,
      reset,
    });
  }

  function manageSearchResults(event, results, source) {
    this.currentResults = results;
    switch (true) {
      case event === "keyup" && results.length > 0:
        $(".faq__search-engine")
          .removeClass("flex-middle")
          .addClass("flex-top");
        this.$resultContainer
          .html(this.getPropositions(results))
          .removeClass("hidden");
        break;
      case event === "keyup" && results.length === 0:
        this.reset();
        break;
      default:
        faq.popin.open(this.$input.val().trim(), results);
        break;
    }
  }

  function reset(resetValue) {
    this.$resultContainer.addClass("hidden").empty();
    if (resetValue) {
      this.$input.val("").trigger("keyup");
    }

    $(".faq__search-engine").removeClass("flex-top").addClass("flex-middle");

    return false;
  }

  function initEvents() {
    $(window).on("scroll", function () {
      if ($(".faq__search-engine__container").not(".hidden")) {
        if (
          $(window).scrollTop() > 0 &&
          !$(".faq__search-engine__popin").hasClass("hidden")
        ) {
          $(".faq__search-engine__container").addClass("fixed");
        } else {
          $(".faq__search-engine__container").removeClass("fixed");
        }
      }

      const scrolled = $(window).scrollTop() >= 40 
      $('.form_search-engine').toggleClass('scrolled', scrolled)
      $('.faq__search-engine__popin').toggleClass('scrolled', scrolled)
    });

    $(document).on('click', function(e) {
      if($('#nextoutils_new-faq_mbbpf-search-engine .faq__search-engine__container:not(.hidden)').length === 0) {
        return;
      }
      var toggle = $(e.target).parents('#nextoutils_new-faq_mbbpf-search-engine').length !== 1;
      $('#' + item + ' .faq__search-engine__container').toggleClass('hidden', toggle);
    })
  }
}
