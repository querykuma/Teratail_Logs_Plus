// ==UserScript==
// @name         Teratail Logs Plus
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Teratailにログ閲覧の機能など便利な機能を追加
// @author       Query Kuma
// @match        https://teratail.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /**
   * taratailのquestionsページを開いたとき
   *
   */
  var teratail_questions = function () {

    var TeraLogs = {

      id: 1,
      warning_evaluation_added: false,

      /**
       * ユニークIDを生成して返す
       *
       * @returns {number}
       */
      generate_id: function () {

        return this.id++;
      },

      /**
       * 要素のテキストをtrimして返す
       *
       * @param {HTMLLIElement} elem
       * @returns {string}
       */
      get_text: function (elem) {

        if (!elem) return "";
        if (typeof elem === "string") return elem.trim();
        return elem.textContent.trim();
      },

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
      add_log: function (who, date, scroll_to, content, type, eval_value) {

        this.logs[this.generate_id()] = {
          who: this.get_text(who),
          date: this.get_text(date),
          scroll_to,
          content: this.get_text(content),
          type,
          eval_value: this.get_text(eval_value)
        };
      },

      /**
       * 主質問のログ追加
       *
       */
      add_log_question: function () {

        var who = document.querySelector("#l-headContents .c-userName");
        var date_created = document.querySelector('.p-questionStatus__editHistory time[itemprop="dateCreated"]');
        var date_modified = document.querySelector('.p-questionStatus__editHistory time[itemprop="dateModified"]');
        var scroll_to = document.querySelector("#l-topBreadcrumb");
        var content = document.querySelector("#l-headContents .p-questionHead__ttl");
        var eval_value = document.querySelector(".jt-question__evaluation--total");

        this.add_log(who, date_created, scroll_to, content, "投稿", eval_value);

        if (date_modified) {

          this.add_log(who, date_modified, scroll_to, content, "編集", eval_value);
        }
      },

      /**
       * 主質問の追記のログ追加
       *
       */
      add_log_question_ps: function () {

        var scroll_to = document.querySelector(".p-questionContents");

        for (var ui of document.querySelectorAll(".p-questionContents .p-rewriteRequest__commentBox")) {

          var who = ui.querySelector("a");
          var content = ui.querySelector(".p-rewriteRequest__commentBody");
          var post_time = ui.querySelector(".p-rewriteRequest__postTime");

          var date_modified = post_time.querySelector("[title]");
          var date_created;
          if (date_modified) {

            date_modified = date_modified.getAttribute("title");
            date_created = post_time.childNodes[0];

            this.add_log(who, date_modified, scroll_to, content, "編集");

          } else {

            date_created = post_time;

          }

          this.add_log(who, date_created, scroll_to, content, "追記");
        }
      },

      /**
       * 回答のログ追加
       *
       */
      add_log_reply: function () {

        for (var rc of document.querySelectorAll(".p-replyContents .p-replyBoxWrapper")) {

          this.add_log_reply_replier(rc);

          for (var ci of rc.querySelectorAll(".p-replyComment__item")) {

            this.add_log_reply_comment(ci);
          }
        }
      },

      /**
       * 回答の回答者のログ追加
       *
       * @param {HTMLLIElement} rc
       */
      add_log_reply_replier: function (rc) {

        var content = rc.querySelector(".C-markdownContents");
        var who = rc.querySelector(".c-userName");
        var date_created = rc.querySelector('.p-replyEditHistory time[itemprop="dateCreated"]');
        var date_modified = rc.querySelector('.p-replyEditHistory time[itemprop="dateModified"]');
        var scroll_to = rc;
        var eval_value = rc.querySelector(".jt-reply__evaluation__num");

        this.add_log(who, date_created, scroll_to, content, "回答", eval_value);

        if (date_modified) {
          this.add_log(who, date_modified, scroll_to, content, "編集", eval_value);
        }
      },

      /**
       * 回答のコメントのログ追加
       *
       * @param {HTMLLIElement} ci
       */
      add_log_reply_comment: function (ci) {

        var content = ci.querySelector(".p-replyComment__commentBody");
        var who = ci.querySelector(".txtUserName");
        var scroll_to = ci;
        var post_time = ci.querySelector('.p-replyComment__postTime');

        var date_modified = post_time.querySelector("[title]");
        var date_created;
        if (date_modified) {

          date_modified = date_modified.getAttribute("title");
          date_created = post_time.childNodes[0];

          this.add_log(who, date_modified, scroll_to, content, "編集");

        } else {

          date_created = post_time;
        }

        this.add_log(who, date_created, scroll_to, content, "コメ");
      },

      /**
       * ログを初期化する
       *
       */
      init_logs: function () {

        this.logs = {};

        this.add_log_question();
        this.add_log_question_ps();
        this.add_log_reply();
      },

      /**
       * ログボタンを追加する
       *
       */
      add_c_tera_logs__button: function () {

        document.querySelector(".btnAsk>a").style.display = "inline-block";
        document.querySelector(".btnAsk>a").insertAdjacentHTML('afterend', '<span id="c_tera_logs__button" class="C-submitButton--colorGreen">ログ</span>');
        this.c_tera_logs__button = document.getElementById("c_tera_logs__button");

        this.c_tera_logs__button.addEventListener('click', () => {

          this.c_tera_logs__button_click();
        });
      },

      /**
       * HTMLの文字列をエスケープする
       *
       * @param {string} text
       */
      escape_html: function (text) {

        var replace_table = {
          '&': '&amp;',
          "'": '&#x27;',
          '`': '&#x60;',
          '"': '&quot;',
          '<': '&lt;',
          '>': '&gt;'
        };

        return text.replace(/[&'`"<>]/g, (m) => replace_table[m]);
      },

      /**
       * ログボタンをクリックしたとき
       *
       * @returns
       */
      c_tera_logs__button_click: function () {

        if (this.l_tera_logs__overlay.classList.contains('show')) {

          this.l_tera_logs__overlay.classList.remove('show');

          return;
        }

        this.init_logs();

        var sorted_logs = Object.entries(this.logs).sort((a, b) => a[1].date < b[1].date ? 1 : -1);

        var l_tera_logs__overlay_html = sorted_logs.map((l) => {

          var type_html;
          if (l[1].type === '編集') {

            type_html = '編集';

          } else if (l[1].type === '回答') {

            type_html = '<span style="color: #F94A00;">回答</span>';

          } else {

            type_html = `<span style="color: #0404b4;">${l[1].type}</span>`;
          }

          var eval_html;
          if (l[1].eval_value === '0') {

            eval_html = '+0';
          } else {

            eval_html = l[1].eval_value;
          }
          eval_html = `<span class="c_tera_logs__eval">${eval_html}</span>`;

          return `<li><span class="log_line" tera_log_id="${l[0]}" title="${this.escape_html(l[1].content)}">${l[1].date} ${type_html} [ ${l[1].who} ${eval_html} ] ${this.escape_html(l[1].content.substr(0, 30))}</span></li>`;
        }).join('\n');

        this.l_tera_logs__overlay.innerHTML = `<ol>${l_tera_logs__overlay_html}</ol>`;

        this.l_tera_logs__overlay.addEventListener('click', (e) => {

          this.l_tera_logs__overlay_click(e);
        });

        this.l_tera_logs__overlay.classList.add('show');
      },

      /**
       * ログオーバーレイをクリックしたとき
       *
       * @param {MouseEvent} e
       */
      l_tera_logs__overlay_click: function (e) {

        var id = e.target.getAttribute("tera_log_id");

        if (id) {
          var rect = this.logs[id].scroll_to.getBoundingClientRect();

          this.l_tera_logs__overlay.classList.remove('show');

          var x = rect.left + window.scrollX;
          var y = rect.top + window.scrollY - 100;

          window.scrollTo(x, y);

        } else {

          this.l_tera_logs__overlay.classList.remove('show');
        }
      },

      /**
       * ユーザースクリプトを読み込んだとき
       *
       */
      init_userscript: function () {

        this.add_c_tera_logs__button();

        // ログ表示用のHTMLを追加
        document.body.insertAdjacentHTML('afterbegin', '<div id="l_tera_logs__overlay"></div>');
        this.l_tera_logs__overlay = document.getElementById('l_tera_logs__overlay');

        this.add_warning_score();

        this.add_warning_dateCreated();

        this.init_userscript_mutation();
      },

      /**
       * 質問を投稿後１時間以内のとき警告
       *
       */
      add_warning_dateCreated: function () {

        var max_hours = 1;
        var date_created = document.querySelector('.p-questionStatus__editHistory time[itemprop="dateCreated"]');

        var time_diff = (new Date() - new Date(date_created.textContent)) / 60 / 60 / 1000;

        if (time_diff < max_hours) {

          document.querySelector(".p-questionContents__detail").insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning"><i class="material-icons">warning</i>質問が投稿されてから${max_hours}時間以内です。</div>`);
        }
      },

      /**
       * 質問者のスコアが0以下のとき警告
       *
       */
      add_warning_score: function () {

        var target = document.querySelector(".p-questioner__txt");

        // 退会済みユーザーに対応するため
        if (target) {

          var mat = target.textContent.match(/(\d+)/);
          if (mat) {

            var score = Number(mat[0]);
            if (score <= 0) {

              document.querySelector(".p-questionContents__detail").insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning"><i class="material-icons">warning</i>質問者のスコアは${score}です。</div>`);
            }
          }
        }
      },

      /**
       * MutationObserverを作る
       *
       */
      init_userscript_mutation: function () {

        var timeoutID = setTimeout(() => this.init_userscript_mutation_run(), 0);

        var target = document.getElementById("l-headContents");
        var observer = new MutationObserver(() => {

          clearTimeout(timeoutID);
          timeoutID = setTimeout(() => this.init_userscript_mutation_run(), 300);
        });

        const config = {
          childList: true,
          subtree: true
        };

        observer.observe(target, config);
      },

      /**
       * MutationObserverのとき
       *
       */
      init_userscript_mutation_run: function () {

        this.add_warning_evaluation();
      },

      /**
       * 質問の評価が0未満のとき警告
       *
       */
      add_warning_evaluation: function () {

        if (this.warning_evaluation_added) return;

        var mat = document.querySelector(".jt-question__evaluation--total").textContent.match(/([-\d]+)/);

        if (mat) {

          var evaluation = Number(mat[0]);
          if (evaluation < 0) {

            document.querySelector(".p-questionContents__detail").insertAdjacentHTML('beforebegin', `<div class="c_tera_logs__warning"><i class="material-icons">warning</i>質問の評価は${evaluation}です。</div>`);
            this.warning_evaluation_added = true;
          }
        }
      }
    };

    TeraLogs.init_userscript();

    return TeraLogs;
  };

  /**
   * teratailのtagsページを開いたとき
   *
   */
  var teratail_tags = function () {

    var TeraTags = {

      /**
       * 要素を色でハイライトする。
       *
       * @param {HTMLElement} elem
       * @param {string} color
       */
      highlight_elem: function (elem, color) {

        var r = new Range();
        r.setStart(elem.firstChild, 0);
        r.setEnd(elem, elem.childNodes.length);

        var e = document.createElement("template");
        e.innerHTML = `<mark class="c_tera_logs__highlighter" style="background:${color};"></mark>`;
        e = e.content.firstChild.cloneNode(true);

        r.surroundContents(e);
      },

      /**
       * valueが条件condを満たしたとき要素elemを色colorでハイライトする。
       *
       * @param {HTMLElement} elem
       * @param {number} value
       * @param {string} cond （例： ">100")
       * @param {string} color
       */
      // eslint-disable-next-line max-params
      highlight_elem_cond: function (elem, value, cond, color) {

        var [, cond_compare, cond_value] = cond.match(/^([><])(\d+)$/);

        if (cond_compare === '>') {

          if (value > cond_value) {

            this.highlight_elem(elem, color);
          }
        } else if (value < cond_value) {

          this.highlight_elem(elem, color);
        }
      },

      /**
       * 評価、クリップ、PVが条件を満たすときハイライトする。（条件:">100"のように記述)
       *
       * @param {string} eval_cond
       * @param {string} eval_color
       * @param {string} clip_cond
       * @param {string} clip_color
       * @param {string} pv_cond
       * @param {string} pv_color
       */
      // eslint-disable-next-line max-params
      highlight_counts_cond: function (eval_cond, eval_color, clip_cond, clip_color, pv_cond, pv_color) {

        for (var bi of document.querySelectorAll("#mainContainer .boxItem")) {

          var counts = bi.querySelector(".C-questionFeedItemBottom__counts");

          /* url=search?qのとき */
          if (!counts) counts = bi.querySelector(".entry-dataList");

          for (var elem of counts.children) {

            var value = Number(elem.firstChild.textContent);
            var count_title = elem.firstElementChild.textContent;

            switch (count_title) {

              case "評価":
                this.highlight_elem_cond(elem, value, eval_cond, eval_color);
                break;

              case "クリップ":
                this.highlight_elem_cond(elem, value, clip_cond, clip_color);
                break;

              case "PV":
                this.highlight_elem_cond(elem, value, pv_cond, pv_color);
                break;

              default:
                break;
            }
          }
        }
      },

      /**
       * tagsページをハイライトする。
       *
       */
      highlight_counts: function () {

        this.highlight_counts_cond("<0", "pink", ">0", "greenyellow", ">80", "aquamarine");
      },
      /**
       * ユーザースクリプトを読み込んだとき
       *
       */
      init_userscript: function () {


        this.init_userscript_mutation();
      },

      /**
       * MutationObserverを作る
       *
       */
      init_userscript_mutation: function () {

        var timeoutID = setTimeout(() => this.highlight_counts(), 0);

        var target = document.getElementById("mainContainer");
        var observer = new MutationObserver(() => {

          clearTimeout(timeoutID);
          timeoutID = setTimeout(() => this.highlight_counts(), 100);
        });

        const config = {
          childList: true,
          subtree: true
        };

        observer.observe(target, config);
      }
    };

    TeraTags.init_userscript();

    return TeraTags;
  };

  /**
   * スタイルシートを追加する
   *
   */
  var add_style_sheet = function () {

    document.head.insertAdjacentHTML('beforeend',
      `<style>
/* tera logs plus */
a:visited { color:#B85A68; }
#l_tera_logs__overlay span.log_line { padding: 0px 2px; }
#l_tera_logs__overlay span.log_line:hover { border: 1px dashed #5342e9; border-radius: 3px; cursor: pointer; }
#l_tera_logs__overlay  { transition: all .3s ease; opacity: 0; visibility: hidden; transform: translateY(30px);
position: fixed; width: 80%; height: 80%; background-color: whitesmoke; z-index: 1000; left: 10%; top: 10%; overflow: auto; padding: 10px; border-radius:5px; }
#l_tera_logs__overlay.show { opacity: 1; visibility: visible; transform: translateY(0px); }
#l_tera_logs__overlay > ol {list-style: decimal; margin-left: 3em; }
.C-headerQuestionButton { width: 94px; }
#c_tera_logs__button { margin-left: 5px; color: white; border-radius: 2px; padding: 2px; cursor: pointer; }
.c_tera_logs__warning { background-color:#fff3cd; color:#856404; padding:16px; margin-bottom:40px; font-size:1.6rem; }
.c_tera_logs__warning .material-icons { margin-right:8px; margin-top:-5px; user-select:none; }
.c_tera_logs__highlighter { font:inherit; }
.c_tera_logs__eval { font-weight: bold; }
.entry-res.txt0Number { border: 1px dashed #0fab41; border-radius: 5px; color: #0fab41; }
</style>`);
  };

  add_style_sheet();

  if (/^https:\/\/teratail.com\/questions\//.test(document.URL)) {
    /* 質問ページ */

    teratail_questions();

  } else if (/^https:\/\/teratail.com\/(tags\/|$|search\?q)/.test(document.URL)) {
    /* tagsページ */

    teratail_tags();
  }

})();
