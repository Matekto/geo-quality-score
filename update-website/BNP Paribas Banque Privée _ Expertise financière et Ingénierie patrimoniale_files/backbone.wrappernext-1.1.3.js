!(function (e, t, s, r, n) {
    !(function (e, t) {
        "function" == typeof n &&
            n.amd &&
            n("wrappernext", ["underscore", "exports", "backbone", "moment"], function (s, r, n, i) {
                e.WrapperNext = t(e, r, s, n, i);
            });
    })(this, function (t, s, r, n, i) {
        s.VERSION = "1.1.3";
        var o = (s.Collection = n.Collection.extend({
            keyWordFilter: function (e, t) {
                e = e.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                var s = new RegExp(e, "i"),
                    n = r.filter(this.models, function (e) {
                        for (var r = 0; r < t.length; r++) if (s.test(e.get(t[r]))) return !0;
                        return !1;
                    }),
                    i = this.clone();
                return i.reset(n), i;
            },
            sort: function (e, t) {
                var s = this.sortBy(function (e) {
                    return parseInt(e.cid.substring(1));
                });
                if ((this.reset(s, { silent: !0 }), t !== l.sortDefault)) {
                    var r = this.sortBy(function (s) {
                        var r = null;
                        switch (t) {
                            case l.sortDate:
                            case l.sortDateDec:
                                r = -parseInt(i(s.get(e), "DD/MM/YYYY").format("YYYYMMDD"));
                                break;
                            case l.sortInt:
                            case l.sortIntDec:
                                r = -parseInt(s.get(e));
                                break;
                            case l.sortString:
                            case l.sortStringDec:
                                r = s.get(e);
                        }
                        return r;
                    });
                    (t === l.sortDateDec || t === l.sortIntDec || t === l.sortStringDec) && (r = r.reverse()), this.reset(r, { silent: !0 });
                }
            },
            group: function (e) {
                var t = new Array(),
                    s = this.groupBy(function (t) {
                        for (var s = "", r = 0; r < e.length; r++) s += t.get(e[r]);
                        return s;
                    });
                for (var r in s) {
                    var n = this.clone();
                    n.reset(s[r]), t.push(n);
                }
                return t;
            },
        }));
        s.CollectionAjax = o.extend({
            constructor: function (e, t) {
                var s = this;
                (this.opts = t || {}),
                    (this.arrayCodeErreurTech = []),
                    (this.arrayCodeSessionLost = [-31, "-31", -30, "-30"]),
                    (this.arrayCodeNbMaxConnexion = [-100, "-100"]),
                    (this.businessMessage = null),
                    (this.about = new u()),
                    r.bindAll(this, "parse"),
                    (this.parse = r.wrap(this.parse, function (e, t) {
                        var r = s.preparse(t);
                        if (!s.businessMessage.isSuccess()) return {};
                        var n = e(r);
                        return n;
                    })),
                    n.Collection.prototype.constructor.call(this, e);
            },
            preparse: function (e) {
                var t = {};
                if (
                    ((this.businessMessage = new c(e, { parse: !0 })),
                    this.businessMessage.setArrayCodeErreurTech(this.arrayCodeErreurTech),
                    this.businessMessage.setArrayCodeSessionLost(this.arrayCodeSessionLost),
                    this.businessMessage.setArrayCodeNbMaxConnexion(this.arrayCodeNbMaxConnexion),
                    this.opts.isNoIntermediate)
                )
                    t = e.data;
                else for (var s in e.data) t = e.data[s];
                return t;
            },
            fetchNext: function (t, s) {
                var r = {
                    type: t.type || "GET",
                    contentType: "application/json",
                    success: function (r) {
                        return r.businessMessage.isDeconnecte()
                            ? e.location.replace("/aiguillage-wspl/redirect/identification")
                            : (r.businessMessage.isNbMaxConnexion() && e.location.replace(r.businessMessage.get("urlRedirection")),
                              r.businessMessage.isSuccess()
                                  ? s[t.successCallback] && s[t.successCallback](r)
                                  : r.businessMessage.isErrorTech()
                                  ? s[t.errorTechCallback] && s[t.errorTechCallback](r.businessMessage, r.about)
                                  : s[t.errorFoncCallback] && s[t.errorFoncCallback](r.businessMessage, r.about),
                              void 0);
                    },
                    error: function (e) {
                        s[t.errorTechCallback] && s[t.errorTechCallback](void 0, e.about);
                    },
                };
                "POST" === t.type && (r.data = JSON.stringify(t.data || {})), this.fetch(r);
            },
            setArrayCodeErreurTech: function (e) {
                r.isArray(e) && (this.arrayCodeErreurTech = e);
            },
            setArrayCodeSessionLost: function (e) {
                r.isArray(e) && (this.arrayCodeSessionLost = e);
            },
            setArrayCodeNbMaxConnexion: function (e) {
                r.isArray(e) && (this.arrayCodeNbMaxConnexion = e);
            },
            setOptions: function (e) {
                e || (e = {});
                for (var t in e) this.opts[t] = e[t];
            },
            setAbout: function (e) {
                e || (e = {}), this.about.set(e);
            },
            getAbout: function () {
                return this.about.get(options);
            },
        });
        var a = (s.Model = n.Model.extend({}));
        (s.I18n = n.Model.extend({
            parse: function (e) {
                var t = function (e) {
                    return r(e).inject(function (e, t, s) {
                        var n = e,
                            i = s.split("."),
                            o = i.length - 1;
                        return (
                            r(i).each(function (e, s) {
                                n = n[e] = s == o ? t : n[e] || {};
                            }),
                            e
                        );
                    }, {});
                };
                return t(e);
            },
            fetchI18n: function (e) {
                var t = {
                    type: "GET",
                    contentType: "application/json",
                    success: function (t) {
                        e.callback && e.callback(t);
                    },
                    error: function (t) {
                        (t.attributes = t.parse(t.defaults)), e.callback && e.callback(t);
                    },
                };
                "boolean" != typeof e.isI18nEnabled && (e.isI18nEnabled = !0), e.isI18nEnabled ? this.fetch(t) : t.error(this);
            },
        })),
            (s.ModelZP = n.Model.extend({
                fetchFlat: function (e, t) {
                    var s = {
                        type: "GET",
                        contentType: "application/json",
                        success: function (s) {
                            t[e.successCallback] && t[e.successCallback](s);
                        },
                        error: function (s) {
                            t[e.errorCallback] && t[e.errorCallback](s);
                        },
                    };
                    this.fetch(s);
                },
            }));
        var c = (s.BusinessMessage = n.Model.extend({
                arrayCodeErreurTech: null,
                defaults: { codeRetour: "", message: "", service: "", urlRedirection: "", data: null },
                parse: function (e) {
                    var t = {};
                    return (t.codeRetour = e.codeRetour), (t.message = e.message), (t.service = e.service), (t.urlRedirection = e.urlRedirection), 0 !== e.codeRetour && "0" !== e.codeRetour && (t.data = e.data), t;
                },
                isSuccess: function () {
                    var e = !1;
                    return ("0" === this.get("codeRetour") || 0 === this.get("codeRetour")) && (e = !0), e;
                },
                isErrorTech: function () {
                    return r.isArray(this.arrayCodeErreurTech) ? r.contains(this.arrayCodeErreurTech, this.get("codeRetour")) : !1;
                },
                isDeconnecte: function () {
                    return r.isArray(this.arrayCodeSessionLost) ? r.contains(this.arrayCodeSessionLost, this.get("codeRetour")) : !1;
                },
                isNbMaxConnexion: function () {
                    return r.isArray(this.arrayCodeNbMaxConnexion) ? r.contains(this.arrayCodeNbMaxConnexion, this.get("codeRetour")) : !1;
                },
                setArrayCodeErreurTech: function (e) {
                    r.isArray(e) && (this.arrayCodeErreurTech = e);
                },
                setArrayCodeSessionLost: function (e) {
                    r.isArray(e) && (this.arrayCodeSessionLost = e);
                },
                setArrayCodeNbMaxConnexion: function (e) {
                    r.isArray(e) && (this.arrayCodeNbMaxConnexion = e);
                },
            })),
            u = (s.AboutAjax = n.Model.extend({ defaults: { actionName: "", actionTag: "", stepName: "", steptag: "" } }));
        s.ModelAjax = a.extend({
            constructor: function (e, t) {
                var s = this;
                (this.opts = t || {}),
                    (this.arrayCodeErreurTech = []),
                    (this.arrayCodeSessionLost = [-31, "-31", -30, "-30"]),
                    (this.arrayCodeNbMaxConnexion = [-100, "-100"]),
                    (this.businessMessage = null),
                    (this.about = new u()),
                    r.bindAll(this, "parse"),
                    (this.parse = r.wrap(this.parse, function (e, t) {
                        var r = s.preparse(t);
                        if (!s.businessMessage.isSuccess()) return {};
                        var n = e(r),
                            i = s.postParse(n);
                        return i;
                    })),
                    n.Model.prototype.constructor.call(this, e);
            },
            preparse: function (e) {
                var t = {};
                if (
                    ((this.businessMessage = new c(e, { parse: !0 })),
                    this.businessMessage.setArrayCodeErreurTech(this.arrayCodeErreurTech),
                    this.businessMessage.setArrayCodeSessionLost(this.arrayCodeSessionLost),
                    this.businessMessage.setArrayCodeNbMaxConnexion(this.arrayCodeNbMaxConnexion),
                    this.opts.isNoIntermediate)
                )
                    t = e.data;
                else for (var s in e.data) t = e.data[s];
                return t;
            },
            postParse: function (e) {
                return e;
            },
            fetchNext: function (t, s) {
                var r = {
                    type: t.type || "GET",
                    contentType: "application/json",
                    success: function (r) {
                        return r.businessMessage.isDeconnecte()
                            ? e.location.replace("/aiguillage-wspl/redirect/identification")
                            : (r.businessMessage.isNbMaxConnexion() && e.location.replace(r.businessMessage.get("urlRedirection")),
                              r.businessMessage.isSuccess()
                                  ? s[t.successCallback] && s[t.successCallback](r)
                                  : r.businessMessage.isErrorTech()
                                  ? s[t.errorTechCallback] && s[t.errorTechCallback](r.businessMessage, r.about)
                                  : s[t.errorFoncCallback] && s[t.errorFoncCallback](r.businessMessage, r.about),
                              void 0);
                    },
                    error: function (e) {
                        s[t.errorTechCallback] && s[t.errorTechCallback](void 0, e.about);
                    },
                };
                "POST" === t.type && (r.data = JSON.stringify(t.data || {})), this.fetch(r);
            },
            setArrayCodeErreurTech: function (e) {
                r.isArray(e) && (this.arrayCodeErreurTech = e);
            },
            setArrayCodeSessionLost: function (e) {
                r.isArray(e) && (this.arrayCodeSessionLost = e);
            },
            setArrayCodeNbMaxConnexion: function (e) {
                r.isArray(e) && (this.arrayCodeNbMaxConnexion = e);
            },
            setOptions: function (e) {
                e || (e = {});
                for (var t in e) this.opts[t] = e[t];
            },
            setAbout: function (e) {
                e || (e = {}), this.about.set(e);
            },
            getAbout: function () {
                return this.about.get(options);
            },
        });
        var h = (s.View = n.View.extend({
            constructor: function (e) {
                (this.statesView = new a()), n.View.prototype.constructor.call(this, e);
            },
            remove: function () {
                if ((this.$el.remove(), this.stopListening(), this.views))
                    for (var e in this.views) {
                        var t = this.views[e];
                        t instanceof n.View && t.remove();
                    }
                return this;
            },
            empty: function () {
                if ((this.$el.empty(), this.stopListening(), this.undelegateEvents(), this.views))
                    for (var e in this.views) {
                        var t = this.views[e];
                        t instanceof n.View && t.remove();
                    }
                return this;
            },
            set: function (e, t, s) {
                return this.statesView.set(e, t, s), this;
            },
            get: function (e) {
                return this.statesView.get(e);
            },
        }));
        (s.ItemView = h.extend({})),
            (s.ListView = h.extend({
                constructor: function (e) {
                    (this.itemViewArray = new Array()), (this.$elList = this.$el), s.View.prototype.constructor.call(this, e);
                },
                renderList: function (e) {
                    var t = this.$elList;
                    this.removeOldItemView();
                    for (var s = 0; s < e.length; s++) {
                        var r = this.renderItem(e.models[s], s);
                        null !== r && (this.itemViewArray.push(r), t.append(r.$el));
                    }
                    this.postRender();
                },
                renderItem: function () {},
                postRender: function () {},
                removeOldItemView: function () {
                    for (var e = 0; e < this.itemViewArray.length; e++) this.stopListening(this.itemViewArray[e]), this.itemViewArray[e].remove();
                    this.itemViewArray = new Array();
                },
                remove: function () {
                    h.prototype.remove.call(this), this.removeOldItemView();
                },
                empty: function () {
                    h.prototype.empty.call(this), this.removeOldItemView();
                },
            })),
            (s.Dispatcher = n.View.extend({
                constructor: function (e) {
                    (this.statesDispatcher = new a()), (this.models = {}), (this.collections = {}), (this.views = {}), n.View.prototype.constructor.call(this, e);
                },
                set: function (e, t, s) {
                    return this.statesDispatcher.set(e, t, s), this;
                },
                get: function (e) {
                    return this.statesDispatcher.get(e);
                },
            })),
            (s.UrlRedirection = function (t, s) {
                var t = t,
                    s = s || {};
                (this.redirect = function (r, n, i) {
                    n || (n = {}), i || (i = {});
                    var o = t + r + "?";
                    for (var a in n) o += a + "=" + n[a] + "&";
                    for (var a in s) o += a + "=" + s[a] + "&";
                    var c = o[o.length - 1];
                    ("?" === c || "&" === c) && (o = o.substring(0, o.length - 1)), i.ancre && (o += "#" + i.ancre), i.isEditerRib && (o = o.replace("iban=", "contractId=")), i.newTab ? e.open(o) : (e.location = o);
                }),
                    (this.setParams = function (e) {
                        e || (e = {});
                        for (var t in e) s[t] = e[t];
                    });
            }),
            (s.queryString = function () {
                var t = {},
                    s = e.location.search.substring(1);
                if ("" === s) return t;
                for (var r = s.split("&"), n = 0; n < r.length; n++) {
                    var i = r[n].split("=");
                    t[i[0]] = i[1];
                }
                return t;
            });
        var l = (s.constantes = { sortDefault: 0, sortDate: 1, sortInt: 2, sortString: 3, sortDateDec: 4, sortIntDec: 5, sortStringDec: 6 });
        return s;
    });
})(window, document, bnpp.sf31.requirejs, bnpp.sf31.requirejs, bnpp.sf31.define, bnpp.jquery, bnpp.jquery, bnpp.jquery);
//# sourceMappingURL=backbone.wrappernext-1.1.3.js.map
