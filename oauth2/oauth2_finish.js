var url = decodeURIComponent(window.location.href.match(/&from=([^&]+)/)[1]);
var index = url.indexOf('?');
if (index > -1) {
    url = url.substring(0, index);
}
var adapterName = OAuth2.lookupAdapterName(url);
new OAuth2(adapterName, OAuth2.FINISH, async (d) => {
    await GStorage.setToken(d.accessToken)
    await GoogleApi.me()
    setTimeout(() => chrome.runtime.sendMessage({
        type: 'useTab'
    }), 300)
});