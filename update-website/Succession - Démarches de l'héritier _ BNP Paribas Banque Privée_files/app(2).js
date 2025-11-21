window.GlobalSite = window.GlobalSite || {};
const Popin = GlobalSite.checkDependency("GlobalSite.Popin");

let newFaqPopin = {
  $container: "",
  containerClass: 'faq__search-engine__popin',
  init: function (item) {
    this.$container = $('#' + item);
    this.initEvents();
  },
  open: function (value, results) {
    let autocompleteSearchEngine = Object.assign(window.faq.autocomplete['search-engine'], {
      getResultQuestionHtmlContent: this.getResultQuestionHtmlContent,
      getResultProductHtmlContent: this.getResultProductHtmlContent
    });
    autocompleteSearchEngine.reset(false);
    autocompleteSearchEngine.showResults(results).then(
      () => autocompleteSearchEngine.searchProductResults(value)
    );
    $('.popin-cache').remove();
    $('.' + this.containerClass).after('<div class="popin-cache hidden"></div>');
    Popin.showPopin($('.' + this.containerClass));
    window.faq.createQuestionListeners();
  },
  close: function () {
    Popin.hidePopin();
    if($('.' + this.containerClass).hasClass("hidden")){
      $('.search-input-field').val('');
      $('.faq__search-engine__container').addClass("hidden");
    }
  },
  getResultQuestionHtmlContent: function (content, i, max) {
    return `<div class="faq__search-engine__popin__result__content ${i >= max ? 'hidden' : ''}">
          <a  href="/fr/faq/${content.slug}"
            data-slug="${content.slug}"
            data-click-code="${content.tracking.clickCode}"
            data-blank="true"
            aria-label="${content.title}"
            class="faq__search-link">
            <p class="faq__search-link-question text-regular w-90">${content.title}</p>
            <div class="faq__search-link-arrow">
              <img src="/rsc/contrib/script/simulateur/new-faq/${window.faq.site()}/assets/img/icon-chevron.svg" alt="">
            </div>
          </a>
          <div class="faq__search-answer-text hidden">
            ${content.attributes.ANSWER_TEXT}
            <div class="rating-container" data-rate-code="${content.tracking.rateCode}">
              <div class="rating-phrase">Ces informations vous ont-elles aidé ?</div>
              <button class="rating-button good-response"><span>Oui</span></button>
              <button class="rating-button bad-response"><span>Non</span></button>
              <div class="rating-comment hidden">
                <span class="rating-comment-phrase">Contribuez à l'amélioration du service en laissant un commentaire :</span>
                <textarea class="rating-comment-textarea"></textarea>
                <button class="btn-comment" disabled><span>Envoyer votre message</span></button>
              </div>
            </div>
          </div>
        </div>`;
  },
  getResultProductHtmlContent: function (content, i, max) {
    return `<div class="faq__search-engine__popin__product__content ${i >= max ? 'hidden' : ''}">
          <a  href="${content.attributes.URL[0]}"
            class="faq__search-link">
            <p class="faq__search-link-question text-regular w-90">${content.title}</p>
            <div class="faq__search-link-arrow">
              <img src="/rsc/contrib/script/simulateur/new-faq/${window.faq.site()}/assets/img/icon-chevron.svg" alt="">
            </div>
          </a>
        </div>`;
  },
  initEvents() {
    $('.js-close-popin').on('click', () => this.close());
    $('.burger-menu.icon-fermer').on('click', () => this.close())
  }
};

function initNewFaqPopin(item) {
  newFaqPopin.init(item);
  window.faq.popin = newFaqPopin;
}