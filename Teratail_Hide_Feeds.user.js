// ==UserScript==
// @name         Teratail Hide Feeds
// @namespace    http://tampermonkey.net/
// @version      1.01
// @description  tagsページでタグやタイトルで指定したフィードを非表示にする
// @author       Query Kuma
// @match        https://teratail.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log('Teratail Hide Feeds');

    // フィードを非表示にしたいタグ名（ここの値を変えてください。更新したときのため値を保存しておいてください）
    const HIDE_TAGS_RE = [
        /MacOS/i, /Linux/i, /Windows/i
    ];

    // フィードを非表示にしたいタイトル名（ここの値を変えてください。更新したときのため値を保存しておいてください）
    const HIDE_TITLES_RE = [
        /MacOS/i, /Linux/i, /Windows/i
    ];

    /**
     * タイトルで非表示にするか判定する
     *
     * @param {string} title
     * @returns {boolean}
     */
    function is_hide_title(title) {

        const len = HIDE_TITLES_RE.length;

        for (var i = 0; i < len; i++) {
            if (HIDE_TITLES_RE[i].test(title)) return true;
        }

        return false;
    }

    /**
     * タグで非表示にするか判定する
     *
     * @param {string} tag
     * @returns {boolean}
     */
    function is_hide_tag(tag) {

        const len = HIDE_TAGS_RE.length;

        for (var i = 0; i < len; i++) {
            if (HIDE_TAGS_RE[i].test(tag)) return true;
        }

        return false;
    }

    /**
     * タイトルでフィードを非表示にする
     *
     * @param {object} bi boxItem
     */
    function hide_feeds_title(bi) {

        if (bi.style.display === "none") return;

        var title = bi.querySelector("h2").textContent;

        if (is_hide_title(title)) {

            bi.style.display = "none";
            console.log("hide by title:", title);
        }
    }

    /**
     * タグでフィードを非表示にする
     *
     * @param {object} bi boxItem
     */
    function hide_feeds_tags(bi) {

        if (bi.style.display === "none") return;

        var tags = [...bi.querySelector('[class^="tagPopupList_contain"]').children].map((a) => a.querySelector('a').textContent);

        const len = tags.length;

        for (var i = 0; i < len; i++) {

            var tag = tags[i];

            if (is_hide_tag(tag)) {

                bi.style.display = "none";
                console.log("hide by tag:", tag);

                return;
            }
        }
    }

    /**
     * フィードを非表示にする
     *
     */
    function hide_feeds() {

        for (var bi of document.querySelectorAll("article")) {

            hide_feeds_title(bi);
            hide_feeds_tags(bi);
        }
    }

    /**
     * tagsページ
     *
     * @returns
     */
    function teratail_tags() {

        var timeoutID = setTimeout(hide_feeds, 0);

        var target = document.body;
        var observer = new MutationObserver(() => {

            clearTimeout(timeoutID);
            timeoutID = setTimeout(hide_feeds, 300);
        });

        const config = {
            childList: true,
            subtree: true
        };

        observer.observe(target, config);
    }

    if (/^https:\/\/teratail.com\/(tags\/|feed\/|$)/.test(document.URL)) {
        /* tagsページ */

        teratail_tags();
    }
})();
