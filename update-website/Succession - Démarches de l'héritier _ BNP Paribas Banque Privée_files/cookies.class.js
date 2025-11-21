(function($){
    var cookie = {
        write : function (cname, cvalue, exdays) { 
            var d = new Date(); 
            d.setTime(d.getTime() + (exdays*24*60*60*1000)); 
            var expires = "expires="+d.toUTCString(); 
            document.cookie = cname + "=" + cvalue + ";domain="+document.location.hostname.split('.').slice(-2).join('.')+";path=/; " + expires; 
        }, 
        read : function (name) { 
            var tab=document.cookie.split(";");
            regex=RegExp("^\\s*"+name+"=\\s*(.*?)\\s*$");
            for(var i=0;i<tab.length;i++){
                var tmp=tab[i].match(regex);
                if(tmp)
                    return tmp[1];
            }
            return "";
        }, 
        delete : function (cname) { 
            var d = new Date(); 
            d.setTime(d.getTime() - 1000); 
            var expires = "expires="+d.toUTCString(); 
            document.cookie = cname + "=; " + expires;
        },
        readParameter : function(name, key) {
            var paramsString = this.read(name)
            var objURL = {};
        
            paramsString.replace(
                new RegExp( "([^?|#=&]+)(=([^&]*))?", "g" ),
                function( $0, $1, $2, $3 ){
                    objURL[ $1 ] = $3?$3:null;
                }
            );
            return decodeURIComponent(objURL[key]);
        }
    }
    function replaceAt(string, index, replace) {
        return string.substring(0, index) + replace + string.substring(index + 1);
    }

    function GESTIONCOOKIES() {
        if (!window.bnpp)
            window.bnpp = {};
        window.bnpp.gestioncookies = this;
        if (!cookie.read("OptanonAlertBoxClosed"))
        {
            this._value = "1----";
            this.addOptanonScript();
        }
        else
            this.reloadCookie(); 
        this.addButtonParametreCookies();
        document.addEventListener('readystatechange', function(event){
            if (document.readyState === "complete")
                window.bnpp.gestioncookies.addEventOnParametreCookies();
        });
        if (document.readyState === "complete")
            window.bnpp.gestioncookies.addEventOnParametreCookies();
        setTimeout(function(){window.bnpp.gestioncookies.addEventOnParametreCookies()}, 10000);
        
        if (!this._value || this._value.length != 5)
            this._value = "1----";
        this.cookieNavDisable();
    }
    GESTIONCOOKIES.prototype.inIframe = function () {
        try {
            if (/mestitres/.test(document.location.hostname))
                return false;
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }
    GESTIONCOOKIES.prototype.addButtonParametreCookies = function(){
        if ($ == null)
            return;
        var $footer;
        var env = this.env();
        if (env == "hb")
            $footer = $("footer.main-footer ul.liens-post-main-footer:first, footer.footer-gestion ul.footer-list-links:first");
        else if (env == "hbpro")
            $footer = $("#footer-connected ul.footer-list-links");
        else if (env == "hbpro-acqui")
            $footer = $("#footer>div>ul");
        else if (env == "bpf")
            $footer = $("ul.footer-section_liens:eq(1), .cpm-main-footer_list-links:eq(1), #main-footer .footer-desktop ul:eq(1)");
        else
            $footer = $("ul.footer-section_liens:first, .cpm-main-footer_list-links:first, #main-footer .footer-desktop ul:first");
        if ($footer.find(".cookiesparameters").length == 0)
        {
            var $li = $('<li class="cookiesparameters"><a href="#">Paramètres des cookies</a><button id="ot-sdk-btn" class="ot-sdk-show-settings hidden" style="display:none">Parametres</button></li>');
            if (env == "hbpro"){
                $li.find("a").addClass("link-underline-off text-blue-grey underline-hover");
            }
            else if (env == "hbpro-acqui"){
                $footer.find("li:last").append("-");
                $li.find("a").addClass("link-underline-off text-blue-grey underline-hover");
            }
            else if (env != "hb")
            {
                $li.addClass("cpm-main-footer_link");
                $li.addClass("footer-section_liens-el");
            }
            $footer.append($li);
        }
    }
    GESTIONCOOKIES.prototype.addEventOnParametreCookies = function(){
        if ($ == null)
            return;
        if ($(".cookiesparameters").length == 0)
            this.addButtonParametreCookies();
        var findEvent = false;
        try{
            $._data($(document)[0], "events").click.forEach(function(obj){findEvent |= obj.selector == ".cookiesparameters>a, .cookiesdisplaypartenaires, .cookiesdisplayparameters"});
        }
        catch(e){console.log(e);}
        !findEvent && console.log("AddEnvent");
        !findEvent && $(document).on('click', ".cookiesparameters>a, .cookiesdisplaypartenaires, .cookiesdisplayparameters", function () {
            window.bnpp.gestioncookies.ClickButtonParametre($(this).hasClass("cookiesdisplaypartenaires")?true:false);
        });
    }    
    GESTIONCOOKIES.prototype.addOptanonScript = function(force, actionOnLoad){
        if (this.inIframe())
            return;
        if (/rc\=nopopin/.test(document.location.search) || sessionStorage.getItem('nopopin'))
            return;
        if (/rc\=webview/.test(document.location.search) || /rc\=mobile/.test(document.location.search) || /redir\=webview/.test(document.location.search) || /mode\=webview/.test(document.location.search))
            return;
        if (/\/fr\/secure\/webview/.test(document.location.pathname))
            return;
        if(force!==true && /\/cookie\/{0,1}$|\/cookies\/{0,1}$/.test(document.location.pathname))
            return;
        function addScript(src, mod, dataDomain, onload) { if (mod) { var d = new Date(); var t = d - (d % mod); src+="?"+t; } var s = document.createElement( 'script' ); s.setAttribute( 'src', src ); onload?s.setAttribute( 'onload', onload ):null; dataDomain?s.setAttribute( 'data-domain-script', dataDomain ):null; document.head.appendChild( s ); }

        var key= "eca11097-be94-4209-912e-825b1c49288d";
        switch (this.env()){
            case "hbpro-acqui":
                key = "49020aa9-2eeb-4b1f-bffa-3027f1f9316b";
                break;
            case "hbpro":
            case "hb":
                key = "ce470486-5e51-497d-b210-210ba2f5959f";
                break;
            case "pro":
                key = "2b829c5e-fc02-4dd1-8a6c-e8880eb39859";
                break;
            case "bpf":
                key = "ae37c500-c7a3-4396-a95a-b90e44d7a031";
                break;
        }
        var host = "";
        try{
            var script = document.querySelector("script[src*='/cookies.class.js']");
            var currentPath = script ? script.src : ""; 
            if (currentPath)
                host = (new URL(currentPath)).host;
            if (host)
                host = "https://" + host;
        }catch(e){}
        var path = host + "/rsc/contrib/script/cookielaw/consent/";
        if (localStorage.consentOptanon || localStorage.consentOptanonTest)
            path = "https://cdn.cookielaw.org/consent/";
        if (localStorage.consentOptanonTest)
            key += "-test";
        if (document.querySelectorAll("script[src*='"+key+"/otSDKStub.js']").length == 0)
        {
            var optanonNotLoading = false;
            window.OptanonWrapper = function(){
                window.bnpp.gestioncookies.reloadCookie();
                window.bnpp.gestioncookies.save(optanonNotLoading);
                optanonNotLoading = true;
            }
            addScript(path + key + "/otSDKStub.js", 24*60*60*1000, key, actionOnLoad);
        }
        else
            eval(actionOnLoad);
    }
    GESTIONCOOKIES.prototype.ClickButtonParametre = function(displayPartenaire)
    {
        if ($ == null)
            return;
        window.bnpp.gestioncookies.ClickButtonParametre = function(displayPartenaire){
            var tmp = setInterval(function(){
                if (Optanon.ToggleInfoDisplay)
                {
                    clearInterval(tmp);
                    window.bnpp.gestioncookies.ClickButtonParametre = function(displayPartenaire){
                        Optanon.ToggleInfoDisplay();
                        if (displayPartenaire)
                            setTimeout(function(){$("#onetrust-pc-sdk .ot-gv-list-handler").click();}, 500);
                    }
                    setTimeout(function(){window.bnpp.gestioncookies.ClickButtonParametre(displayPartenaire);}, 500);
                }
            }, 500)
        }
        this.addOptanonScript(true, "window.bnpp.gestioncookies.ClickButtonParametre("+(displayPartenaire?"true":"")+")");
    }
    GESTIONCOOKIES.prototype.reloadCookie = function() {
        var tmp = cookie.readParameter("OptanonConsent", "groups");
        if (tmp == "undefined")
            return;
        var obj = {};
        tmp.replace(
            new RegExp( "([^?|#:,]+)(:([^,]*))?", "g" ),
            function( $0, $1, $2, $3 ){
                obj[ $1 ] = $3?$3:null;
            }
        );
        this._value = (obj.C0001 || "1") + (obj.C0003 || "0") + (obj.C0002 || "0") + (obj.C0004 || "0") + (obj.C0005 || "0");
        this.celebrus();
    }
    GESTIONCOOKIES.prototype.cookieNavDisable = function() {
        /hellobank.fr/.test(document.location.hostname) ? cookie.write("cookiepopinok", "01") : cookie.write("cookieNav", "0");
    }
    GESTIONCOOKIES.prototype.celebrus = function(value) {
        if (value === undefined){
            cookie.write("BDDFCSAP3P", this.publicite() === true ? "optedIn" : "optedOut", this._exdays);
            cookie.write("BDDFCSAP3P2", (this.publicite() === true ? "optedIn" : "optedOut") + "|" + (this.audience() === true ? "optedIn" : "optedOut"), this._exdays);
        }
        else
        {
            var tmp = cookie.read("BDDFCSAP3P");
            if (!tmp)
                cookie.write("BDDFCSAP3P", value ? "optedIn" : "optedOut", this._exdays);
            var tmp = cookie.read("BDDFCSAP3P2");
            if (!tmp)
                cookie.write("BDDFCSAP3P2", value ? "optedIn|optedIn" : "optedOut|optedOut", this._exdays);
        }
    }
    GESTIONCOOKIES.prototype.save = function(optanonNotLoading) {
        this.celebrus();
        /*if (window.launchSatelliteLoader)
            launchSatelliteLoader();*/
        if (optanonNotLoading)
            setTimeout(function(){
                try
                {
                    if (window.ENVIRONNEMENT && ENVIRONNEMENT == "LOCAL" && !cookie.read("OptanonAlertBoxClosed"))
                        cookie.write("OptanonAlertBoxClosed", new Date(), 180);
                }
                catch(e){}
                location.reload();
            }, 500);
    }
    GESTIONCOOKIES.prototype.technique = function(value, callback) {
        var index=0;
        return this._value[index]=="1"?true:(this._value[index]=="0"?false:undefined);
    }
    GESTIONCOOKIES.prototype.fonctionalite = function(value) {
        var index=1;
        if (value === undefined)
            return this._value[index]=="1"?true:(this._value[index]=="0"?false:undefined);
        else
            this._value = replaceAt(this._value, index, (value === "1" ? "1" : "0"));
    }
    GESTIONCOOKIES.prototype.audience = function(value) {
        var index=2;
        if (value === undefined)
            return this._value[index]=="1"?true:(this._value[index]=="0"?false:undefined);
        else
            this._value = replaceAt(this._value, index, (value === "1" ? "1" : "0"));
    }
    GESTIONCOOKIES.prototype.publicite = function(value) {
        var index = 3;
        if (value === undefined)
            return this._value[index]=="1"?true:(this._value[index]=="0"?false:undefined);
        else
            this._value = replaceAt(this._value, index, (value === "1" ? "1" : "0"));
    }
    GESTIONCOOKIES.prototype.reseauxSociaux = function(value) {
        var index=4;
        if (value === undefined)
            return this._value[index]=="1"?true:(this._value[index]=="0"?false:undefined);
        else
            this._value = replaceAt(this._value, index, (value === "1" ? "1" : "0"));
    }
    GESTIONCOOKIES.prototype.categorie = function(value) {
        return (value == "C0001" && this.technique()) 
            || (value == "C0003" && this.fonctionalite()) 
            || (value == "C0002" && this.audience()) 
            || (value == "C0004" && this.publicite())
            || (value == "C0005" && this.reseauxSociaux())
    }
    GESTIONCOOKIES.prototype.consentie = function(cookie, site){
        // https://cdn.cookielaw.org/consent/eca11097-be94-4209-912e-825b1c49288d-test/45141774-0235-457b-9ee1-f7fd4d13847b/fr.json
        /*
            data.DomainData.Groups
            FirstPartyCookies
            Hosts
        */
        var groups = Optanon.GetDomainData().Groups;
        if (cookie)
        {
            for (var cptI = 0 ; cptI < groups.length ; cptI++ ){
                for (var cptJ = 0 ; cptJ < groups[cptI].Cookies.length ; cptJ++)
                {
                    if (groups[cptI].Cookies[cptJ].Name == cookie)
                        return this.categorie(groups[cptI].OptanonGroupId);
                }
            }
        }
        if (site)
        {
            for (var cptI = 0 ; cptI < groups.length ; cptI++ ){
                for (var cptJ = 0 ; cptJ < groups[cptI].Hosts.length ; cptJ++)
                {
                    if (groups[cptI].Hosts[cptJ].HostName == site)
                        return this.categorie(groups[cptI].OptanonGroupId);
                }
            }
        }
        return false;
    }

    GESTIONCOOKIES.prototype.env = function(){
        if (/hellobank-pro-qual1-acqui|hellobankpro/.test(document.location.hostname))
            return "hbpro-acqui";
        if (/hellobank-pro-|pro\.hellobank/.test(document.location.hostname))
            return "hbpro";
        if (/canalnet-pro|mabanquepro|pro\.|ct-mestitres-pro/.test(document.location.hostname))
            return "pro";
        if (/canalnet-bpf|mabanqueprivee|privee\.|ct-mestitres-bpf/.test(document.location.hostname))
            return "bpf";
        if (/hellobank/.test(document.location.hostname))
            return "hb";
        return "part"; 
    }

    GESTIONCOOKIES.prototype.valid = function() {
        return /(0|1){5}/.test(this._value);
    }
    GESTIONCOOKIES.prototype.overrideOptanonData = function(data){
        try{
            var env = this.env();
            if (env == "pro")
            {
                data.DomainData.AboutLink = "/fr/banque-contacts-pro/engagement-chartes-et-conventions/cookie";
                var tmp = JSON.stringify(data.CommonData);
                tmp = tmp.replace(/#008859/g, "#00B38B"),
                data.CommonData = JSON.parse(tmp);
            }
            else if (env == "bpf")
            {
                data.DomainData.AboutLink = "/fr/informations/cookies";
                var tmp = JSON.stringify(data.CommonData);
                tmp = tmp.replace(/#28c3a9/g, "#8B7341");
                tmp = tmp.replace(/#1e9481/g, "#8B7341");
                tmp = tmp.replace(/#008859/g, "#00816D"),
                data.CommonData = JSON.parse(tmp);
            }
            else if (env == "hbpro")
            {
                data.DomainData.AboutLink = "/fr/client/cookies";
            }
            else if (env == "hbpro-acqui")
            {
                data.DomainData.AboutLink = "/fr/cookies";
            }
        }
        catch(e){}
    }
    GESTIONCOOKIES.prototype.getQueryParameter = function() {
        var qp = 'privacy=';
        qp+= this.technique() ? "1" : "0";
        qp+= this.fonctionalite() ? "1" : "0";
        qp+= this.audience() ? "1" : "0";
        qp+= this.publicite() ? "1" : "0";
        qp+= this.reseauxSociaux() ? "1" : "0";
        return qp;
    }
    new GESTIONCOOKIES();
})((window.bnpp && bnpp.$)?bnpp.$:window.$);
