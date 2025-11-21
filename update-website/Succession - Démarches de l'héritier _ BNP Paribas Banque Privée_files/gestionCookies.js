function initGestionCookies(item, Obj, callback)
{
    if (callback) callback();
    return;
}


function initGestionCookiesLanding(item, Obj) {
    initGestionCookies(item, Obj, function() {
        if (bnpp && bnpp.gestioncookies) {
            var currentPrivacy = bnpp.gestioncookies.getQueryParameter();
            var $iframeLoaded = $('#formulaire iframe');
            var originalSrc = $iframeLoaded.attr('src');
            var src = '';
            var addPrivacy = function() {
                currentPrivacy = bnpp.gestioncookies.getQueryParameter();
                if (originalSrc) {
                    var querySeparator = originalSrc.indexOf('?') != -1 ? '&' : '?';
                    src = originalSrc + querySeparator + currentPrivacy;
                    $iframeLoaded.attr('src', src);
                }
            };
            addPrivacy()
    
            setInterval(function() {
                if (currentPrivacy != bnpp.gestioncookies.getQueryParameter()) {
                    addPrivacy();
                }
            }, 500);
        }
    });
}