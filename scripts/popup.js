(function() {
    'use strict';
    $(document).ready(e => {
        function moreInfo() {
            console.log('more info')
            GStorage.get('me').then(d => {
                var logged
                if (!d.me) {
                    GStorage.destroySession(), logged = false
                } else {
                    $('.name > div').text(d.me.displayName), $('.name span').text(d.me.emailAddress), logged = true
                }
                $('.google').toggle(!logged)
                // $('.google button').click(function() {
                //     console.log('btn auth')
                //     GoogleApi.authorize()
                //     moreInfo()
                // })
                $('.mass-actions, .account').toggle(logged)
            })
        }
        // Get the version
        $.get('manifest.json', d => $('.version').text(d.version))
        // Check settings
        /*GStorage.set('oauth2_google', JSON.stringify({ client_id: '1038771980411-j8la00erlvv8q0vfnklaufef1kbngqk9.apps.googleusercontent.com',
        client_secret: '48b9C_GF7Gp-SBQICHaHcFGk',
        api_scope: 'email profile https://www.googleapis.com/auth/gmail.modify'
        }))*/
        const start = () => {
        GStorage.get(['me', 'oauth2_token', 'mass_actions']).then(d => {
            // Check token
            if(!d.oauth2_token) {
                $("#logout").hide();
            }

            if(d.oauth2_token) {
                $('#logout').click(async function() {
                    console.log('clicked!');
                    await GStorage.destroySession();
                    try {
                        chrome.runtime.sendMessage({ type: 'closeGtab'});
                    } catch {
                        
                    }
                    GoogleApi.deAuthorize();
                    //GoogleApi.clearAccessToken();
                    start();
                    moreInfo();
                });    
            }
            //console.log('d.oauth2_token', d.oauth2_token)
            console.log(d);
            //console.log(GoogleApi.authorize())
            if(!d.oauth2_token) {
                //console.log(GoogleApi.authorize());
                GStorage.destroySession();
                GoogleApi.deAuthorize();
                $('.google').show();
            }

            if(d.oauth2_token) {
                moreInfo();
            }
            // Extension settings
            if (!d.me) return
            const pid = d.me.metadata.source.id
            d.mass_actions && d.mass_actions[pid] && Object.keys(d.mass_actions[pid]).forEach(k => $('input[name=' + k + ']').prop('checked', d.mass_actions[pid][k]))
        })
        }

        start();
        // Action changes
        $('body').on('change', '.actions', e => {
                console.log('on Changing!');
                var act = {
                    mass_actions: {}
                }
                // Update settings
                GStorage.get(['me', 'mass_actions']).then(d => {
                    d.mass_actions = d.mass_actions || {}
                    const pid = d.me.metadata.source.id
                    d.mass_actions[pid] = d.mass_actions[pid] || {}
                    d.mass_actions[pid][$(e.target).attr('name')] = $(e.target).prop('checked');
                    console.log(d);
                    GStorage.set(d)
                })
            })
            // Google button
            // .on('click', '.google button', b => GoogleApi.authorize())
            // Sign off
            // .on('click', '.sign-off', async (b) => {
            //     await GStorage.remove('oauth2_token')
            //     await GStorage.remove('me')
            //     chrome.runtime.sendMessage({
            //         type: 'closeGtab'
            //     })
            //     GoogleApi.clearAccessToken()
            //     moreInfo()
            // })
            // Gmail Webmail
            .on('click', '.gmail-icon, .name > div, .name > span', b => GoogleApi.gotoMail());

            $('.google button').click(function() {
                //console.log('btn auth')
                console.log("google API:" + GoogleApi.authorize());
                //GStorage.setToken()
                GStorage.get(['me', 'oauth2_token', 'mass_actions']).then(d => {
            // Check token
                    console.log('d.oauth2_token', d.oauth2_token)
                    !d.oauth2_token && $('.google').show(), d.oauth2_token && moreInfo()
                    // Extension settings
                    if (!d.me) return
                    const pid = d.me.metadata.source.id
                    d.mass_actions && d.mass_actions[pid] && Object.keys(d.mass_actions[pid]).forEach(k => $('input[name=' + k + ']').prop('checked', d.mass_actions[pid][k]))
                })
                moreInfo()
            })
    })
})(window, jQuery);