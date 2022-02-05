// ==UserScript==
// @name         Teratail Logs Plus
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Teratailにログ閲覧の機能など便利な機能を追加
// @author       Query Kuma
// @match        https://teratail.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var f_debug = 0;

  var g_count = 0;
  var g_current_url;
  var f_need_run_callback = false;

  var g_author = null;

  // 自身によるDOM操作をMutationObserverに無視するように伝えるフラグ
  var f_ignore_mutation = false;

  console.log('Teratail Logs Plus');

  /**
   * 表示されていたらtrueを返す
   * @param {HTMLLIElement} elem
   * @returns
   */
  var tool__is_visible = (elem) => {
    var bcr = elem.getBoundingClientRect();
    if (bcr.height === 0 || bcr.width === 0) {
      return false;
    }
    return true;
  };

  /**
   * 表示された最も近い親要素を返す
   * @param {HTMLLIElement} elem
   * @returns
   */
  var tool__closest_visible = (elem) => {
    while (elem && !tool__is_visible(elem)) {
      elem = elem.parentElement;
    }
    return elem;
  };

  var TeraLogs = {
    id: 0,
    f_logs_initialized: false
  };

  /**
   * URLが変わったらTeraLogsを初期化する
   */
  var c_tera_logs__initialize = () => {
    TeraLogs.logs = {};
    TeraLogs.f_logs_initialized = false;
  };

  /**
   * HTMLの文字列をエスケープする
   *
   * @param {string} text
   */
  var c_tera_logs__escape_html = (text) => {
    var replace_table = {
      '&': '&amp;',
      "'": '&#x27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;'
    };

    return text.replace(/[&'`"<>]/g, (m) => replace_table[m]);
  };

  /**
   * ユニークIDを生成して返す
   *
   * @returns {number}
   */
  var c_tera_logs__generate_id = () => TeraLogs.id++;

  /**
   * 要素のテキストをtrimして返す
   *
   * @param {HTMLLIElement} elem
   * @returns {string}
   */
  var c_tera_logs__get_text = (elem) => {
    if (!elem) return "";
    if (typeof elem === "string") return elem.trim();
    return elem.textContent.trim();
  };

  /**
   * ログを追加する
   *
   * @param {HTMLLIElement} who
   * @param {HTMLLIElement} date
   * @param {HTMLLIElement} scroll_to
   * @param {HTMLLIElement} content
   * @param {string} type
   * @param {(string|undefined)} eval_value
   */
  // eslint-disable-next-line max-params
  var c_tera_logs__add_log = (who, date, scroll_to, content, type, eval_value) => {
    TeraLogs.logs[c_tera_logs__generate_id()] = {
      who: c_tera_logs__get_text(who),
      date: c_tera_logs__get_text(date),
      scroll_to,
      content: c_tera_logs__get_text(content),
      type,
      eval_value: c_tera_logs__get_text(eval_value)
    };
  };

  /**
   * 主質問のログ追加する
   *
   */
  var c_tera_logs__add_log_question = () => {
    var who = document.querySelector('[class*="questionHeader_profile__"]').firstElementChild;
    var date_created = document.querySelector('[class*="questionHeader_created_at__"]').lastChild;
    var date_modified = document.querySelector('[class*="questionHeader_updated_at__"]');
    var scroll_to = document.querySelector('main');
    var content = document.querySelector('[class*="markdown_markdownBody__"]');
    var eval_value = document.querySelectorAll('[class*="questionHeader_rating__"]')[1].children[1];

    if (g_author && g_author === who.textContent) {
      var who_author = who.textContent + '（作者）';
      c_tera_logs__add_log(who_author, date_created, scroll_to, content, "投稿", eval_value);

      if (date_modified) {

        c_tera_logs__add_log(who_author, date_modified.lastChild, scroll_to, content, "投編", eval_value);
      }
    } else {
      c_tera_logs__add_log(who, date_created, scroll_to, content, "投稿", eval_value);

      if (date_modified) {

        c_tera_logs__add_log(who, date_modified.lastChild, scroll_to, content, "投編", eval_value);
      }
    }
  };

  /**
   * 主質問の追記のログ追加する
   *
   */
  var c_tera_logs__add_log_question_ps = () => {
    for (var ui of document.querySelectorAll('article[class*="questionCommentListItem_container__"]')) {

      var who = ui.querySelector('[class*="questionCommentListItem_name__"]');
      var content = ui.querySelector('[class*="questionCommentListItem_comment__"]');
      var post_time = ui.querySelector('[class*="txt_mini__"] span');
      var scroll_to = ui;

      if (post_time.lastChild.textContent.trim() === '編集') {
        var date_modified = post_time.firstChild.textContent.trim();
        c_tera_logs__add_log(who, date_modified, scroll_to, content, "追編");
      } else {
        var date_created = post_time.firstChild.textContent.trim();
        c_tera_logs__add_log(who, date_created, scroll_to, content, "追記");
      }
    }
  };

  /**
   * 回答の回答者のログ追加する
   *
   * @param {HTMLLIElement} rc
   */
  var c_tera_logs__add_log_reply_replier = (rc) => {
    var content = rc.querySelector('[class*="questionAnswerListItem_markdown__"]');
    var who = rc.querySelector('[class*="userProfile_displayName__"]');
    var temp = rc.querySelectorAll('[class*="questionAnswerListItem_datetimeText__"]');

    var date_created = temp[0];
    var date_modified = temp[1];
    var scroll_to = rc;
    var eval_value = rc.querySelector('[class*="questionAnswerListItem_vote__"]');

    var label = rc.querySelector('[class*="questionAnswerListItem_label__"]');
    if (label) {
      label = label.textContent;
    }

    switch (label) {
      case 'ベストアンサー':
        c_tera_logs__add_log(who, date_created, scroll_to, content, "回ベ", eval_value);
        break;

      case '自己解決':
        c_tera_logs__add_log(who, date_created, scroll_to, content, "回自", eval_value);
        break;

      default:
        c_tera_logs__add_log(who, date_created, scroll_to, content, "回答", eval_value);
        break;
    }

    if (date_modified) {
      c_tera_logs__add_log(who, date_modified, scroll_to, content, "回編", eval_value);
    }
  };

  /**
   * 回答のコメントのログ追加する
   *
   * @param {HTMLLIElement} ci
   */
  var c_tera_logs__add_log_reply_comment = (ci) => {
    var content = ci.querySelector('[class*="answerCommentListItem_comment__"]');
    var who = ci.querySelector('[class*="answerCommentListItem_name__"]');
    var scroll_to = ci;
    var post_time = ci.querySelector('[class*="txt_mini__"] span');
    var post_time2 = post_time.firstChild;

    if (post_time.childNodes.length == 2) {
      c_tera_logs__add_log(who, post_time2, scroll_to, content, "コ編");
    } else {
      c_tera_logs__add_log(who, post_time2, scroll_to, content, "コメ");
    }
  };

  /**
   * 回答のログ追加する
   *
   */
  var c_tera_logs__add_log_reply = () => {
    for (var rc of document.querySelectorAll('[class*="answerBlock_container__"]')) {

      c_tera_logs__add_log_reply_replier(rc);

      for (var ci of rc.querySelectorAll("article")) {

        c_tera_logs__add_log_reply_comment(ci);
      }
    }
  };

  /**
   * ログを初期化する
   *
   */
  var c_tera_logs__init_logs = () => {

    if (TeraLogs.f_logs_initialized) {
      return;
    }

    c_tera_logs__add_log_question();
    c_tera_logs__add_log_question_ps();
    c_tera_logs__add_log_reply();

    TeraLogs.f_logs_initialized = true;
  };

  /**
   * ログオーバーレイをクリックしたとき
   *
   * @param {MouseEvent} e
   */
  var c_tera_logs__overlay_click = (e) => {
    var id = e.target.getAttribute("tera_log_id");

    if (id) {
      var target = TeraLogs.logs[id].scroll_to;
      target = tool__closest_visible(target);

      var rect = target.getBoundingClientRect();

      TeraLogs.l_tera_logs__overlay.classList.remove('show');

      var x = rect.left + window.scrollX;
      var y = rect.top + window.scrollY - 50;

      window.scrollTo(x, y);
    } else {

      TeraLogs.l_tera_logs__overlay.classList.remove('show');
    }
  };

  /**
   * ログボタンをクリックしたとき
   *
   * @returns
   */
  var c_tera_logs__button_click = () => {

    if (TeraLogs.l_tera_logs__overlay.classList.contains('show')) {

      TeraLogs.l_tera_logs__overlay.classList.remove('show');

      return;
    }

    c_tera_logs__init_logs();

    var sorted_logs = Object.entries(TeraLogs.logs).sort((a, b) => a[1].date < b[1].date ? 1 : -1);

    var l_tera_logs__overlay_html = sorted_logs.map((l) => {

      var id = l[0];
      var log = l[1];

      var type_html;
      switch (log.type) {
        case '投編':
        case '追編':
        case '回編':
        case 'コ編':
          type_html = log.type;
          break;

        case '回答':
        case '回ベ':
        case '回自':
          type_html = `<span style="color: #F94A00;">${log.type}</span>`;
          break;

        default:
          type_html = `<span style="color: #0404b4;">${log.type}</span>`;
          break;
      }

      var eval_html;
      if (log.eval_value === '0') {

        eval_html = '+0';
      } else {

        eval_html = log.eval_value;
      }
      eval_html = `<span class="c_tera_logs__eval">${eval_html}</span>`;

      return `<li><span class="log_line" tera_log_id="${id}" title="${c_tera_logs__escape_html(log.content)}">${log.date} ${type_html} [ ${log.who} ${eval_html} ] ${c_tera_logs__escape_html(log.content.substr(0, 30))}</span></li>`;
    }).join('\n');

    TeraLogs.l_tera_logs__overlay.innerHTML = `<ol>${l_tera_logs__overlay_html}</ol>`;

    TeraLogs.l_tera_logs__overlay.addEventListener('click', (e) => {

      c_tera_logs__overlay_click(e);
    });

    TeraLogs.l_tera_logs__overlay.classList.add('show');
  };

  /**
   * ログボタンを追加する
   * @returns
   */
  var add_log_button = () => {
    if (document.getElementById("c_tera_logs__button")) {
      return;
    }

    c_tera_logs__initialize();

    var button_question = document.querySelector('header [href="/cautions_question"]');

    button_question.insertAdjacentHTML('afterend', `<span id="c_tera_logs__button" class="${button_question.className}">ログ</span>`);

    var c_tera_logs__button = document.getElementById("c_tera_logs__button");

    c_tera_logs__button.addEventListener('click', () => {
      c_tera_logs__button_click();
    });

  };

  /**
   * ログ表示用のHTMLを追加する
   * @returns
   */
  var add_logs_overlay = () => {
    if (document.getElementById("l_tera_logs__overlay")) {
      return;
    }

    document.body.insertAdjacentHTML('afterbegin', '<div id="l_tera_logs__overlay"></div>');
    TeraLogs.l_tera_logs__overlay = document.getElementById('l_tera_logs__overlay');
  };

  /**
   * 質問を投稿後１時間以内のとき警告する
   *
   */
  var add_warning_dateCreated = () => {
    var max_hours = 1;
    var date_created = document.querySelector('[class*="questionHeader_created_at__"]').lastChild;

    var time_diff = (new Date() - new Date(date_created.textContent)) / 60 / 60 / 1000;

    if (time_diff < max_hours) {

      document.querySelector("main").parentElement.insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning">質問が投稿されてから${max_hours}時間以内です。</div>`);
    }
  };

  /**
   * 質問者のスコアが0以下のとき警告する
   *
   */
  var add_warning_score = () => {
    var target = document.querySelector('[class*="questionHeader_scoreValue__"]');

    // 退会済みユーザーに対応するため
    if (target) {

      var mat = target.textContent.match(/([-\d]+)/);
      if (mat) {

        var score = Number(mat[0]);
        if (score <= 0) {

          document.querySelector("main").parentElement.insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning">質問者のスコアは${score}です。</div>`);
        }
      }
    }
  };

  /**
   * 質問の評価が0未満のとき警告する
   *
   */
  var add_warning_evaluation = () => {
    var mat = document.querySelectorAll('[class*="questionHeader_rating__"]')[1].textContent.match(/(-?[\d]+)/);

    if (mat) {
      var evaluation = Number(mat[0]);
      if (evaluation < 0) {
        document.querySelector("main").parentElement.insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning">質問の評価は${evaluation}です。</div>`);
      }
    }
  };

  /**
   * 作者のコメントに印をつける
   */
  var add_marker = (who) => {
    if (g_author && who.textContent === g_author) {
      if (who.childNodes.length === 1) {
        who.append('（作者）');
      }
    }
  };

  /**
   * 作者のコメントに印をつけてまわる
   */
  var add_author_markers = () => {
    // 質問
    var who = document.querySelector('[class*="questionHeader_profile__"]').firstElementChild;

    g_author = who.textContent;

    // 質問へのコメント
    for (var ui of document.querySelectorAll('article[class*="questionCommentListItem_container__"]')) {

      who = ui.querySelector('[class*="questionCommentListItem_name__"]');
      add_marker(who);
    }

    // 回答
    for (var rc of document.querySelectorAll('[class*="answerBlock_container__"]')) {
      who = rc.querySelector('[class*="userProfile_displayName__"]');
      add_marker(who);

      // 回答へのコメント
      for (var ci of rc.querySelectorAll("article")) {
        who = ci.querySelector('[class*="answerCommentListItem_name__"]');
        add_marker(who);
      }
    }
  };

  /**
  * 質問ページのとき
  */
  var teratail_questions = () => {
    if (f_debug) {
      console.log('teratail_questions');
    }

    add_log_button();
    add_logs_overlay();

    add_warning_dateCreated();
    add_warning_score();
    add_warning_evaluation();

    add_author_markers();
  };

  /**
   * スタイルシートを追加する
   * @returns
   */
  var add_style_sheet = () => {
    if (document.getElementById('t_tera_logs__style')) {
      return;
    }

    document.head.insertAdjacentHTML('beforeend',
      `<style id="t_tera_logs__style">
	/* tera logs plus */
	#l_tera_logs__overlay span.log_line { padding: 4px; }
	#l_tera_logs__overlay span.log_line:hover { outline: 1px dashed #5342e9; border-radius: 3px; cursor: pointer; }
	#l_tera_logs__overlay  { transition: all .3s ease; opacity: 0; visibility: hidden; transform: translateY(30px);
	position: fixed; width: 80%; height: 80%; background-color: whitesmoke; z-index: 1000; left: 10%; top: 10%; overflow: auto; padding: 10px; border-radius:5px; white-space: nowrap;}
	#l_tera_logs__overlay.show { opacity: 1; visibility: visible; transform: translateY(0px); }
	#l_tera_logs__overlay > ol {list-style: decimal; margin-left: 3em; }
	#c_tera_logs__button { color: white; border-radius: 2px; cursor: pointer; width: initial; }
	.c_tera_logs__warning { background-color:#fff3cd; color:#856404; padding:16px; margin-bottom:20px; font-size:1.6rem; max-width: 1120px; margin-right: auto; margin-left: auto; }
	.c_tera_logs__eval { font-weight: bold; }
  html { scroll-behavior: initial; }
	</style>`);
  };

  /**
   * URLの変更後にDOMがあれば削除する
   */
  var remove_doms = () => {
    var elements = document.querySelectorAll('.c_tera_logs__warning');
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      element.remove();
    }
  };

  /**
   * ReactのDOM読み込みが完了したとき
   * @returns
   */
  var reactDOMContentLoaded = () => {
    if (g_current_url && g_current_url === document.URL) {
      if (f_debug) {
        console.log('reactDOMContentLoaded ignored', g_count++);
      }

      return;
    }
    g_current_url = document.URL;

    if (f_debug) {
      console.log('reactDOMContentLoaded', g_count++, document.URL);
    }

    f_ignore_mutation = true;
    add_style_sheet();
    remove_doms();

    if (/^https:\/\/teratail.com\/questions\//.test(document.URL)) {
      teratail_questions();
    }

    setTimeout(() => { f_ignore_mutation = false; }, 0);
  };

  /**
   * Next.jsがスクロール時に発生させるmutationを無視するためにチェックする
   * @param {MutationRecord[]} mutations
   * @returns {boolean}
   */
  var check_ignore_mutations = (mutations) => {
    for (let index = 0; index < mutations.length; index++) {
      const mutation = mutations[index];

      if (mutation.addedNodes && mutation.addedNodes.length === 1) {
        var tagName = mutation.addedNodes[0].tagName;

        if (!tagName) {
          return false;
        }

        if (!['SCRIPT', 'LINK'].includes(tagName.toUpperCase())) {
          return false;
        }

      } else {
        return false;
      }
    }
    return true;
  };

  /**
   * intervalの間、mutationsが発生しなかったらcallbackを実行する
   * @param {function} callback
   * @param {number} interval
   * @returns
   */
  var add_callback_mutation = (callback, interval) => {
    var observer;
    var timeoutID = null;

    const config = {
      "attributes": false,
      "childList": true,
      "subtree": true
    };

    var mutation_callback = (mutations) => {
      if (!f_need_run_callback) {
        // callback()を呼び出すmutationの後のmutationでignore_mutationされる場合がある
        if (f_ignore_mutation) {
          if (f_debug > 1) {
            console.log('f_ignore_mutation', mutations);
          }
          return;
        }

        if (check_ignore_mutations(mutations)) {
          if (f_debug > 1) {
            console.log('check_ignore_mutations', mutations);
          }
          return;
        }

        f_need_run_callback = true;
      }

      if (f_debug > 1) {
        console.log(mutations.length, mutations);
      }

      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => {
        callback();
        f_need_run_callback = false;
      }, interval);
    };

    timeoutID = setTimeout(() => { callback(); }, interval);
    observer = new MutationObserver(mutation_callback);
    observer.observe(document, config);

    return observer;
  };

  add_callback_mutation(reactDOMContentLoaded, 500);
})();
