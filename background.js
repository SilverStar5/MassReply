// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

var sendAlert = { issend: false, status: [] };
// Messages
chrome.runtime.onMessage.addListener(async(request, sender, sendResponse) => {
    console.log('chrome runtime on');
    // Open tab
    function setGmailTab(tabId) {
        GStorage.set('gmail_tab', tabId)
    }
    async function getGmailTab() {
        const gmailTab = await GStorage.getGmailTab()
        return gmailTab
    }
    async function getEmail() {
        const email = await GStorage.getEmail()
        return email
    }
    async function getGmailUrl() {
        const email = await getEmail()
        return 'https://mail.google.com/mail/u/' + email
    }
    async function makeTab() {
        const url = await getGmailUrl()
        chrome.tabs.create({
            url: url
        }, function(tab) {
            console.log('gmailTABIS: ' + tab.id);
            setGmailTab(tab.id)
        })
    }

    if (request.type == 'openTab') {
        const url = await getGmailUrl()
        chrome.tabs.create({
            url: url
        }, function(tab) {
            chrome.tabs.update(tab.id, {
                active: true
            })
        })
    }
    // Close opened gmail tab
    if (request.type == 'closeGtab') {
        const gmailTab = await getGmailTab()
        chrome.tabs.getAllInWindow(null, function(tabs) {
            for (let j = 0; j < tabs.length; j++) {
                if (tabs[j].id == gmailTab) {
                    chrome.tabs.get(gmailTab, (tab) => {
                        tab && chrome.tabs.remove(gmailTab)
                    })
                }
            }
        });
    }
    // Open Gmail on active tab
    if (request.type == 'useTab') {
        setGmailTab(sender.tab.id)
        chrome.tabs.update({
            url: await getGmailUrl(),
            active: true
        })
    }

    if (request.type == 'reply') {
        GoogleApi.authorize();
        GoogleApi.reply(request.opts, sender.tab.id);
        // console.log(GoogleApi.getThread());
    }

    if (request.type == "auth") {
        GoogleApi.authorize();
    }

    if (request.type == "send_alert_bg") {
        console.log('got alert!');
        sendAlert.issend = true;
        sendAlert.status = request.status;
    }

    // Mark messages
    if (request.type == 'markAll') {

        /*if(request.opts.removeLabelIds.indexOf('INBOX') != -1) {
            chrome.tabs.sendMessage(sender.tab.id,{ type: "inbox" });
        }
        if(request.opts.removeLabelIds.indexOf('UNREAD') != -1) {
            chrome.tabs.sendMessage(sender.tab.id,{ type: "unread"});
        }*/
        console.log('mark all!!!!');
        await GoogleApi.markAll(request.opts, sender.tab.id);
    };
    // Allow passing of response
    return true
});
// Tabs activated
var chkTimer
let oldTab = null;

function tabCheck(tabId, changeInfo, tab) {
    if (chkTimer) clearTimeout(chkTimer)
    chkTimer = setTimeout(() => {
        const url = tab.url
        if (!url) return;
        if (url.indexOf('mail.google.com') > -1 || url.indexOf('inbox.google.com') > -1) {
            if (oldTab != tab) {
                oldTab = tab;
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'init_gmass_reply'
                    });
                } catch {

                }
                if (sendAlert.issend == true) {
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'send_alert',
                            status: sendAlert.status
                        });
                        sendAlert.issend = false;
                        sendAlert.status = [];
                    } catch {

                    }
                }
            }
        }
    }, 1000)
}

chrome.tabs.onUpdated.addListener(tabCheck)