(function() {
    'use strict';
    // 
    class _GStorage {
        constructor() {
            this.storage = window.chrome.storage.local;
            // this.storage = window.localStorage;
        }
        async setToken(token) {
            console.log("--------------------------------" + token);
            return new Promise(async (resolve, reject) => {
                await this.set('oauth2_token', token, resolve)
            })
        }
        async getToken() {
            var d = await this.get('oauth2_token')
            return d.oauth2_token
        }
        async getEmail() {
            var d = await this.get('me')
            return d.me.emailAddress
        }
        async getGmailTab() {
            var d = await this.get('gmail_tab')
            return d.gmail_tab
        }
        async destroySession() {
            await this.remove('oauth2_google')
            await this.remove('me')
            await this.remove('oauth2_token')
            //return this.remove('me')
        }
        get(key) {
            return new Promise((resolve, reject) => {
                this.storage.get(key, function(data) {
                    resolve(data || undefined);
                });
            })
        }
        set(key, value, callback) {
            if (typeof key == 'string') {
                var key1 = {}
                key1[key] = value
                key = key1
            } else if (typeof key == 'object') callback = value;
            this.storage.set(key, callback);
        }
        remove(key) {
            return new Promise((resolve, reject) => {
                this.storage.remove(key, function() {
                    resolve(true);
                });
            })
        }
        clear() {
            return new Promise((resolve, reject) => {
                this.storage.clear(function() {
                    resolve(true);
                });
            });
        }
    }
    window.GStorage = window.GStorage || new _GStorage;
})(window)