'use strict';

console.log('loaded!!!');

// Toastr settins
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
        "timeOut": "5000",
        "extendedTimeOut": "5000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
        "tapToDismiss": false
    }
    // Gmail Reply class
class _GMassReply {
    constructor() {

        this.load();

        this.recipients = []
    }

    // Load InboxSDK
    async load() {
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.replace(/^data:.+;base64,/, ''));
            reader.onerror = error => reject(error);
        });

        const getBase64 = function(file) {
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function() {
                var b64 = reader.result.replace(/^data:.+;base64,/, '');
                return b64;
            };
            reader.onerror = function(error) {
                console.log('Error: ', error);
            };
            return reader;
        }

        const markRead2 = this.markRead;
        var sdk = await InboxSDK.load(1, 'sdk_MultiReply_da0b86b9c7')

        var isBtnAdded = false;
        var destroyFunc;
        setInterval(() => {
            if (!isBtnAdded && document.querySelectorAll('div[aria-checked="true"]').length > 1) {
                destroyFunc = sdk.Toolbars.registerToolbarButtonForList({
                    title: 'Mass Reply',
                    section: sdk.Toolbars.SectionNames.INBOX_STATE,
                    iconUrl: chrome.extension.getURL('reply.png'),
                    css: "pointer-events: all !important",
                    onClick: function(event) {
                        chrome.runtime.sendMessage({
                            type: 'auth'
                        });
                        var contacts = [];
                        for (var row in event.selectedThreadRowViews) {
                            var thread = event.selectedThreadRowViews[row];
                            //console.log(event.getInitialMessageID());
                            //console.log(thread.getInitialMessageID());
                            let rec = {
                                // to: thread.getContacts()[0].emailAddress,
                                subject: thread.getSubject(),
                                threadId: thread.getThreadID()
                            }

                            let to;
                            for (var contact in thread.getContacts()) {
                                let email = thread.getContacts()[contact].emailAddress;

                                if (email === sdk.User.getEmailAddress()) {

                                } else {
                                    to = email;
                                }
                            }
                            if (typeof to === 'undefined' || to === null) {

                                to = sdk.User.getEmailAddress();
                            }

                            rec['to'] = to;
                            contacts.push(rec);
                        }

                        sdk.Conversations.registerMessageViewHandler(function(messageView) {
                            console.log('testing!!!');
                            console.log(messageView.getFileAttachmentCardViews());
                        });

                        sdk.Compose.openNewComposeView().then((composeView) => {
                            console.log('calling');
                            console.log(composeView.getInitialMessageID());
                            let contactsArrsTo = [];
                            for (let i = 0; i < contacts.length; i++) {
                                contactsArrsTo.push(contacts[i].to);
                            }
                            composeView.setToRecipients(contactsArrsTo);
                            var btn = document.createElement("BUTTON");
                            btn.className = "btn-send-reply";
                            btn.innerHTML = "Send";


                            /*try{
                            	document.body.insertAdjacentHTML('afterend',"<span id='custom_css'><style>.bAs{display:none !important;}.aoP{height:100%;}.aoP .aoY, .aoP .I5 {display: block;padding: 0px !important;margin: 0px;vertical-align: top;height: 70px;}</style></span>");
                            	
                            	document.querySelectorAll('[ class="iN"]')[0].addEventListener("click", function(){
                            		document.getElementById("custom_css").remove();
                            	});
                            }
                            catch(err)
                            {
                            }
						
						
                            document.getElementById(":eh").style.display = "block";*/

                            //let btnSend = document.querySelector('.inboxsdk__compose [aria-label*="Send"]');
                            let btnSend = document.querySelector('.inboxsdk__compose [aria-label*="Отправить"]');
                            if (btnSend == null) {
                                btnSend = document.querySelector('.inboxsdk__compose [aria-label*="Send"]');
                            }
                            let divBtn = btnSend.parentNode.parentNode;
                            let td = btnSend.parentNode.parentNode.parentNode;
                            let lastArr = [];
                            td.removeChild(divBtn);
                            td.appendChild(btn);
                            let opts = {};
                            opts['files'] = [];

                            btn.onclick = async function(e) {
                                e.preventDefault();
                                let files = 0;
                                let loadingFiles = 0;
                                const fetchIMG = async(name, url) => {
                                    var request = new XMLHttpRequest();
                                    request.open('GET', url, true);
                                    request.responseType = 'blob';
                                    request.onload = async function() {
                                        try {
                                            console.log(name);
                                            var reader = new FileReader();
                                            let metaFile = {
                                                name: name,
                                                type: request.response.type
                                            }
                                            console.log(request.response);
                                            let b64 = toBase64(request.response);
                                            await b64.then(res => {
                                                metaFile['data'] = res;
                                                opts['files'].push(metaFile);
                                                files++;
                                            });
                                            if (files === loadingFiles) {
                                                opts['sender'] = sdk.User.getEmailAddress();
                                                opts['body'] = composeView.getHTMLContent();
                                                opts['recs'] = contacts;
                                                console.log('images!');
                                                console.log(opts);

                                                chrome.runtime.sendMessage({
                                                    type: 'reply',
                                                    opts: opts
                                                })
                                                composeView.close();
                                                markRead2();
                                            }
                                        } catch {

                                        }
                                    };
                                    request.send();
                                }

                                const loadIMG = async() => {
                                    loadingFiles = $('.inboxsdk__compose [aria-label*="Attachment:"] a[target="_blank"]').length; //[aria-label*="Attachment:"]
                                    if (loadingFiles > 0) {
                                        for (let i = 0; i < $('.inboxsdk__compose [aria-label*="Attachment:"] a[target="_blank"]').length; i++) {
                                            console.log(i);
                                            console.log($('.inboxsdk__compose [aria-label*="Attachment:"] a[target="_blank"]'));
                                            let el = $('.inboxsdk__compose [aria-label*="Attachment:"] a[target="_blank"]')[i];
                                            console.log(el);
                                            let url = el.href;
                                            console.log(url);
                                            try {
                                                let name = $(el).children()[0].innerText;
                                                await fetchIMG(name, url);
                                                console.log('it worked fined!!');
                                            } catch (err) {
                                                console.log('i am in here 2');

                                                opts['sender'] = sdk.User.getEmailAddress();
                                                opts['body'] = composeView.getHTMLContent();
                                                opts['recs'] = contacts;
                                                chrome.runtime.sendMessage({
                                                    type: 'reply',
                                                    opts: opts
                                                })
                                                composeView.close();
                                                markRead2();
                                            }
                                        }
                                    } else {

                                        console.log('i am in here');

                                        opts['sender'] = sdk.User.getEmailAddress();
                                        opts['body'] = composeView.getHTMLContent();
                                        opts['recs'] = contacts;
                                        chrome.runtime.sendMessage({
                                            type: 'reply',
                                            opts: opts
                                        })
                                        composeView.close();
                                        markRead2();
                                    }
                                }

                                await loadIMG();
                            }

                            let form = document.querySelector('.inboxsdk__compose form');
                            form.setAttribute('style', 'display: none;');
                        });
                    },
                    hasDropdown: false,
                    hideFor: (route) => {
                        return false
                    },
                    keyboardShortcutHandle: null
                });
                isBtnAdded = true;
            } else if (isBtnAdded && document.querySelectorAll('div[aria-checked="true"]').length <= 1) {
                destroyFunc();
                isBtnAdded = false;
            }
        }, 100);
    }

    // Mark threads as read
    async markRead() {
        var container = $('[data-legacy-thread-id]:first').closest('tbody')
        if (!container.length) return;
        // 
        var checkedRow = container.find('[aria-checked="true"]')
        var tids = []
        $.each(checkedRow, (i, el) => {
            var tid = $(el).closest('tr').find('[data-legacy-thread-id]').attr('data-legacy-thread-id')
            tids.push(tid)
        })
        const d = await GStorage.get(['me', 'mass_actions'])
        const pid = d.me.metadata.source.id
        let labels = []
        if (d.mass_actions && d.mass_actions[pid]) {
            if (d.mass_actions[pid].archive) {
                labels.push('INBOX');
            }
            if (d.mass_actions[pid].mark_as_read) {
                labels.push('UNREAD');
            }
            if (labels.length) {
                chrome.runtime.sendMessage({
                    type: 'markAll',
                    opts: {
                        ids: tids,
                        removeLabelIds: labels
                    }
                });
            }
        }
    }
}

