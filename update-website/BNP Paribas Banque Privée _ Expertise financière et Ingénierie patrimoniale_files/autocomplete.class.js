class Autocomplete {
  constructor(item) {
    this.container = item;
    this.$resultContainer = $(
      this.container + " .faq__search-result-container"
    );
    this.config = $(this.container).data();
    this.questionContainerClass =
      this.config.questionContainer || "faq__search-most-asked-questions";
    if (this.config.productContainer) {
      this.productContainerClass = this.config.productContainer;
    }
    if (["mbpart", "mbbpf"].includes(window.faq.site())) {
      this.questionContainerClass =
        "faq__search-engine__popin__result__container";
      this.productContainerClass =
        "faq__search-engine__popin__product__container";
    }

    this.resultTitle =
      this.config.resultTitle ||
      "<b>[[NB_QUESTION]] résultats</b> correspondent à votre recherche :";
    this.singleResultTitle =
      this.config.singleResultTitle ||
      "<b>1 résultat</b> correspond à votre recherche :";
    this.noResultTitle =
      this.config.noResultTitle ||
      `Aucun résultat ne correspond à votre recherche.`;

    if (window.faq.site() == "hbpart") {
      this.resultTitle =
        "<b>[[NB_QUESTION]] résultats</b> correspondent à &laquo;<b>[[QUESTION]]</b>&raquo;";
      this.singleResultTitle =
        "<b>1 résultat</b> correspond à &laquo;<b>[[QUESTION]]</b>&raquo;";
      this.noResultTitle = `Aucun résultat ne correspond à &laquo;<b>[[QUESTION]]</b>&raquo;`;
    }

    this.resultTemplate = this.$resultContainer.html();
    this.$input = this.generateInputId();
    this.isWriting = false;
    this.lastSearch = "";
    this.initEvents();
    $(this.container + " .faq__search-autocomplete").removeClass("hidden");
  }
  generateInputId() {
    const searchId = "search" + Date.now();
    let $searchInput = $(this.container + " .search-input-field").attr(
      "id",
      searchId
    );
    $(this.container + " label").attr("for", searchId);
    return $searchInput;
  }
  initEvents() {
    $(this.container + " img").on("click", () => this.search("click"));
    $(this.container + ' [type="button"]').on("click", e => {
      e.preventDefault();
      this.search("click");
    });
    this.$input.on("keyup", e => {
      if (
        (e.key === "ArrowDown" || e.key === "ArrowUp") &&
        !this.$resultContainer.hasClass("hidden")
      ) {
        e.stopPropagation();
        this.selectNextResult(e.key === "ArrowDown" ? 1 : -1);
      } else if (
        e.key === "Enter" &&
        this.$resultContainer.find(".faq__search-result.active").length === 1
      ) {
        this.$resultContainer
          .find(".faq__search-result.active button")
          .trigger("click");
      } else {
        this.$input
          .prev("label")
          .toggleClass("hidden", this.$input.val().trim().length > 0);
        if (this.isWriting) {
          clearTimeout(this.isWriting);
        }
        this.isWriting = setTimeout(() => {
          clearTimeout(this.isWriting);
          this.isWriting = false;
          this.search(e.key === "Enter" ? "click" : e.type);
        }, 500);
      }
    });
  }
  search(event) {
    const value = this.$input.val().trim();
    if (event !== "click" && value === this.lastSearch) {
      // The user clicked on a key that didn't change the input (such as an arrow key)
    } else if (value.length >= 2) {
      this.lastSearch = value;
      const source = window.faq.source(this.$input),
        isClick = event === "click";
      window.faq
        .search(
          {
            query: value,
            length: isClick ? 100 : 5,
            type: isClick ? "search" : "instant"
          },
          source
        )
        .then(({ results }) =>
          this.manageSearchResults(event, results, source)
        );
    } else {
      this.reset();
    }
  }
  manageSearchResults(event, results, source) {
    this.currentResults = results;
    switch (true) {
      case event === "click" && results.length === 1:
        window.faq.redirectToQuestion(
          {
            clickCode: results[0].tracking.clickCode,
            rateCode: results[0].tracking.rateCode,
            slug: results[0].slug
          },
          "click",
          source
        );
        break;
      case event === "keyup" && results.length > 0:
        this.$resultContainer
          .html(this.getPropositions(results))
          .removeClass("hidden");
          if (window.faq.site() == "hbpart") {
            $(this.container + ' .search-input-field').attr(
                'aria-expanded',
                'true'
            );
          }
        break;
      case event === "keyup" && results.length === 0:
        this.reset();
        break;
      default:
        this.reset();
        this.showResults(results);
        break;
    }
  }
  reset(resetValue) {
    this.$resultContainer.addClass("hidden").empty();
    if (resetValue) {
      this.$input.val("").trigger("keyup");
    }
    if (window.faq.site() == "hbpart") {
      $(this.container + ' .search-input-field').attr(
          'aria-expanded',
          'false'
      );
    }
    return false;
  }
  getPropositions(results) {
    return results
      .map(content => {
        let resultTemplate = this.resultTemplate;
        if (window.faq.site() === "hbpart") {
          resultTemplate = resultTemplate.replace("[[ID_RESULT]]", content.id);
        }
        return resultTemplate

            .replace("[[SLUG]]", content.slug)
            .replace("[[CLICK_CODE]]", content.tracking.clickCode)
            .replace("[[RATE_CODE]]", content.tracking.rateCode)
            .replace("[[RAW_TITLE]]", content.title)
            .replace("[[TITLE]]", this.sanitizeTitle(content.title))
            .replace("[[CONTENT]]", content.attributeArrays.ANSWER_TEXT[0]);
      })
        .join("");
  }
  sanitizeTitle(title) {
    const inputValue = this.$input.val().trim();
    let additionalClasses =
      window.faq.site() === "mbpart" ? "" : "text-teal-blue";
    let clean = title.replace(
      new RegExp(inputValue, "gim"),
      `<span class='${additionalClasses} font-bold'>${inputValue}</span>`
    );
    if (clean.indexOf("<span>") === 0) {
      let ss = clean.replace("<span>", "");
      return (
        "<span class='text-teal-blue font-bold'>" +
        ss.charAt(0).toUpperCase() +
        ss.slice(1)
      );
    } else {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }
  getResultQuestionHtmlContent(content, i, max) {
    let struct = (window.faq.site() == "hbpart") ? "li" : "div";
    return `<${struct} class="faq__search-most-asked-questions__content ${
      i >= max ? "hidden" : ""
    }">
                      <a  href="/fr/faq/${content.slug}"
                          data-slug="${content.slug}" 
                          data-click-code="${content.tracking.clickCode}" 
                          data-rate-code="${content.tracking.rateCode}" 
                          aria-label="${content.title}" 
                          class="faq__search-link flex flex-between bd-bottom-1 ${
                            i == 0 ? "bd-top-1" : ""
                          } bd-grey px-4 py-6 align-items-center cursor-pointer a-left js-redirect-question">
                          <p class="faq__search-link-question text-regular w-90">${
                            content.title
                          }</p>
                          <div class="faq__search-link-arrow rotate-m90">
                              <img src="/rsc/contrib/script/simulateur/new-faq/${window.faq.site()}/assets/img/icon-chevron.svg" alt="Accéder à ${
      content.title
    }">
                          </div>
                      </a>
                  </${struct}>`;
    
  }
  showResults(results) {
    let $container = $("." + this.questionContainerClass);
    let maxResults = ["mbpart", "mbbpf"].includes(window.faq.site()) ? 3 : 5;

    if ($container.length === 0) {
      return;
    }

    const $title = $container.children("h2, .faq__title");
    $title.addClass("--no-result");

    if (results.length === 0) {
      $title.addClass("mb-30").html(this.noResultTitle);
      $container.children("div").remove();
      $container.children("ul.faq__search-most-asked-questions__list").remove();
      $container.children("a").addClass("hidden");
      /*** ***/
      $("." + this.productContainerClass).children("a").addClass("hidden");
      $("." + this.productContainerClass).children("div").remove();
      $("." + this.productContainerClass).children("h2").addClass("--no-result").empty();
    } else {
      let html = results
        .map((c, i) => this.getResultQuestionHtmlContent(c, i, maxResults))
        .join("");
      let singleOrPluralWording =
        results.length === 1 ? this.singleResultTitle : this.resultTitle;

      singleOrPluralWording = singleOrPluralWording
        .replace("[[NB_QUESTION]]", results.length)
        .replace("[[QUESTION]]", this.$input.val().trim());

      $container.children("div").remove();
      $container.children("ul.faq__search-most-asked-questions__list").remove();
      $title.next().remove();
      $title
        .removeClass("--no-result mb-30")
        .html(singleOrPluralWording)
        .after((window.faq.site() == "hbpart") ? '<ul>' + html + '</ul>' : html);
      if (results.length > maxResults) {
        $container
          .children("a")
          .data("action", "show")
          .removeClass("hidden");
      } else {
        $container.children("a").addClass("hidden");
      }
    }
    return $.Deferred().resolve(true);
  }
  searchProductResults(value, source) {
    if (!this.productContainerClass) {
      return;
    }

    let $container = $("." + this.productContainerClass);

    if ($container.length === 0) {
      return;
    }

    const $title = $container.children("h2");

    source = source || window.faq.source(this.$input);

    window.faq
      .federatedSearches({ requests: [{ query: value, length: 10 }] }, source)
      .then(({ results }) => {
        if (results[0].numberOfResults === 0) {
          if (!this.currentResults || this.currentResults.length === 0) {
            let $faqResultTitle = $("." + this.questionContainerClass).children(
              "h2"
            );
            $faqResultTitle
              .removeClass("mb-30")
              .html("Aucun résultat ne correspond à votre recherche.");
            $title.empty();
          } else {
            $title.html(
              `Aucun résultat ne correspond à votre recherche dans les <b>Services et Produits</b>.`
            );
          }
          $container.children("div").remove();
          $container.children("ul.faq__search-most-asked-questions__list").remove();
          $container.children("a").addClass("hidden");
        } else {
          let html = results[0].results
            .map((c, i) => this.getResultProductHtmlContent(c, i, 3))
            .join("");
          $container.children("div").remove();
          $container.children("ul.faq__search-most-asked-questions__list").remove();
          let manyResults =
            results[0].results.length === 1 ? "résultat" : "résultats";
          $title.removeClass("--no-result")
            .html(
              `Nous avons trouvé <b>${results[0].results.length} ${manyResults}</b> dans les <b>Services et Produits</b>`
            )
            .after(html);
          if (results[0].results.length > 3) {
            $container
              .children("a")
              .data("action", "show")
              .removeClass("hidden");
          } else {
            $container.children("a").addClass("hidden");
          }
        }
      });
  }
  selectNextResult(sign) {
    if (this.$resultContainer.find(".faq__search-result.active").length) {
      const activeResult = this.$resultContainer.find(
        ".faq__search-result.active"
      );
      activeResult.removeClass("active");
      let position =
        (activeResult.index() + sign) % this.$resultContainer.children().length;
      this.$resultContainer
        .children()
        .eq(position)
        .addClass("active");
    } else {
      const fn = sign === 1 ? "first" : "last";
      this.$resultContainer
        .find(".faq__search-result")
        [fn]()
        .addClass("active");
    }
    if (window.faq.site() == "hbpart") {
      const faqSearchResultActive = this.$resultContainer.find(".faq__search-result.active").attr('id');
      $(this.container + ' .search-input-field').attr(
          'aria-activedescendant',
          faqSearchResultActive
      );
    }
  }
  setValue(value) {
    this.$input.val(value).trigger("keyup");
    this.lastSearch = value;
  }
}
