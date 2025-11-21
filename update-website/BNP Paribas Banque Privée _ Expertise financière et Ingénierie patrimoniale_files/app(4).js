function initNewFaqQuestion() {
  GlobalSite.checkDependency("GlobalSite.waitFor")(() => typeof window.faq !== "undefined").then(() => {
    window.faq.getInstance().then(init);
  });

  function init() {
    window.faq.createQuestionListeners = () => {
      initEvents();
    };
  }

  function initEvents() {
    $(".good-response").on("click", function () {
      let parentNode = $(this).parents(".rating-container");
      window.faq.track({ data: { value: 1, code: parentNode.data("rateCode") }, type: "rate" }).then(function () {
        parentNode.html('<p>Merci pour votre contribution.</p>');
      })
    });
    $(".bad-response").on("click", function () {
      let parentNode = $(this).parents(".rating-container");
      window.faq.track({ data: { value: 2, code: parentNode.data("rateCode") }, type: "rate" }).then(function () {
        parentNode.find('.rating-phrase, .good-response, .bad-response').remove();
        parentNode.find('.rating-comment').removeClass("hidden");
      })
    });
    $(".rating-comment-textarea").on("keyup", function () {
      let parentNode = $(this).parents(".rating-container");
      if ($(this).val().length === 0) {
        parentNode.find('.btn-comment').attr('disabled','disabled');
      } else {
        parentNode.find('.btn-comment').removeAttr('disabled');
      }
    });
    $(".btn-comment").on("click", function () {
      let parentNode = $(this).parents(".rating-container");
      window.faq.track({ data: { value: 5, comment: parentNode.find('.rating-comment-textarea').val() || "", code: parentNode.data("rateCode") }, type: "rate" })
        .then(function () {
          parentNode.html('<p>Merci pour votre contribution.</p>');
        })
    });
  }
}