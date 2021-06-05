(function() {
    'use strict';
    // 
    class _GoogleApi {
        constructor() {
            // Use gmail version
            let VERSION = 'v1'
            // API endpoints
            this.IDENTITY_URL = 'https://people.googleapis.com/' + VERSION + '/'
            this.GMAIL_URL = 'https://www.googleapis.com/gmail/' + VERSION + '/'
            this.GMAIL_UPLOAD_URL = 'https://www.googleapis.com/upload/gmail/' + VERSION + '/'
            this.API_KEY = 'AIzaSyDF0owGUwh0D_5CWXw300m1tAFI1eXc5As'
            this.opsLen = null;
            this.opsLenCur = 0;
        }
        // Authenticate user with Google (Popup)
        authorize() {
            var googleAuth = this.oauth2Instance()
            return googleAuth.authorize()
        }

        deAuthorize() {
            if (localStorage.hasOwnProperty('oauth2_google')) {
                delete localStorage['oauth2_google'];
            }
        }

        oauth2Instance() {
            let oauth = new OAuth2('google', {
                client_id: '1038771980411-j8la00erlvv8q0vfnklaufef1kbngqk9.apps.googleusercontent.com',
                client_secret: '48b9C_GF7Gp-SBQICHaHcFGk',
                api_scope: 'email profile https://www.googleapis.com/auth/gmail.modify'
            });

            return oauth;
        }
        _set(key, value) {
            return new Promise((resolve, reject) => {
                GStorage.set(key, value, resolve)
            })
        }
        // Build endpoint with Params
        _build(endpoint, params) {
            params = params || {}
            params.key = this.API_KEY
            let parms = []
            for (var p in params) {
                parms.push(p + '=' + params[p])
            }
            return endpoint + '?' + parms.join('&')
        }
        // Identity endpoint with Params
        _identity(endpoint, params) {
            return this._build(this.IDENTITY_URL + endpoint, params)
        }
        // Gmail endpoint with Params
        _gmail(endpoint, params) {
            return this._build(this.GMAIL_URL + endpoint, params)
        }
        _gmailUpload(endpoint, params) {
            return this._build(this.GMAIL_UPLOAD_URL + endpoint, params)
        }
        // Fetch
        async fetch(url, method, data, tab = null) {
            // Prep headers
            let token = await GStorage.getToken(),
                headers = {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            // 
            console.log(data);
            const response = await fetch(url, {
                method: method || 'GET', // *GET, POST, PUT, DELETE, etc.
                async: true,
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                headers: headers,
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *client
                body: JSON.stringify(data), // body data type must match "Content-Type" header
                contentType: 'json'
            }); // return await response.json(); // parses JSON response into native JavaScript objects
            return new Promise(async (resolve, reject) => {
                let text = await response.text(),
                    status = response.status;
                    console.log('just fetch!');
                    console.log(url);
                    console.log(data);
                    console.log(response);
                    console.log(text);
                    if(tab != null) {
                        chrome.tabs.sendMessage(tab, {
                            type: 'send_alert',
                            status: response.status
                        });
                    }
                if (status >= 200 && status < 300) {
                    let r = true;
                    if (text.trim().length) r = JSON.parse(text), resolve(r)
                } else if (status == 401) {
                    this.authorize();
                    //this.fetch(url, method, data, tab != null ? tab : null);
                } else {
                    //reject(new Error(response.status))
                    this.authorize();
                    this.fetch(url, method, data, tab != null ? tab : null);
                    //this.fetch(url, method, data, tab != null ? tab : null);
                }
            })
        }

        async fetchMultipart(url, method, data, tab = null, hdr = null) {
            // Prep headers
            let token = await GStorage.getToken(),
                headers = {
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
                }
            // 
            const response = await fetch(url, {
                method: method || 'GET', // *GET, POST, PUT, DELETE, etc.
                async: true,
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                headers: headers,
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *client
                body: data, // body data type must match "Content-Type" header
                contentType: 'multipart/related; boundary="foo_bar_baz"'
            }); // return await response.json(); // parses JSON response into native JavaScript objects
            return new Promise(async (resolve, reject) => {
                let text = await response.text(),
                    status = response.status;
                if (status >= 200 && status < 300) {
                    if(this.opsLenCur < this.opsLen) {
                        this.opsLenCur++;
                    }
                    let r = true;
                    if (text.trim().length) r = JSON.parse(text), resolve(r)
                } else if (status == 401) {
                    this.authorize();
                    //this.fetch(url, method, data, tab != null ? tab : null);
                } else {
                    this.authorize();
                    setTimeout(() => {
                    this.fetchMultipart(url, method, data, tab != null ? tab : null);
                    }, 50);
                    //reject(new Error(response.statusText))
                }
                if(tab != null) {
                    if(this.opsLenCur == this.opsLen) {
                        /*chrome.tabs.sendMessage(tab, {
                            type: 'send_alert',
                            status: response.status,
							to: hdr.To,
							subject: hdr.Subject
                        });*/
						
						//kami return it here
						return {
                            type: 'send_alert',
                            status: response.status,
							to: hdr.To,
							subject: hdr.Subject
                        };
                    }
                }
            })
        }


        // User profile
        me() {
            return new Promise((resolve, reject) => {
                this.fetch(this._identity('people/me', {
                    personFields: 'names,emailAddresses'
                })).then(async (r) => {
                    var me = r.names[0]
                    me.emailAddress = r.emailAddresses[0].value
                    await this._set('me', me)
                    resolve()
                }).catch(e => {
                    reject(e)
                })
            })
        }
        // Mark as read message
        markRead(ids) {
            return this.markAll({
                ids: ids,
                removeLabelIds: ["UNREAD"]
            })
        }
        // Send to archive
        markArchived(ids) {
            return this.markAll({
                ids: ids,
                removeLabelIds: ["INBOX"]
            })
        }
        // Perform api call
        markAll(opts, tab = null) {
            console.log(opts, tab);
            return this.gapiFetch('users/me/messages/batchModify', 'POST', opts, tab);
            //return this.fetch(this._gmail('users/me/messages/batchModify'), 'POST', opts, tab);
        }

        async gapiFetch(url, method, data, tab) {
            let token = await GStorage.getToken(),
            headers = {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }

            let ids = [];

            const l_fetch = async(Identitys) => {
                console.log('mark/archieve sets');
                console.log(Identitys);
                data.ids = Identitys;
                let url_d = "https://www.googleapis.com/gmail/v1/" + url + "?key=" + this.API_KEY;
                const response = await fetch(url_d, {
                        method: 'POST', // *GET, POST, PUT, DELETE, etc.
                        async: true,
                        mode: 'cors', // no-cors, *cors, same-origin
                        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                        headers: headers,
                        redirect: 'follow', // manual, *follow, error
                        referrerPolicy: 'no-referrer', // no-referrer, *client
                        body: JSON.stringify(data), // body data type must match "Content-Type" header
                        contentType: 'json'
                });
                let r =await response.text();
                if(response.status >= 400) {
                    l_fetch(Identitys);
                } else {
                    ids = [];
                }
            }

            const getThreadsData = async(url_t) => {
                const response = await fetch(url_t, {
                    method: 'GET', // *GET, POST, PUT, DELETE, etc.
                    async: true,
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    headers: headers,
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer'
                });
                if(response.status >= 200 && response.status < 300) {
                    let r =await response.text();
                    let arr = JSON.parse(r).messages;
                    arr.map(async(k) => {
                        ids.push(k.id);
                    });
                    l_fetch(ids);
                }
                if(response.status >= 400) {
                    getThreadsData(url_t);
                }
            }

            data.ids.map(async(item, index) => {
                let url_t = "https://www.googleapis.com/gmail/v1/users/me/threads/" + item + "?key=" + this.API_KEY;
                getThreadsData(url_t);
            });



            /*let url_t = "https://www.googleapis.com/gmail/v1/" + url + "?key=" + this.API_KEY;
                    const response = await fetch(url_t, {
                        method: 'POST', // *GET, POST, PUT, DELETE, etc.
                        async: true,
                        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                        headers: headers,
                        data: JSON.stringify(data),
                        redirect: 'follow', // manual, *follow, error
                        referrerPolicy: 'no-referrer'
            });*/
        }

        // Perform api call
        getThread() {
            return this.fetch(this._gmail('users/me/threads/1714a12baef100e9?metadataHeaders=To'), 'GET')
        }

        replyOld(opts) {
            let email = "Content-Type: text/plain; charset=\"UTF-8\"\n" +
                      "MIME-Version: 1.0\n" +
                      "Content-Transfer-Encoding: 7bit\n" +
                      "Subject: test10\n" +
                      "From: andrewserbin01@gmail.com\n" +
                      "To: andrewserbin01@gmail.com\n\n" +
                      "test"


                let base64EncodedEmail = Base64.encode(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                let fetchRes = this.fetch(this._gmail('users/me/messages/send'), 'POST', {
                    raw: base64EncodedEmail,
                    threadId: "17146b92ab6fa776"
                });
        }

        // Perform api call
        reply(opts, tab = null) {
            this.opsLen = opts.recs.length;
			
			toastr.options = {
			  "closeButton": true,
			  "debug": true,
			  "newestOnTop": false,
			  "progressBar": false,
			  "positionClass": "toast-bottom-left",
			  "preventDuplicates": false,
			  "onclick": null,
			  "showDuration": "300",
			  "hideDuration": "10000",
			  "timeOut": "0",
			  "extendedTimeOut": "0",
			  "showEasing": "swing",
			  "hideEasing": "linear",
			  "showMethod": "fadeIn",
			  "hideMethod": "fadeOut",
			  "tapToDismiss": false
			}
			
			var toastr_success = 'Successfully replied<br /><br />';
			var toastr_error = 'Error replying<br /><br />';
			
			var show_success = 0;
			var show_error = 0;
			
            for (let rec in opts.recs) {
                rec = opts.recs[rec];

                let body = createBody({
                  headers: {
                    To: rec.to,
                    From: opts.sender,
                    Subject: rec.subject
                  },
                  textHtml: opts.body,
                  threadId: rec.threadId,
                  attachments: opts.files
                });
                res = this.fetchMultipart(this._gmailUpload('users/me/messages/send'), 'POST', body, tab,{
                    To: rec.to,
                    From: opts.sender,
                    Subject: rec.subject
                  });
				  
				if(request.status >= 200 && request.status <= 300) {
					show_success = 1;
					toastr_success +='<div>To: '+request.to+'<br />Subject:'+request.subject+'</div>';
				}
				else
				{
					show_error = 1;
					toastr_error +='<div>To: '+request.to+'<br />Subject:'+request.subject+'</div>';
				}
            }
			
			if(show_success)
			{
				toastr.success(toastr_success);
			}
			if(show_error)
			{
				toastr.error(toastr_error);
			}

			
        }


        // gotoMail
        async gotoMail() {
            let email = await GStorage.getEmail()
            chrome.runtime.sendMessage({
                type: 'openTab',
                email: email
            })
        }
    }
    // New instance
    window.GoogleApi = window.GoogleApi || new _GoogleApi
})(window)