let t = 0;

// Listen to gmail tab activate
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'init_gmass_reply') {
        window.GMassReply = window.GMassReply || new _GMassReply()
    }

    console.log("below is the request type:");
    console.log(request.type);

    if (request.type == 'send_alert') {
        t++;
        if (1) {
            try {
                if (request.to) {
                    if (request.status >= 200 && request.status <= 300) {
                        toastr.success('Successfully replied To: ' + request.to + '<br />Subject:' + request.subject);
                    } else {
                        toastr.error('Error reply To: ' + request.to + '<br />Subject:' + request.subject);
                    }
                } else {
                    if (request.status >= 200 && request.status <= 300) {
                        toastr.success('Successfully replied');
                    } else {
                        toastr.error('Error reply');
                    }
                }
            } catch (err) {
                if (request.status >= 200 && request.status <= 300) {
                    toastr.success('Successfully replied');
                } else {
                    toastr.error('Error reply');
                }
            }
        }
        setTimeout(() => {
            t = 0;
        }, 1000);
    }
    /*if(request.type == 'inbox') {
        let el = $('div [aria-label="Archive"]')[0];
        $(el).click(() => {
            console.log('clicked!');
        });
    }
    if(request.type == 'unread') {
        let el = $('div [selector="read"]')[0];
        $(el).click(() => {
            console.log('clicked!');
        });
    }*/
})

window.GMassReply = window.GMassReply || new _GMassReply()