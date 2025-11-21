/* A class that is used to make ajax calls to the inbenta api. */
class Faq {
  constructor() {
    window.GlobalSite = window.GlobalSite || {};
    try {
      // This try catch is in place because GlobalSite.checkDependency("GlobalSite.clientUtils") triggers an error on the BPF site
      this.clientUtils = GlobalSite.checkDependency('GlobalSite.clientUtils');
    } catch (error) {
      this.clientUtils = {
        isProd: () => ENVIRONNEMENT === 'PROD',
        isPreview: () => ENVIRONNEMENT === 'PREVIEW',
        isPart: () =>
          window.GlobalSite.$body.hasClass('part') ||
          window.GlobalSite.$body.find(
            '#nextoutils_new-faq_mbpart-search-engine'
          ).length > 0,
        isBpf: () =>
          window.GlobalSite.$body.hasClass('bpf') ||
          window.GlobalSite.$body.find(
            '#nextoutils_new-faq_mbbpf-search-engine'
          ).length > 0,
        isPro: () =>
          window.GlobalSite.$body.hasClass('pro') ||
          window.GlobalSite.$body.find(
            '#nextoutils_new-faq_mbpro-search-engine'
          ).length > 0,
        isHb: () =>
          window.GlobalSite.$body.hasClass('hb') ||
          window.GlobalSite.$body.find(
            '#nextoutils_new-faq_hbpart-search-engine'
          ).length > 0,
        isHbPro: () =>
          window.GlobalSite.$body.hasClass('hbpro') ||
          window.GlobalSite.$body.find(
            '#nextoutils_new-faq_hbpro-search-engine'
          ).length > 0,
      };
    }

    this.config = JSON.parse(localStorage.getItem('faqSeo')) || {};

    if (this.clientUtils.isProd() || this.clientUtils.isPreview()) {
      this.apiserver = '//w-services.bnpparibas.net/services';
      this.config.env = 'production';
    } else {
      this.apiserver = '//w-services.bnpparibas.net/staging';
      this.config.env = 'preproduction';
    }

    this.urlFAQ = {
      hbpro: {
        top: '/fr/faq/les-questions-les-plus-frequentes',
        root: '/fr/faq/',
        category: '/fr/faq/rubrique/',
      },
      hbpart: {
        top: '/faq/les-questions-les-plus-frequentes',
        root: '/faq/',
        category: '/faq/rubrique/',
      },
      mbpart: {
        top: '/fr/faq/les-questions-les-plus-frequentes',
        root: '/fr/faq/',
        category: '/fr/faq/rubrique/',
      },
      mbbpf: {
        top: '/fr/faq/les-questions-les-plus-frequentes',
        root: '/fr/faq/',
        category: '/fr/faq/rubrique/',
      },
    };
  }
  auth() {
    return $.Deferred((d) => {
      if (this.config.session && !this.isExpire()) {
        this.initSession().then(() => d.resolve(true));
      } else {
        $.ajax(
          this.apiserver +
            '/apiDF_/public/api/inbenta/get-token?site=' +
            this.site(true)
        ).then((data) => {
          this.setConfig(data);
          this.initSession().then(() => d.resolve(true));
        });
      }
    });
  }
  getInstance() {
    let deferred = $.Deferred();

    this.initEvents();
    deferred.resolve(this);

    //this.auth().then(() => {});

    this.getInstance = () => deferred;

    return deferred;
  }
  async initSession() {
    const knowledgeApiName = GlobalSite.isConnected
      ? 'connectedKnowledge'
      : 'knowledge';
    const searchApiName = GlobalSite.isConnected ? 'connectedSearch' : 'search';
    const response = await Promise.all([
      this.getSession(knowledgeApiName, '/v1/inbtrck/session'),
      this.getSession(searchApiName, '/v1/tracking/session'),
    ]);
    this.config[knowledgeApiName].session = response[0].sessionToken;
    this.config[searchApiName].session = response[1].sessionToken;
  }
  site(backendVersion) {
    window.GlobalSite = window.GlobalSite || {};
    let site;
    switch (true) {
      case this.clientUtils.isPart && this.clientUtils.isPart():
        site = backendVersion ? 'part' : 'mbpart';
        break;
      case this.clientUtils.isBpf && this.clientUtils.isBpf():
        site = backendVersion ? 'bpf' : 'mbbpf';
        break;
      case this.clientUtils.isPro && this.clientUtils.isPro():
        site = backendVersion ? 'pro' : 'mbpro';
        break;
      case this.clientUtils.isHb && this.clientUtils.isHb():
        site = backendVersion ? 'hellobank' : 'hbpart';
        break;
      case this.clientUtils.isHbPro && this.clientUtils.isHbPro():
        site = 'hbpro';
        break;
    }
    return site;
  }
  setConfig(data) {
    Object.assign(this.config, data);
    localStorage.setItem('faqSeo', JSON.stringify(this.config));
  }
  getHeaders(additionalHeaders, api) {
    let headers = {
      'x-inbenta-key': api.key,
      'x-inbenta-env': this.config.env,
      'Content-Type': 'application/json',
    };
    if (api.user) {
      headers['x-inbenta-user-type'] = api.user;
    }
    if (api.accessToken) {
      headers['Authorization'] = `Bearer ${api.accessToken}`;
    }
    if (api.session) {
      headers['x-inbenta-session'] = api.session;
    }
    if (additionalHeaders) {
      headers = { ...headers, ...additionalHeaders };
    }
    return headers;
  }
  isExpire() {
    return (
      !this?.config?.session?.expiration ||
      new Date().getTime() > this?.config?.session?.expiration
    );
  }
  request(data, additionalHeaders, apiName) {
    const knowledgeApiName = GlobalSite.isConnected
      ? 'connectedKnowledge'
      : 'knowledge';
    if (this.isExpire()) {
      return this.auth().then(() =>
        this.request(data, additionalHeaders, apiName)
      );
    } else {
      let api = this.config[apiName || knowledgeApiName];
      data.headers = this.getHeaders(additionalHeaders, api);
      data.url = api.url + data.url;
      return $.ajax(data);
    }
  }
  getContent(id) {
    return this.request({
      url: '/v1/contents/' + id,
      data: { tracking: false },
    });
  }
  getContentBySlug(slug) {
    return this.request({
      url: '/v1/contents/slug/' + slug,
      data: { tracking: false },
    });
  }
  track(data, additionalHeaders) {
    return this.request(
      {
        method: 'POST',
        url: '/v1/inbtrck/events',
        data: JSON.stringify(data),
      },
      {
        ...additionalHeaders,
        ...{
          'x-inbenta-session': this.config.knowledge.session,
          'x-inbenta-source': this.config.source,
        },
      }
    );
  }
  getSession(apiName, route) {
    return this.request({ method: 'POST', url: route }, {}, apiName);
  }
  search(payload, source) {
    return this.request(
      {
        method: 'POST',
        url: '/v1/search',
        data: JSON.stringify(payload),
      },
      { 'x-inbenta-source': source }
    );
  }
  federatedSearches(payload, source) {
    const searchApiName = GlobalSite.isConnected ? 'connectedSearch' : 'search';
    return this.request(
      {
        method: 'POST',
        url: '/v1/federated-searches',
        data: JSON.stringify(payload),
      },
      { 'x-inbenta-source': source },
      searchApiName
    );
  }
  getRelatedContent(categoryId, length) {
    const data = { length: length || 5 };
    if (!categoryId) {
      return this.request({ url: '/v1/contents/push?categoryId=0', data });
    } else {
      if (categoryId.indexOf(',') !== -1) {
        categoryId = categoryId.split(',')[0];
      }
      return this.request({
        url: '/v1/categories/' + categoryId + '/contents',
        data,
      });
    }
  }
  redirectToQuestion(item, eventType, element, blank) {
    const site = this.site();
    const source = this.source(element);
    this.setConfig({
      tracking: {
        clickCode: item.clickCode,
        rateCode: item.rateCode,
        eventType,
        source,
      },
    });
    if (site === 'mbpart' || site === 'mbbpf') {
      this.config.source = source;
      this.track(
        {
          data: { code: item.clickCode },
          type: eventType,
        },
        {
          'x-inbenta-source': source,
        }
      ).then(this.resetTracking());
      element.find('.faq__search-link-arrow').toggleClass('rotate-up');
      element.next().toggleClass('hidden');
      return false;
    }
    if (blank || source === 'faq_questions_frequentes') {
      window.open(`${this.urlFAQ[site].root}${item.slug}`, '_blank');
    } else {
      location.href = `${this.urlFAQ[site].root}${item.slug}`;
    }
    return false;
  }
  resetTracking() {
    delete this.config.tracking;
    localStorage.setItem('faqSeo', JSON.stringify(this.config));
  }
  initEvents() {
    let _this = this;
    $(document)
      .on('click', '.popin-cache', function (e) {
        $('.search-input-field').val('');
        $('.popin-cache').addClass("hidden");
        $('.faq__search-engine__popin').addClass("hidden");
        $('.faq__search-engine__container').addClass("hidden");
      })
      .on(
        'click',
        '.faq__search-link[data-slug], .js-redirect-question[data-slug]',
        function (e) {
          e.preventDefault();
          const $this = $(this),
            data = $this.data();

          if (!data.slug) {
            return false;
          }

          let eventType = $this.is('button') ? 'instant_click' : 'click';

          /***
           Récupérer la valeur <<searchType>>
           mettre à jour <<eventType>> s'il s'agit de autocompletion
           Suppression de la valeur <<searchType>>
           ***/
          const searchType = window.faq.searchType;
          if(searchType === "autocompletion"){
            eventType = 'instant_click';
            window.faq.searchType = "";
          }

          $.Deferred((d) => {
            if (!data.clickCode) {
              _this
                .getContentBySlug(data.slug)
                .then(({ results }) =>
                  d.resolve({ ...{ slug: data.slug }, ...results[0].tracking })
                );
            } else {
              d.resolve(data);
            }
          }).then((item) =>
            _this.redirectToQuestion(item, eventType, $this, data.blank)
          );
        }
      )
      .on('click', '.js-show-more-questions', function (e) {
        e.preventDefault();
        if ($(this).data('action') || _this.page() === 'category') {
          $(this).addClass('hidden').siblings().removeClass('hidden');
        } else {
          const redirectionUrl = (_this.site() !== 'hbpart') ? '/fr' : '';
          window.location.href = redirectionUrl + '/faq/les-questions-les-plus-frequentes';
        }
      })
      .on('click', '.js-show-all-categories', function (e) {
        e.preventDefault();
        $('.faq__all-topics')[0].scrollIntoView({ behavior: 'smooth' });
      });
  }
  page() {
    const pathname = window.location.pathname;
    const site = this.site();
    let page;
    switch (true) {
      case pathname.indexOf(this.urlFAQ[site].category) === 0:
        page = 'category';
        break;
      case pathname.indexOf(this.urlFAQ[site].top) === 0:
        page = 'top';
        break;
      case pathname.indexOf(this.urlFAQ[site].root) === 0 &&
        $('#contentId').length === 1:
        page = 'question';
        break;
      case pathname.indexOf(this.urlFAQ[site].root) === 0:
        page = 'home';
        break;
      default:
        page = 'other';
        break;
    }

    return page;
  }
  source($elem) {
    const page = this.page();
    const site = this.site();
    let source;
    switch (true) {
      case $elem &&
        $elem.parents('.faq__search-engine__container').length === 1:
      case $elem &&
        $elem.parents('.faq__search-engine__popin__container').length === 1:
        if (site === 'mbpart') {
          source = GlobalSite.isConnected
            ? 'part_faq_mr_client'
            : 'part_faq_mr_prospect';
        } else if (site === 'mbbpf') {
          source = GlobalSite.isConnected ? 'BPF_MR' : 'bpf_faq_mr_prospect_';
        } else {
          source = 'faq_mr_prospect';
        }
        break;
      case page === 'category':
        source = 'faq_page_rubrique';
        break;
      case page === 'top':
        source = 'faq_questions_frequentes';
        break;
      case page === 'question':
        source = 'faq_page_dediee';
        break;
      case page === 'home':
        source = 'faq_accueil_FAQ';
        break;
    }

    return source;
  }
  unknownSource() {
    const referrer = document.referrer ? new URL(document.referrer) : '';
    const site = this.site();
    let source;
    switch (true) {
      case referrer === '' ||
        referrer.hostname !== location.hostname ||
        referrer.pathname === location.pathname:
        source = 'faq_site_externe';
        break;
      case referrer &&
        referrer.hostname === location.hostname &&
        referrer.pathname.indexOf(this.urlFAQ[site].root) === 0:
        source = 'faq_page_dediee';
        break;
      case referrer &&
        referrer.hostname === location.hostname &&
        referrer.pathname !== location.pathname:
        source = 'faq_page_produit';
        break;
    }
    return source;
  }
  eventType($elem) {
    let eventType;
    const referrer = document.referrer ? new URL(document.referrer) : '';
    switch (true) {
      //Moteur de recherche autocomplete (multiresult)
      case $elem && $elem.is('button'):
        eventType = 'instant_click';
        break;
      //Contenu épinglé // Rubrique // Sujet qui peuvent vous intéresser
      case $elem:
        eventType = 'click';
        break;
      //Lien direct
      case referrer === '':
      //Rafrachissement de page
      case referrer.hostname === location.hostname &&
        referrer.pathname === location.pathname:
      //Site Externe
      case referrer.hostname !== location.hostname:
        eventType = 'click';
        break;
      //Autre page du site (Fiche produit)
      case referrer.hostname === location.hostname &&
        referrer.pathname !== location.pathname:
        eventType = 'click';
        break;
    }
    return eventType;
  }
}

if (!window.faq) {
  window.faq = new Faq();
}
