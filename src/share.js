function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}


// a few references:
// 	  http://chriswren.github.io/native-social-interactions/
//    https://nimiq.github.io/web-share-shim/demo/


// {
//   "name": "Aggregator",
//   "share_target": {
//   "action": "/cgi-bin/aggregate",
//     "method": "POST",
//     "enctype": "multipart/form-data",
//     "params": {
//     "title": "name",
//       "text": "description",
//       "url": "link",
//       "files": [
//       {
//         "name": "records",
//         "accept": ["text/csv", ".csv"]
//       },
//       {
//         "name": "graphs",
//         "accept": "image/svg+xml"
//       }
//     ]
//   }
// }

/**
 * A class to allow custom share targets to the polyfill of navigator.share()
 * These just work off of opening constructed url in new tab for now
 * todo: file download/share suport
 * todo: refien options and enable custom options
 * todo: allow ShareTarget defaults
 *
 * @example
 * // 'telegram.me': 'https://t.me/share/url?url=' + url + '&text=' + text + '&to=' + phone_number,
 *    sharePolyfill.registerShareTarget(new ShareTarget({
 *
 *      name: 'telegram',
 *      niceName: "Telagram",
 *      origin: 'https://t.me',
 *
 *      icon: '<svg class="the-icon" width="31" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="#0088cc" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"></path></svg>',
 *
 *      share_target: {
 *        action: 'share/url?',
 *        method: 'get',
 *        params: {
 *          url: 'url',
 *          text: 'text',
 *          phone_number: 'phone_number',
 *          // hash_tags: 'hashtags'
 *        }
 *      }
 *    }))
 *
 * sharePolyfill.re
 */
class ShareTarget {
  /**
   * https://web.dev/web-share-target/
   * Register a possible url if the one you want is not provided
   * url = origin + action + params.join('&');  I try to deal with the / and ? properly
   * @param config - This is the config like in the manifest but with a few extra options
   * @param {String} config.name - the targetName can be used with shareTo
   * @param {String} [config.niceName=config.name] - UNOFFICIAL human frendly name for the UI
   * @param {String} config.origin - UNOFFICIAL this is the extra pesice of info not in the manifest that we need for a share_target
   * @param {String} config.icon - UNOFFICIAL IMPORTANT MUST HAVE class='the-icon' in svg tag;    todo add suport for using manifest icons this is simply an svg pasted in
   * @param {Function} [config.canShare] - todo a function that takes (data, options) passed in to navigator.share and tells us if it can use this data.  note the data is passed
   * @param {String} config.share_target - the defonition of the share url and its required paramater
   * @param {Object} config.share_target.action - The URI placed after the orgin ie '/share/
   * @param {String} [config.share_target.method="GET"] - the http methof for the fetch
   * @param {String} [config.share_target.enctype="multipart/form-data"] - the encoding type to send https://web.dev/web-share-target/#accepting-files
   * @param {Object} config.share_target.params - Each parameter of  {@see ShareTarget.share} can be mapped to a url search parameter of choice ie url: 'the_share_url' => /share?the_share_url=${url}
   *    Theoretically you can add any arg you want but you must provide it when you call share(data) in case the user selects the target that needs it.  you should make your target flexible to missing args
   * @param {String} config.share_target.params.title - the Header of the share link defaults to url if not provided
   * @param {String} [config.share_target.params.text] - the main body of the share message defaults to title : desc if not provided
   * @param {String} config.share_target.params.url - the url
   * @param {String} [config.share_target.params.files] - todo files suport
   * @param {String} [config.share_target.params.files.name]
   * @param {String} [config.share_target.params.files.accept]
   * @param {String} [config.share_target.params.files.desc] - UNOFFICIAL a description of what is being shared if text is provided and not desc text is used for desc
   *      NOTE YOU CAN ONLY USE UNOFFICIAL PARAMS WITH sharePolyfill.share() not navigator.share = sharePolyfill.share if your app depends on these and you dont want to use native navigator.share ever
   * @param {String} [config.share_target.params.image] - UNOFFICIAL an image url for the share card
   * @param {String} [config.share_target.params.app_id] -UNOFFICIAL an app id/ token
   * @param {String} [config.share_target.params.redirect] -UNOFFICIAL a redirect url for when the shareTarget is done
   * @param {String} [config.share_target.params.hashtags] -UNOFFICIAL a array of labels for use in twitter like hashtags
   * @param {String} [config.share_target.params.language='en'] -UNOFFICIAL for defining the language the share_target should disply in
   * @param {String} [config.share_target.params.provider=window.location.host] - UNOFFICIAL
   * @param {String} [config.share_target.params.via=window.location.href] -UNOFFICIAL the referring host/ thing default to window.location.href
   * @param {String} [config.share_target.params.category] - UNOFFICIAL what category to submit this share into
   * @param {String} [config.share_target.params.payload] - 'title : url\n desc \n tags' this is a useful glob of the args for use in copy etc
   * @param {String} [config.share_target.params.user_id] -UNOFFICIAL the user id of the person sharing
   * @param {String} [config.share_target.params.phone_number] -UNOFFICIAL the phone numbers to share to if we know used for sms
   * @param {String} [config.share_target.params.email_address] -UNOFFICIAL the email address to share to (used for gmail/yahoo etc)
   * @param {String} [config.share_target.params.cc_email_address] -UNOFFICIAL bcc emails comma seperated usually used with email
   * @param {String} [config.share_target.params.bcc_email_address] -UNOFFICIAL cc emails comma seperated  usually used with email
   * @param {Function} [config.share_target.execute] - If desired you may override the actual execute function all data will be passed just before execution for you to do with as you please
   * @param {Object} [config.share_target.defaults] - this lets you set defult paramaters, this is recommended for all
   *    unofficial paramaters needed as we should not asume the end user will pass them in.
   *    For example we could pass in the app_id when registering so we do not have to pass it in every time we call navigator.share()
   *
   *
   * */
  constructor(config) {


    this.config = config;

    //construct url
    let x = config.origin
    let a = config.share_target.action
    if (x[x.length - 1] != '/' && a[0] != '/')//make sure theres a slash between orgin and action
      x += '/'

    if (!a.includes('?'))
      a += '?';// adds the trailing ? for params if action does not already include it
    else if (a[a.length - 1] != '&' && a[a.length - 1] != '?')
      a += '&';   //and if there is an ? in the action assume there are parameters after it and ensure there is an and for the paramaters we will add

    x += a;
    this.url = x

    this.name = config.name;
    console.assert(this.name)

    this.niceName = config.niceName || config.name;//todo niceify
    console.assert(this.niceName)

    this.icon = config.icon; //todo support manifest style icons
    console.assert(this.icon)

    this.params = config.share_target.params;
    console.assert(this.params)


    // this.fetchParams = Object.assign({}, this.config.fetchOptions)

  }

  /**
   * Execute a share action on this target this will perform the fetch in accordance to the config or simply execute the function forwarding data
   * @param data See constructor for template arg info
   */
  share(data, options) {


    if (typeof this.config.share_target == 'function') {
      console.log("Using targets custom share function its in your hands now ");
      return this.config.share_target.call(this, data, options);
    }

    var args = data;
    const validargs = [
      'url',
      'title',
      'text',
      'desc',
      'image',
      'app_id',
      'redirect_url',
      'via',
      'hashtags',
      'provider',
      'language',
      'userid',
      'category',
      'phone_number',
      'email_address',
      'cc_email_address',
      'bcc_email_address',
    ];

    for (var i = 0; i < validargs.length; i++) {
      const validarg = validargs[i];
      if (!args[validarg]) {
        args[validarg] = '';
      }
    }


    if (!args.title) args.title = document.title;
    if (!args.url) args.url = window.location.href;
    if (!args.provider) args.provider = window.location.host;
    if (!args.via) args.via = window.location.href;


    if (!args.text) {
      if (args.desc) {
        args.text = args.title + '%20%3A%20' + args.desc;
      } else {
        args.text = args.title;
      }
    } else if (!args.desc) {
      args.desc = args.text;
    }
    if (!args.payload) {
      args.payload = `${args.title} : ${args.url}\n${args.desc}`;

    }

    const formData = new FormData();
    let params = Object.entries(this.config.share_target.params).map(e => {
      let argKey = e[0]
      let param = e[1]

      if (argKey == 'files') {
        let files = args.files
        if (!Array.isArray(files)) {
          console.error("Expected an array of FIles got:", files);
          return;
        }
        files.forEach(f => {
          formData.append('file', fileInput.files[0]);
        })

      }

      let val = fixedEncodeURIComponent(args[argKey])

      return param + '=' + val;
    })
    let url = this.url + params.join('&');
    console.log("final url: ", url)


    window.open(url, '_blank');
    // const fetchOptions = {
    //   method: this.config.share_target.method,
    //   headers: {
    //
    //     // "Content-Type": "multipart/form-data",
    //     // 'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
    //     'Access-Control-Allow-Origin': '*',
    //     // credential: "same-origin"
    //     mode: 'no-cors',
    //     credential: 'omit'
    //   },
    //   // body: JSON.stringify(json),
    // };
    // if (nocores) {
    //   fetchOptions.headers.mode = 'no-cors'
    //   fetchOptions.headers.credential = 'omit'
    // }

    // return fetch(url, fetchOptions);


  }
}


class SharePolyfill {

  /**
   * @example
   * https://github.com/bradvin/social-share-urls
   *   return {
   *     'add.this': 'http://www.addthis.com/bookmark.php?url=' + url,
   *     'blogger': 'https://www.blogger.com/blog-this.g?u=' + url + '&n=' + title + '&t=' + desc,
   *     'buffer': 'https://buffer.com/add?text=' + text + '&url=' + url,
   *     'diaspora': 'https://share.diasporafoundation.org/?title=' + title + '&url=' + url,
   *     'douban': 'http://www.douban.com/recommend/?url=' + url + '&title=' + text,
   *     'email': 'mailto:' + email_address + '?subject=' + title + '&body=' + desc,
   *     'evernote': 'https://www.evernote.com/clip.action?url=' + url + '&title=' + text,
   *     'getpocket': 'https://getpocket.com/edit?url=' + url,
   *     'facebook': 'http://www.facebook.com/sharer.php?u=' + url,
   *     'flattr': 'https://flattr.com/submit/auto?user_id=' + user_id + '&url=' + url + '&title=' + title + '&description=' + text + '&language=' + language + '&tags=' + hash_tags + '&hidden=HIDDEN&category=' + category,
   *     'flipboard': 'https://share.flipboard.com/bookmarklet/popout?v=2&title=' + text + '&url=' + url,
   *     'gmail': 'https://mail.google.com/mail/?view=cm&to=' + email_address + '&su=' + title + '&body=' + url + '&bcc=' + bcc_email_address + '&cc=' + cc_email_address,
   *     'google.bookmarks': 'https://www.google.com/bookmarks/mark?op=edit&bkmk=' + url + '&title=' + title + '&annotation=' + text + '&labels=' + hash_tags + '',
   *     'instapaper': 'http://www.instapaper.com/edit?url=' + url + '&title=' + title + '&description=' + desc,
   *     'line.me': 'https://lineit.line.me/share/ui?url=' + url + '&text=' + text,
   *     'linkedin': 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
   *     'livejournal': 'http://www.livejournal.com/update.bml?subject=' + text + '&event=' + url,
   *     'hacker.news': 'https://news.ycombinator.com/submitlink?u=' + url + '&t=' + title,
   *     'ok.ru': 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=' + url,
   *     'pinterest': 'http://pinterest.com/pin/create/button/?url=' + url,
   *     'qzone': 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + url,
   *     'reddit': 'https://reddit.com/submit?url=' + url + '&title=' + title,
   *     'renren': 'http://widget.renren.com/dialog/share?resourceUrl=' + url + '&srcUrl=' + url + '&title=' + text + '&description=' + desc,
   *     'skype': 'https://web.skype.com/share?url=' + url + '&text=' + text,
   *     'sms': 'sms:' + phone_number + '?body=' + text,
   *     'surfingbird.ru': 'http://surfingbird.ru/share?url=' + url + '&description=' + desc + '&screenshot=' + image + '&title=' + title,
   *     'telegram.me': 'https://t.me/share/url?url=' + url + '&text=' + text + '&to=' + phone_number,
   *     'threema': 'threema://compose?text=' + text + '&id=' + user_id,
   *     'tumblr': 'https://www.tumblr.com/widgets/share/tool?canonicalUrl=' + url + '&title=' + title + '&caption=' + desc + '&tags=' + hash_tags,
   *     'twitter': 'https://twitter.com/intent/tweet?url=' + url + '&text=' + text + '&via=' + via + '&hashtags=' + hash_tags,
   *     'vk': 'http://vk.com/share.php?url=' + url + '&title=' + title + '&comment=' + desc,
   *     'weibo': 'http://service.weibo.com/share/share.php?url=' + url + '&appkey=&title=' + title + '&pic=&ralateUid=',
   *     'whatsapp': 'https://api.whatsapp.com/send?text=' + text + '%20' + url,
   *     'xing': 'https://www.xing.com/spi/shares/new?url=' + url,
   *     'yahoo': 'http://compose.mail.yahoo.com/?to=' + email_address + '&subject=' + title + '&body=' + text,
   *   };
   * }
   */
  static getDefaultShareTargets() {

    let targets = []

    // 'gmail': 'https://mail.google.com/mail/?view=cm&to=' + email_address + '&su=' + title + '&body=' + url + '&bcc=' + bcc_email_address + '&cc=' + cc_email_address,
    targets.push(new ShareTarget({
      name: 'gmail',
      niceName: "GMail",
      origin: 'https://mail.google.com',
      icon: `<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="52 42 88 66">
<path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"/>
<path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"/>
<path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"/>
<path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92"/>
<path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"/>
</svg>`,
      share_target: {
        action: '/mail/?view=cm&',
        method: 'get',
        params: {
          email_address: 'to',
          title: 'su',
          url: 'body',
          bcc_email_address: 'bcc',
          cc_email_address: 'cc'
        }
      }
    }))

    // 'yahoo': 'http://compose.mail.yahoo.com/?to=' + email_address + '&subject=' + title + '&body=' + text,
    targets.push(new ShareTarget({
      name: 'yahoo',
      niceName: "Yahoo",
      origin: 'http://compose.mail.yahoo.com',

      icon: `<svg class="the-icon" width="300" height="300" enable-background="new 130.3515625 177.4335938 800 151.6611328" overflow="visible" version="1.1" viewBox="130.35 177.43 300 300" xml:space="preserve" xmlns="http://www.w3.org/2000/svg">
<path d="m420.93 272.27c-5.2009 0.51386-26.852 5.3644-34.129 6.9242-7.7923 2.0736-78.984 57.075-83.661 70.581-1.0368 4.6741-1.5565 11.866-1.5565 18.624l-0.52165 10.916c0 7.7884 2.1638 20.349 3.2 27.102 4.6806 1.0433 38.555 0.13235 44.788 1.1679l-0.7669 13.97c-6.0911-0.4438-49.106-0.33998-73.68-0.33998-12.475 0-52.576 1.3755-64.897 1.0044l2.3292-13.285c6.7561-0.52424 34.729 1.2068 40.879-5.2839 3.0546-3.2207 2.0814-6.6724 2.0814-25.376v-8.8317c0-4.1576 0-11.956-1.0426-19.233-2.5966-7.7962-65.301-86.09-81.409-98.558-4.6806-1.5572-33.99-4.4885-41.264-6.0508l-0.36204-11.968c3.6288-1.8193 36.221 0.44249 67.849-0.72797 20.787-0.76819 68.215 0 74.067 0.69684l-1.4994 10.547c-6.2338 1.561-36.266 2.1385-44.062 4.2147 20.268 30.139 52.312 68.94 62.707 84.011 5.7193-8.3126 55.954-42.874 57.512-54.825-7.7975-1.565-33.607-5.2788-37.766-5.2788l-2.4687-13.607c7.0753-1.1069 44.278 0 62.774 0 15.962 0 50.07 0 59.762 0.79416l-8.8628 12.813" fill="#592c71"/>
</svg>
`,

      share_target: {
        action: '/',
        method: 'get',
        params: {
          email_address: 'to',
          title: 'subject',
          url: 'body',
        }
      }
    }))

//     //    'google.bookmarks': 'https://www.google.com/bookmarks/mark?op=edit&bkmk=' + url + '&title=' + title + '&annotation=' + text + '&labels=' + hash_tags + '',
//     SEEMS BROKEN TODO somone figure out how to get bookmarks to add
//     targets.push(new ShareTarget({
//       name: 'google.bookmarks',
//       niceName: "Bookmark",
//       origin: 'https://www.google.com',
//       icon: `<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
//     <path d="M0 0h48v48h-48z" fill="none"/>
//     <path d="M36 4h-24c-2.21 0-4 1.79-4 4v32c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4v-32c0-2.21-1.79-4-4-4zm-24 4h10v16l-5-3-5 3v-16zm0 30l6-7.71 4.29 5.15 6-7.73 7.71 10.29h-24z"/>
// </svg>
// `,
//       share_target: {
//         method: 'get',
//         action: '/bookmarks/mark?op=edit&',
//         params: {
//           url: 'bkmk',
//           title: 'title',
//           text: 'annotation',
//           hash_tags: 'labels'
//         }
//       }
//     }))
//     'whatsapp': 'https://api.whatsapp.com/send?text=' + text + '%20' + url,
    targets.push(new ShareTarget({
      name: 'whatsapp',
      niceName: "WhatsApp",
      origin: 'https://api.whatsapp.com',

      icon: '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#075e54" d="M224 122.8c-72.7 0-131.8 59.1-131.9 131.8 0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6 49.9-13.1 4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8 0-35.2-15.2-68.3-40.1-93.2-25-25-58-38.7-93.2-38.7zm77.5 188.4c-3.3 9.3-19.1 17.7-26.7 18.8-12.6 1.9-22.4.9-47.5-9.9-39.7-17.2-65.7-57.2-67.7-59.8-2-2.6-16.2-21.5-16.2-41s10.2-29.1 13.9-33.1c3.6-4 7.9-5 10.6-5 2.6 0 5.3 0 7.6.1 2.4.1 5.7-.9 8.9 6.8 3.3 7.9 11.2 27.4 12.2 29.4s1.7 4.3.3 6.9c-7.6 15.2-15.7 14.6-11.6 21.6 15.3 26.3 30.6 35.4 53.9 47.1 4 2 6.3 1.7 8.6-1 2.3-2.6 9.9-11.6 12.5-15.5 2.6-4 5.3-3.3 8.9-2 3.6 1.3 23.1 10.9 27.1 12.9s6.6 3 7.6 4.6c.9 1.9.9 9.9-2.4 19.1zM400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM223.9 413.2c-26.6 0-52.7-6.7-75.8-19.3L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5 29.9 30 47.9 69.8 47.9 112.2 0 87.4-72.7 158.5-160.1 158.5z"></path></svg>',

      share_target: {
        action: '/send',
        method: 'get',
        params: {
          payload: 'text',
        }
      }
    }))

    // window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${title}&summary=${text}&source=LinkedIn`);

    targets.push(new ShareTarget({
      name: 'linkedin',
      niceName: "LinkedIn",
      origin: 'https://www.linkedin.com',

      icon: '<svg class="the-icon" width="28" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#0077b5" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>',

      share_target: {
        action: '/shareArticle?mini=true&source=LinkedIn&',
        method: 'get',
        params: {
          url: 'url',
          title: 'title',
          desc: 'summary'
        }
      }
    }))
    // 'twitter': 'https://twitter.com/intent/tweet?url=' + url + '&text=' + text + '&via=' + via + '&hashtags=' + hash_tags,
    targets.push(new ShareTarget({

      name: 'twitter',
      niceName: "Twitter",
      origin: 'https://twitter.com',

      icon: '<svg class="the-icon" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#1da1f2" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>',

      share_target: {
        action: '/intent/tweet',
        method: 'get',
        params: {
          url: 'url',
          text: 'text',
          via: 'via',
          hash_tags: 'hashtags'
        }
      }
    }))

    // 'telegram.me': 'https://t.me/share/url?url=' + url + '&text=' + text + '&to=' + phone_number,
    targets.push(new ShareTarget({

      name: 'telegram',
      niceName: "Telagram",
      origin: 'https://t.me',

      icon: '<svg class="the-icon" width="31" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="#0088cc" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"></path></svg>',

      share_target: {
        action: 'share/url?',
        method: 'get',
        params: {
          url: 'url',
          text: 'text',
          phone_number: 'to',
          // hash_tags: 'hashtags'
        }
      }
    }))

    // 'https://www.facebook.com/sharer/sharer.php?' +
    //           'u=' + encodeURIComponent(url) +
    //           '&quote=' + encodeURIComponent(text) +
    //           '&hashtag=' + (hashtag || hashtags || '')
    targets.push(new ShareTarget({

      name: 'facebook',
      niceName: "Facebook",
      origin: 'https://www.facebook.com',

      icon: '<svg class="the-icon" width="28" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#3b5998" d="M448 56.7v398.5c0 13.7-11.1 24.7-24.7 24.7H309.1V306.5h58.2l8.7-67.6h-67v-43.2c0-19.6 5.4-32.9 33.5-32.9h35.8v-60.5c-6.2-.8-27.4-2.7-52.2-2.7-51.6 0-87 31.5-87 89.4v49.9h-58.4v67.6h58.4V480H24.7C11.1 480 0 468.9 0 455.3V56.7C0 43.1 11.1 32 24.7 32h398.5c13.7 0 24.8 11.1 24.8 24.7z"></path></svg>',

      share_target: {
        action: 'sharer/sharer.php?',
        method: 'get',
        params: {
          url: 'u',
          text: 'quote',
          hastags: 'hashtag',
          // hash_tags: 'hashtags'
        }
      }
    }))

    // 'evernote': 'https://www.evernote.com/clip.action?url=' + url + '&title=' + text,
    //USER NEEDS TO INSTALL WEBCLIPER :( probably
    // targets.push(new ShareTarget({
    //
    //   name: 'evernote',
    //   niceName: "Evernote",
    //   origin: 'https://www.evernote.com',
    //
    //   icon: '<svg class="the-icon" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">  <image width="512" height="512" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAABGdBTUEAALGPC/xhBQAAACBjSFJN AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAC31BMVEX////Y+dyh66Ny4G9g 2llU1EdKzDdDxCpBwCVCwidExi1IyjNMzzpl3V9643mR6JOp7q3N9dH0/fbF9Mlv4GtHyjFBwSZu 3mqc6p7R99T8/v35/fqo7axT00VFyC1v32yx8LTy/PTM9s9O0D5ExSt+5H7c+eD4/fmG5odCwSd3 43bp/Ozv/PJX1kyk7afu/fFV1Ehr3mfx/fNT00ZW1Unr/O77/vyz77ZR0kPo/Oum7KnD88dFxy5X 1Uv6/vtLzjn9//6P55GF5Yau7rCI5olHyjK/88Kv77LQ9tP+//9p3WS38btCwihDxCnj++a58r3f +eN14nO88r9DxCiY6pu/88Ot7rGj7KWT6JbB88Wf7KLE9MhDxSrL9c7P9tPG9crU99iH5YjJ9czb +d+W6Zm98sDk++fM9tDh+uVa11B643qg66Pt/PDl+uhIyzRh21qD5YT2/ffR99VN0D2M5o6y8LVx 4G6V6Ze78b7i+uXW+NlGyTBY1k554nid66DX+Ntf2leB5YHz/PXZ+d1m3GDT+Nfc+d/w/PJO0D1o 3WKq7q7d+uFJyzVNzzyS6ZW+8sHg+uSi7KTV99hLzjhx4G2s77BY1k2b6p1c2FLn++p/5H/a+N5P 0UBk217s/O+d659Z109743rq++31/fZc2FP3/fie66Fj3F1R0kJe2VZo3WNr3mZw32xz4XB24nR4 4ne18LiC5YLe+uKJ5oqX6pq38bqo7aur7q+U6JaK5ouL54yA5IB34XW68b7A8sRGyTHI9MtExix9 432n7aqC5ION6I+j7Kaw77O08LeR6JSa651q3mVGyS/m++qO55Bn3GF04XF85HvH9Mts32hLzjeH 5ojW+Npb2FFU1Ehi21uZ6Zu48bxd2VRW1UpMzzuL542Q6JLC88bS99ZP0T+28Llt32ll215i2lyW 6ZhS00R95HzK9c1g2lhJzTaE5YVe2VXO9tJQ0UF04XLl++ml7agm3VajAAAAAWJLR0QAiAUdSAAA AAd0SU1FB+MCGREXHAezmWcAABNjSURBVHja7d3pY1TVGQZwLAKXEJAQGCUBhBoMEZRNQoAAAcQk EMISZJF9MYLIEtaIFghrIAKhgAIiRBFBFCqiYCstaEBEpRSXCtaiVqptQbv+AU1IZrLN3Dnnbs+5 M8/vE0TnzD3P+zKZmXvuPbVqERERERERERERERERERERERERERERERERERERERERERERERERERER ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER ERERERERkZvc8rPat9apW0+7qX5Eg8g6DRvd1jiqCfq4yAnRTZtp/nkib7+jeQz6+MhOsS1aavpa 3dm6DfooyS4/v0sTENf2bvSBkh3i2yWI1L/0l8E97dEHS5brcK9g+UtF3Ic+XLJYx04S9S/RuQv6 iMlKXbrK1V/T7u+IPmayUG3Z+mta127ogyaTEn1/6i5ff01L6oGeAJnSs5f3T92SjTSA1rsPegpk QuO+Kd4/9jNUf03rj54DGTfA84D3j/EDDTaA50H0LMio1AQtzfvnFgbrr2nNOqDnQcZ0r681S/f+ ZZDhBtDaoSdChgzO0LSGvr81MN4AQzLRUyEDhmZUfgc3zHj9NW04ei4kb0RWaelGev9q6EsArwye F3Kdh27WXxvl/ftoMw2gjUFPhySNLV/s9ZD3Bw+baoC+6PmQnHHjyys3wfsTcw2gTUTPiGRMivMW brL3RyYbYArXCbrIVF/9tWnen5lsAG1IndrTH8lGz4xEPBpRUbcZ3h+abYAyrWY+NmvS4+gJkq6J leqvzfb+1JoGKDNn7rwWaTnoeZJ/86uc9fWdzbeyAW7yLBi0cNEtiWYOlWwwuepZf9+CHssboExW y8VLcp9AT5p8lj5ZtUC+39c2NUCZiKd+sWwcF48pYHn1S758izptbYAyA1fk9Xx0JTqCsLaqxik/ 36l8BxrgJk/f1Q8MWBOPTiI8rZ1Tox7rvP/NqQYok5C/fsqG5vyg4KyCp2tWwndlh7MNUP5qsLHz ps08keiUwrp+agBtgDJ9F2/5ZbqZiZGQJ7b6S1+BBijVbNt2vhLYKzvSb/KKNEAJzzPPzjYzQdI1 e6P/2EFvAgP0wI7R/JRoj52B7vqgVAOUiNj1HDqrUNR+d6DAVWuAkpeBuVPRcYWcbkkB41avAUo8 Px+dWGjZE7j+ajaA5ulciA4thHSsoxO1mg2gaXF7U9C5hYp19+sFrWoDaFrRLejkQkOX3roxq9sA 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 gBKK0dOjoLKFr+qSNl5oUQmBRcms6pBxKgo9NRKyyGO+2H4cLDB/aOSIE3Z0wJ38/tc9WljeARl7 0XMiGdfGm695Zbt5/t9l0qw8K+DJ24+eD8maLb53TNB//tHoyZABKdOFL/LVFbekD3oqZMyaOha8 +m97wvyBEEjMl3Em639gDXoOZErmYhMfCBM68xZg7jf/hsHyR5yZgT52ssT11QZeBSLvCLatILnH H0/KvRdo9sK4FPQxk6VWFheJVv9Uo1689VMoKlx2I+gXA+Nv3Haa1Q9dXQZ//lKgkwSejYfGTOBX PqEvcc25MSe/ivzY92oQF1nUdErjtBz0gZHDYvcUTls748VY8yMRERERERERERERERERERERERER ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER ERERERERERERERERERERERERERERkVP+D057G+k+fzIGAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5 LTAyLTI1VDE3OjIzOjI4KzAwOjAwLC762QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMi0yNVQx NzoyMzoyOCswMDowMF1zQmUAAAA7dEVYdGljYzpjb3B5cmlnaHQAQ29weXJpZ2h0IDIwMDcgSW50 ZXJuYXRpb25hbCBDb2xvciBDb25zb3J0aXVtb/EZIQAAAD10RVh0aWNjOmRlc2NyaXB0aW9uAHNS R0IgdjQgSUNDIHByZWZlcmVuY2UgcGVyY2VwdHVhbCBpbnRlbnQgYmV0YdctZ9wAAAA+dEVYdGlj YzptYW51ZmFjdHVyZXIAc1JHQiB2NCBJQ0MgcHJlZmVyZW5jZSBwZXJjZXB0dWFsIGludGVudCBi ZXRhl3vwGQAAADd0RVh0aWNjOm1vZGVsAHNSR0IgdjQgSUNDIHByZWZlcmVuY2UgcGVyY2VwdHVh bCBpbnRlbnQgYmV0Yb82D7oAAAAASUVORK5CYII="/></svg>',
    //
    //   share_target: {
    //     action: 'clip.action',
    //     method: 'get',
    //     params: {
    //       url: 'url'
    //       // text: 'title',
    //       // hash_tags: 'hashtags'
    //     }
    //   }
    // }))

    //   'getpocket': 'https://getpocket.com/edit?url=' + url,
    targets.push(new ShareTarget({

      name: 'getpocket',
      niceName: "Get-Pocket",
      origin: 'https://getpocket.com',

      icon: '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M407.6 64h-367C18.5 64 0 82.5 0 104.6v135.2C0 364.5 99.7 464 224.2 464c124 0 223.8-99.5 223.8-224.2V104.6c0-22.4-17.7-40.6-40.4-40.6zm-162 268.5c-12.4 11.8-31.4 11.1-42.4 0C89.5 223.6 88.3 227.4 88.3 209.3c0-16.9 13.8-30.7 30.7-30.7 17 0 16.1 3.8 105.2 89.3 90.6-86.9 88.6-89.3 105.5-89.3 16.9 0 30.7 13.8 30.7 30.7 0 17.8-2.9 15.7-114.8 123.2z"/></svg>',

      share_target: {
        action: '/edit',
        method: 'get',
        params: {
          url: 'url',
          // text: 'text',
          // phone_number: 'phone_number',
          // hash_tags: 'hashtags'
        }
      }
    }))


    return targets
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
   * Setup a instance with custom options
   * @param {Object} [options] - optional options :)
   * @param [options.forcePolyfill=false] - allows you to override default navigator share
   * @param [options.registerNativeTargets=false] - todo: allow us to extend native share and add our custom targets
   * @param [options.defaultTargets=true] - weather to include the default targets in this share
   * @param {Array<ShareTarget>} [options.shareTargets] - An array of additional share targets to add

   *
   */
  constructor(options) {

    options = options || {};
    options.defaultTargets = options.defaultTargets || true;
    // super('data', 'navigator.share(data)')
    //this is now a function that executes share

    this.languages = {
      default: {
        sms: 'SMS',
        messenger: 'Messenger',
        whatsapp: 'WhatsApp',
        twitter: 'Twitter',
        linkedin: 'Linkedin',
        telegram: 'Telegram',
        facebook: 'Facebook',
        skype: 'Skype',
        pinterest: 'Pinterest'
      },
      cs: {
        shareTitle: 'Sdílet',
        cancel: 'Zrušit',
        copy: 'Kopírovat',
        print: 'Tisk',
        email: 'E-mail',
        selectSms: 'Vyberte kontakt'
      },
      sk: {
        shareTitle: 'Zdieľať',
        cancel: 'Zrušiť',
        copy: 'Kopírovat',
        print: 'Tlač',
        email: 'E-mail',
        selectSms: 'Vyberte kontakt'
      },
      ja: {
        shareTitle: '共有する',
        cancel: 'キャンセル',
        copy: 'コピーする',
        print: '印刷する',
        email: 'E-mail',
        selectSms: '連絡先を選択してください'
      },
      zh: {
        shareTitle: '分享',
        cancel: '取消',
        copy: '複製連結',
        print: '列印',
        email: 'E-mail',
        selectSms: '選擇聯絡人'
      },
      pt: {
        shareTitle: 'Compartilhar',
        cancel: 'Cancelar',
        copy: 'Copiar',
        print: 'Imprimir',
        email: 'E-mail',
        selectSms: 'Selecione um contato'
      },
      en: {
        shareTitle: 'Share',
        cancel: 'Cancel',
        copy: 'Copy',
        print: 'Print',
        email: 'E-mail',
        selectSms: 'Pick a contact'
      },
      es: {
        shareTitle: 'Compartir',
        cancel: 'Cancelar',
        copy: 'Copiar',
        print: 'Imprimir',
        email: 'Correo',
        selectSms: 'Seleccionar un contacto'
      },
      fr: {
        shareTitle: 'Partager',
        cancel: 'Annuler',
        copy: 'Copier',
        print: 'Imprimer',
        email: 'E-mail',
        selectSms: 'Veuillez choisir un contact'
      },
      de: {
        shareTitle: 'Teilen',
        cancel: 'Abbrechen',
        copy: 'Kopieren',
        print: 'Drucken',
        email: 'E-mail',
        selectSms: 'Wählen Sie einen Kontakt aus'
      },
      it: {
        shareTitle: 'Condividi',
        cancel: 'Annulla',
        copy: 'Copia',
        print: 'Stampa',
        email: 'Email',
        selectSms: 'Seleziona un contatto'
      },
      nl: {
        shareTitle: 'Delen',
        cancel: 'Annuleren',
        copy: 'Kopiëren',
        print: 'Printen',
        email: 'E-mail',
        selectSms: 'Selecteer een contact'
      },
      sv: {
        shareTitle: 'Dela',
        cancel: 'Avbryt',
        copy: 'Kopiera',
        print: 'Skriv ut',
        email: 'E-mail',
        selectSms: 'Välj en kontakt'
      },
      da: {
        shareTitle: 'Del',
        cancel: 'Luk',
        copy: 'Kopiér',
        print: 'Udskriv',
        email: 'E-mail',
        selectSms: 'Vælg en kontaktperson'
      },
      // Deprecated, use `da` instead.
      dk: {
        shareTitle: 'Del',
        cancel: 'Luk',
        copy: 'Kopiér',
        print: 'Udskriv',
        email: 'E-mail',
        selectSms: 'Vælg en kontaktperson'
      },
      ru: {
        shareTitle: 'Поделиться',
        cancel: 'Отмена',
        copy: 'Скопировать',
        print: 'Печать',
        email: 'Э-майл',
        selectSms: 'Выбери контакт'
      },
      tr: {
        shareTitle: 'Paylaş',
        cancel: 'Vazgeç',
        copy: 'Kopyala',
        print: 'Yazdır',
        email: 'E-posta',
        selectSms: 'Bir kişi seç'
      },
      ko: {
        shareTitle: '공유',
        cancel: '취소',
        copy: '링크 복사',
        print: '인쇄',
        email: 'E-mail',
        selectSms: '연락처를 선택하세요'
      },
      ta: {
        shareTitle: 'பகிர்',
        cancel: 'இரத்து',
        copy: 'நகலெடு',
        print: 'அச்சிடு',
        email: 'மின்னஞ்சல்',
        selectSms: 'ஒரு தொடர்பைத் தேர்வுசெய்க'
      },
      pl: {
        shareTitle: 'Dzielić',
        cancel: 'Anuluj',
        copy: 'Kopiuj',
        print: 'Wydrukować',
        email: 'E-mail',
        selectSms: 'Wybierz kontakt'
      },
      is: {
        shareTitle: 'Deila',
        cancel: 'Hætta við',
        copy: 'Afrita',
        print: 'Prenta',
        email: 'Póstur',
        selectSms: 'Veldu tengilið'
      },
      hu: {
        shareTitle: 'Megosztás',
        cancel: 'Bezárás',
        copy: 'Másolás',
        print: 'Nyomtatás',
        email: 'E-mail',
        selectSms: 'Válasszon egy kontaktot'
      },
      hi: {
        shareTitle: 'शेयर करें',
        cancel: 'रद्द करें',
        copy: 'कॉपी करें',
        print: 'प्रिंट करें',
        email: 'ईमेल',
        selectSms: 'संपर्क चुनें'
      },
      be: {
        shareTitle: 'শেয়ার করুন',
        cancel: 'বাতিল করুন',
        copy: 'কপি করুন',
        print: 'প্রিন্ট করুন',
        email: 'ই মেইল',
        selectSms: 'পরিচিতি নির্বাচন করুন'
      }
    };

    this.android = navigator.userAgent.match(/Android/i);
    this.ios = navigator.userAgent.match(/iPhone|iPad|iPod/i);
    this.mac = navigator.userAgent.match(/iPhone|iPad|iPod|Macintosh/i); // Test if mac to use ios/mac share icon on title, used to invoke the familiary concept.

    this.isDesktop = !(this.ios || this.android);

    this._registeredTargets = [];


    this.icon = {
      'share': this.mac ? '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g><path fill="#424242" d="M381.9,181l95.8-95.8v525.9c0,13.4,8.9,22.3,22.3,22.3c13.4,0,22.3-8.9,22.3-22.3V85.2l95.8,95.8c4.5,4.5,8.9,6.7,15.6,6.7c6.7,0,11.1-2.2,15.6-6.7c8.9-8.9,8.9-22.3,0-31.2L515.6,16.1c-2.2-2.2-4.5-4.5-6.7-4.5c-4.5-2.2-11.1-2.2-17.8,0c-2.2,2.2-4.5,2.2-6.7,4.5L350.7,149.8c-8.9,8.9-8.9,22.3,0,31.2C359.6,190,373,190,381.9,181z M812,276.9H633.7v44.6H812v624H188v-624h178.3v-44.6H188c-24.5,0-44.6,20.1-44.6,44.6v624c0,24.5,20.1,44.6,44.6,44.6h624c24.5,0,44.6-20.1,44.6-44.6v-624C856.6,296.9,836.5,276.9,812,276.9z"/></g></svg>' : '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="#424242" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>',
      'email': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path fill="#424242" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>',
      'copy': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#424242" d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"></path></svg>',
      'print': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#424242" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
      'sms': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#424242" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
      'messenger': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#0084ff" d="M224 32C15.9 32-77.5 278 84.6 400.6V480l75.7-42c142.2 39.8 285.4-59.9 285.4-198.7C445.8 124.8 346.5 32 224 32zm23.4 278.1L190 250.5 79.6 311.6l121.1-128.5 57.4 59.6 110.4-61.1-121.1 128.5z"></path></svg>',
      'facebook': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#3b5998" d="M448 56.7v398.5c0 13.7-11.1 24.7-24.7 24.7H309.1V306.5h58.2l8.7-67.6h-67v-43.2c0-19.6 5.4-32.9 33.5-32.9h35.8v-60.5c-6.2-.8-27.4-2.7-52.2-2.7-51.6 0-87 31.5-87 89.4v49.9h-58.4v67.6h58.4V480H24.7C11.1 480 0 468.9 0 455.3V56.7C0 43.1 11.1 32 24.7 32h398.5c13.7 0 24.8 11.1 24.8 24.7z"></path></svg>',
      'whatsapp': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#075e54" d="M224 122.8c-72.7 0-131.8 59.1-131.9 131.8 0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6 49.9-13.1 4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8 0-35.2-15.2-68.3-40.1-93.2-25-25-58-38.7-93.2-38.7zm77.5 188.4c-3.3 9.3-19.1 17.7-26.7 18.8-12.6 1.9-22.4.9-47.5-9.9-39.7-17.2-65.7-57.2-67.7-59.8-2-2.6-16.2-21.5-16.2-41s10.2-29.1 13.9-33.1c3.6-4 7.9-5 10.6-5 2.6 0 5.3 0 7.6.1 2.4.1 5.7-.9 8.9 6.8 3.3 7.9 11.2 27.4 12.2 29.4s1.7 4.3.3 6.9c-7.6 15.2-15.7 14.6-11.6 21.6 15.3 26.3 30.6 35.4 53.9 47.1 4 2 6.3 1.7 8.6-1 2.3-2.6 9.9-11.6 12.5-15.5 2.6-4 5.3-3.3 8.9-2 3.6 1.3 23.1 10.9 27.1 12.9s6.6 3 7.6 4.6c.9 1.9.9 9.9-2.4 19.1zM400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM223.9 413.2c-26.6 0-52.7-6.7-75.8-19.3L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5 29.9 30 47.9 69.8 47.9 112.2 0 87.4-72.7 158.5-160.1 158.5z"></path></svg>',
      'twitter': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#1da1f2" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>',
      'linkedin': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#0077b5" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>',
      'telegram': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="#0088cc" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"></path></svg>',
      'skype': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#00aff0" d="M424.7 299.8c2.9-14 4.7-28.9 4.7-43.8 0-113.5-91.9-205.3-205.3-205.3-14.9 0-29.7 1.7-43.8 4.7C161.3 40.7 137.7 32 112 32 50.2 32 0 82.2 0 144c0 25.7 8.7 49.3 23.3 68.2-2.9 14-4.7 28.9-4.7 43.8 0 113.5 91.9 205.3 205.3 205.3 14.9 0 29.7-1.7 43.8-4.7 19 14.6 42.6 23.3 68.2 23.3 61.8 0 112-50.2 112-112 .1-25.6-8.6-49.2-23.2-68.1zm-194.6 91.5c-65.6 0-120.5-29.2-120.5-65 0-16 9-30.6 29.5-30.6 31.2 0 34.1 44.9 88.1 44.9 25.7 0 42.3-11.4 42.3-26.3 0-18.7-16-21.6-42-28-62.5-15.4-117.8-22-117.8-87.2 0-59.2 58.6-81.1 109.1-81.1 55.1 0 110.8 21.9 110.8 55.4 0 16.9-11.4 31.8-30.3 31.8-28.3 0-29.2-33.5-75-33.5-25.7 0-42 7-42 22.5 0 19.8 20.8 21.8 69.1 33 41.4 9.3 90.7 26.8 90.7 77.6 0 59.1-57.1 86.5-112 86.5z"></path></svg>',
      'pinterest': '<svg class="the-icon" width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid"><path d="M0,128.002 C0,180.416 31.518,225.444 76.619,245.241 C76.259,236.303 76.555,225.573 78.847,215.848 C81.308,205.457 95.317,146.1 95.317,146.1 C95.317,146.1 91.228,137.927 91.228,125.848 C91.228,106.879 102.222,92.712 115.914,92.712 C127.557,92.712 133.182,101.457 133.182,111.929 C133.182,123.633 125.717,141.14 121.878,157.355 C118.671,170.933 128.686,182.008 142.081,182.008 C166.333,182.008 182.667,150.859 182.667,113.953 C182.667,85.899 163.772,64.901 129.405,64.901 C90.577,64.901 66.388,93.857 66.388,126.201 C66.388,137.353 69.676,145.217 74.826,151.307 C77.194,154.104 77.523,155.229 76.666,158.441 C76.052,160.796 74.642,166.466 74.058,168.713 C73.206,171.955 70.579,173.114 67.649,171.917 C49.765,164.616 41.436,145.031 41.436,123.015 C41.436,86.654 72.102,43.054 132.918,43.054 C181.788,43.054 213.953,78.418 213.953,116.379 C213.953,166.592 186.037,204.105 144.887,204.105 C131.068,204.105 118.069,196.635 113.616,188.15 C113.616,188.15 106.185,217.642 104.611,223.337 C101.897,233.206 96.585,243.07 91.728,250.758 C103.24,254.156 115.401,256.007 128.005,256.007 C198.689,256.007 256.001,198.698 256.001,128.002 C256.001,57.309 198.689,0 128.005,0 C57.314,0 0,57.309 0,128.002 Z" fill="#CB1F27"></path></svg>'
    }


    //so that this is always available in share function
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
     * Perform a share
     * @param {ShareData} data - An object containing data to share
     * Properties that are unknown to the user agent are ignored; share data is only assessed on properties understood by the user agent. All properties are optional but at least one known data property must be specified.
     * Possible values are:
     * @param {string} data.url - A string representing a URL to be shared.
     * @param {string} data.url - A string representing text to be shared.
     * @param {string} data.url - A string representing a title to be shared. May be ignored by the target.
     * @param {Object} [options] - SharePolyfill Extended Options ignored in native more and optional
     * @return {Promise}
     */
    this.share = (data, options) => {
      return this._share(data, options)
    }

    if (options.defaultTargets) {
      let ts = SharePolyfill.getDefaultShareTargets();
      for (let i = 0; i < ts.length; i++) {
        this.registerShareTarget(ts[i]);

      }
    }

    if (!navigator.share || options.forcePolyfill) navigator.share = this.share;

  }

  appendCSS(content) {
    var css = content;
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');

    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));

    style.id = 'shareAPIPolyfill-style';

    head.appendChild(style);
  }


  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
   * This creates the share popup
   * @param data the share data
   * @param {String} data.url -  OFFICIAL A string representing a URL to be shared.
   * @param {String} data.text - OFFICIAL A string representing text to be shared.
   * @param {String} data.title - OFFICIAL A string representing a title to be shared. May be ignored by the target.
   * @param {Array<File>} data.files - OFFICIAL An array of File objects representing files to be shared. See below for shareable file types.
   * @param {String} data.desc - See {@link ShareTarget.constructor} for full unoffical target docs
   * @param options - optional options. can disable any target by name === false
   * @returns {Promise} - resolve undifined or reject Exception/Error
   */
  _share(data, options) {

    options = options || {};
    const languages = this.languages

    let android = this.android
    let ios = this.ios
    let mac = this.mac; //mac share icon on title, used to invoke the familiary concept.
    const isDesktop = this.isDesktop;

    let appendCSS = this.appendCSS;

    return new Promise((resolve, reject) => {

      if (!data.title || typeof data.title !== 'string' || !data.text || typeof data.text !== 'string') {
        reject('Invalid Params');
      }


      // const {title, url, app_id, hashtags, via, hashtag} = data;


      /**
       * Users may want to force the choice of a specific language
       * if `configs.language` in `languages`) === force to use it
       *
       */
      const language = {
        // merging the default/general language terms with the custom one
        ...this.languages.default,
        ...(
          // looking for terms in the selected language (if supported)
          this.languages[options.language]
            ? this.languages[options.language]
            // if not supported, we try and use the default navigator language, or English as fallback
            // if we have support for the specific navigator language (like es-AR, or pt-BR), we use it
            : this.languages[navigator.language]
            || this.languages[navigator.language.substring(0, 2).toLowerCase()]
            || this.languages.en
        )
      };

      const text = data.text || title;
      const image = encodeURIComponent(data.image);

      appendCSS(`
#shareAPIPolyfill-backdrop,
#shareAPIPolyfill-container {
  opacity: 0;
  pointer-events: none;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  will-change: opacity;
  z-index: 99999999;
}
#shareAPIPolyfill-backdrop {
  transition: opacity linear 250ms;
  background-color: rgba(0, 0, 0, 0.6);
}
#shareAPIPolyfill-container {
  background-color: #f9f9f9;
  top: auto;
  max-width: 400px;
  height: auto;
  transition-property: transform,opacity;
  transition-timing-function: linear;
  transition-duration: 250ms;
  transition-delay: 150ms;
  transform: translateY(100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", arial, sans-serif, "Microsoft JhengHei";
}
#shareAPIPolyfill-backdrop.visible,
#shareAPIPolyfill-container.visible {
  opacity: 1;
  pointer-events: all;
}
#shareAPIPolyfill-container.visible {
  transform: translateY(0);
}
#shareAPIPolyfill-container .shareAPIPolyfill-header {
  background: #EEE;
}
#shareAPIPolyfill-container .shareAPIPolyfill-header .shareAPIPolyfill-icons-container {
  display: flex;
}
#shareAPIPolyfill-container .shareAPIPolyfill-header-title {
  background-color: #E0E0E0;
  padding: 10px 18px;
  color: #424242;
  font-weight: 600;
}
#shareAPIPolyfill-container .shareAPIPolyfill-body {
  border-top: solid 1px #EEE;
}
#shareAPIPolyfill-container .shareAPIPolyfill-footer {
 width: 100%;
 display: block;
 border: none;
 transition: opacity ease-in 250ms;
 border-top: solid 1px #EEE;
 background-color: #EEE;
 text-align: center;
 padding: 10px;
 font-size:13px;
 cursor: pointer;
 opacity: .5;
}
#shareAPIPolyfill-container .shareAPIPolyfill-footer:hover {
  opacity: 1;
}
#shareAPIPolyfill-container .shareAPIPolyfill-icons-container {
  display: flex;
  flex-wrap: wrap;
}
#shareAPIPolyfill-container .tool-icon {
 border: none;
 display: inline-block;
 width: 25%;
 box-sizing: border-box;
 font-weight: 400;
 font-size: 12px;
 -webkit-font-smoothing: antialiased;
 -moz-osx-font-smoothing: grayscale;
 text-align: center;
 cursor: pointer;
 background-color: transparent;
 padding: 20px 0;
}
#shareAPIPolyfill-container .tool-icon:hover {
  box-shadow: inset 0 0 20px rgba(0,0,0, .125);
}
#shareAPIPolyfill-container .the-icon-title {
 padding-top: 10px;
 display: block;
}
.shareAPIPolyfill-header-title .the-icon {
	display: inline-block;
	height: 20px;
	width: 20px;
	padding-right: 5px;
	vertical-align:${mac ? '-2px' : '-4px'};
}
.shareAPIPolyfill-icons-container.title .tool-icon .the-icon,
.shareAPIPolyfill-icons-container.body .tool-icon .the-icon {
  display: block;
  margin: auto;
  width: 42px;
  height: 36px;
}
.shareAPIPolyfill-icons-container.title .tool-icon .the-icon {
  height: 24px;
}
.shareAPIPolyfill-icons-container .hidden {
  display: none !important;
}
.shareAPIPolyfill-icons-container button {
    margin: 0px;
}
`);

      function closeShareUI() {
        const removeBackdrop = () => {
          backdrop.removeEventListener('transitionend', removeBackdrop);
          document.body.removeChild(backdrop);
        }

        const removeContainer = () => {
          container.removeEventListener('transitionend', removeContainer);
          document.body.removeChild(container);
          document.head.removeChild(document.querySelector('#shareAPIPolyfill-style'));
          document.removeEventListener('keyup', keyCloseEvent);
        }

        backdrop.classList.remove('visible');
        container.classList.remove('visible');

        backdrop.addEventListener('transitionend', removeBackdrop);
        container.addEventListener('transitionend', removeContainer);
      }

      const backdrop = document.createElement('div');
      const container = document.createElement('div');
      backdrop.id = 'shareAPIPolyfill-backdrop';
      container.id = 'shareAPIPolyfill-container';

      container.setAttribute('tabindex', '0');

      let html = `
<div class="shareAPIPolyfill-header">
 <div class="shareAPIPolyfill-header-title" tabindex="0">${this.icon.share} ${language.shareTitle}</div>
 <div class="shareAPIPolyfill-icons-container title">
  <button class="${options.copy === false ? 'hidden' : ''} tool-icon copy" data-tool="copy">
   ${this.icon.copy}
   <span class="the-icon-title">${language.copy}</span>
  </button>
  <button class="${options.print === false ? 'hidden' : ''} tool-icon print" data-tool="print">
   ${this.icon.print}
   <span class="the-icon-title">${language.print}</span>
  </button>
  <button class="${options.email === false ? 'hidden' : ''} tool-icon email" data-tool="email">
   ${this.icon.email}
   <span class="the-icon-title">${language.email}</span>
  </button>
  <button class="${options.sms === false ? 'hidden' : ''} tool-icon sms" data-tool="sms">
   ${this.icon.sms}
   <span class="the-icon-title">${language.sms}</span>
  </button>
 </div>
</div>
<div class="shareAPIPolyfill-body">
 <div class="shareAPIPolyfill-icons-container body">
 `

      this._registeredTargets.forEach(t => {
        if (options[t.name] === false) return; // skip if explicitly told to only

        if (typeof t.canShare == 'function' && !t.canShare(data, options)) {
          console.log("This ShareTarget Says it cant use this data so not showing.", t.name);
          return;
        }

        html += `
<button class="tool-icon ${t.name}" data-tool="${t.name}">
  ${t.icon}
  <span class="the-icon-title">${t.niceName}</span>
</button>
      `

      })

      /*      html +=      `
        ${(fbId ? `
         <button class="tool-icon messenger ${!configs.messenger ? 'hidden' : ''}" data-tool="messenger">
          ${icon.messenger}
          <span class="the-icon-title">${language.messenger}</span>
         </button>
        ` : '')}
        <button class="${!configs.facebook ? 'hidden' : ''} tool-icon facebook" data-tool="facebook">
         ${icon.facebook}
         <span class="the-icon-title">${language.facebook}</span>
        </button>
        <button class="${!configs.whatsapp ? 'hidden' : ''} tool-icon whatsapp" data-tool="whatsapp">
         ${icon.whatsapp}
         <span class="the-icon-title">${language.whatsapp}</span>
        </button>
        <button class="${!configs.twitter ? 'hidden' : ''} tool-icon twitter" data-tool="twitter">
         ${icon.twitter}
         <span class="the-icon-title">${language.twitter}</span>
        </button>
        <button class="${!configs.linkedin ? 'hidden' : ''} tool-icon linkedin" data-tool="linkedin">
         ${icon.linkedin}
         <span class="the-icon-title">${language.linkedin}</span>
        </button>
        <button class="${!configs.telegram ? 'hidden' : ''} tool-icon telegram" data-tool="telegram">
         ${icon.telegram}
         <span class="the-icon-title">${language.telegram}</span>
        </button>
        <button class="${!configs.skype ? 'hidden' : ''} tool-icon skype skype-share" data-tool="skype" data-href="${url}" data-text="${title + ': ' + url}">
         ${icon.skype}
         <span class="the-icon-title">${language.skype}</span>
        </button>
        <button class="${!configs.pinterest ? 'hidden' : ''} tool-icon pinterest" data-tool="pinterest">
         ${icon.pinterest}
         <span class="the-icon-title">${language.pinterest}</span>
        </button>`*/
      html += `
 </div>
 <button class="shareAPIPolyfill-footer">
  ${language.cancel}
 </button>
</div>
`;

      container.innerHTML = html;
      backdrop.addEventListener('click', () => {
        closeShareUI();
      });

      function keyCloseEvent(event) {
        if (event.keyCode === 27) { // ESC
          closeShareUI();
        }
      }

      // if (configs.skype !== false) {
      //   addSkypeSupport();//no third parties if we can avoid it todo test
      // }

      // First, add the elements to the document in the current frame
      requestAnimationFrame(_ => {
        document.body.appendChild(backdrop);
        document.body.appendChild(container);
        document.addEventListener('keyup', keyCloseEvent);
        bindEvents();
        // Then, once the elements are added, add the "animatable status" classes
        requestAnimationFrame(() => {
          backdrop.classList.add('visible');
          container.classList.add('visible');
        })

        document.getElementById('shareAPIPolyfill-container').focus();
      });

      function addSkypeSupport() {
        (function (r, d, s) {
          r.loadSkypeWebSdkAsync = r.loadSkypeWebSdkAsync || function (p) {
            var js, sjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(p.id)) {
              return;
            }
            js = d.createElement(s);
            js.id = p.id;
            js.src = p.scriptToLoad;
            js.onload = p.callback
            sjs.parentNode.insertBefore(js, sjs);
          };
          var p = {
            scriptToLoad: 'https://swx.cdn.skype.com/shared/v/latest/skypewebsdk.js',
            id: 'skype_web_sdk'
          };
          r.loadSkypeWebSdkAsync(p);
        })(window, document, 'script');
      }

      let bindEvents = () => {
        Array.from(container.querySelectorAll('.tool-icon')).forEach(tool => {
          tool.addEventListener('click', async event => {
            // const payload = encodeURIComponent(text + ': ' + url);

            let name = tool.getAttribute('data-tool');


            switch (tool.dataset.tool) {
              case 'copy': {
                let str = data.title + '\n';
                if (data.title) str += data.title + '\n'
                str += data.url
                navigator.clipboard.writeText(`${data.title}\n${data.text || ''}\n${data.url}`);
                break;
              }
              case 'print': {
                // to ensure it has been closed and the user has a clean view of the page
                setTimeout(_ => {
                  self.print();
                }, 500);
                break;
              }
              case 'email': {
                // %0D%0A is newline
                const emailText = `${encodeURIComponent(data.text)}%0D%0A`
                const mailto = `mailto:?subject=${data.title}&body=${emailText}${encodeURIComponent(data.url)}`
                window.open(mailto);
                break;
              }
              case 'sms': {
                location.href = `sms:${language.selectSms}?&body=${encodeURIComponent(data.title)}: ${encodeURIComponent(data.text || '')} ${data.url}`;
                break;
              }
              default: {
                await this.shareTo(name, data, options)
              }
            }
            //   case 'messenger': {
            //     window.open(
            //       'http://www.facebook.com/dialog/send?' +
            //       'app_id=' + fbId +
            //       '&display=popup' +
            //       '&href=' + encodeURIComponent(url) +
            //       '&link=' + encodeURIComponent(url) +
            //       '&redirect_uri=' + encodeURIComponent(url) +
            //       '&quote=' + encodeURIComponent(text)
            //     );
            //     break;
            //   }
            //   case 'facebook': {
            //     window.open(
            //       'https://www.facebook.com/sharer/sharer.php?' +
            //       'u=' + encodeURIComponent(url) +
            //       '&quote=' + encodeURIComponent(text) +
            //       '&hashtag=' + (hashtag || hashtags || '')
            //     )
            //     break;
            //   }
            //   case 'whatsapp': {
            //     window.open((isDesktop ? 'https://api.whatsapp.com/send?text=' : 'whatsapp://send?text=') + encodeURIComponent(text + '\n' + url));
            //     break;
            //   }
            //   case 'twitter': {
            //     window.open(
            //       `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags || ''}&via=${via ? encodeURIComponent(via) : ''}`
            //     );
            //     break;
            //   }
            //   case 'linkedin': {
            //     window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${title}&summary=${text}&source=LinkedIn`);
            //     break;
            //   }
            //   case 'telegram': {
            //     window.open((isDesktop ? 'https://telegram.me/share/msg?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text) : 'tg://msg?text=' + payload));
            //     break;
            //   }
            //   case 'pinterest': {
            //     window.open('https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(url) + '&description=' + encodeURIComponent(text) + '&media=' + image);
            //     break;
            //   }
            // }
            resolve();
            closeShareUI();
          });
        });
        container.querySelector('.shareAPIPolyfill-footer').addEventListener('click', closeShareUI);
      }
    });


    //todo open popup for share
  }

  /**
   * This function is called by the share dialog thing, and is what actually triggers the ShareTarget action
   * @param name
   * @param data
   * @param options
   * @returns {*}
   */
  shareTo(name, data, options) {

    try {
      let target = this._registeredTargets.find(t => t.name == name)
      return target.share(data, options);
    } catch (e) {
      console.error(e)
      throw new DOMException("Failed To Share To Target It doesnt exist, is miss-configured or was passed bad data: " + name + '  data: ' + JSON.stringify(data))
    }
  }

  /**
   * https://web.dev/web-share-target/
   * Register a posible url if the one you want is not provided
   * @param {ShareTarget} shareTarget - an instance of share target object see docs;
   */
  registerShareTarget(shareTarget) {

    //todo figure out where the best place to do the validation probably the constructor not here
    this._registeredTargets.push(shareTarget);
  }

}


/**
 * This will setup the polyfill with default options. So it will only use the polyfill if navigator.share does not exist
 *
 * You can still use sharePolyfill.share();
 *
 * or initalize with sharePolyfill = new SharePolyfill({forcePolyfill:true});
 *
 * equivalently navigator.share = sharePolyfill.share;
 *
 * happy hacking
 * @type {SharePolyfill}
 *
 * @example
 *
 * //minimal
 * navigator.share({
 *   title: 'SGOL'
 *   text: 'One For all All For One'
 *   url: 'https://sharedgoalof.life'
 * })
 *
 * //advanced
 * sharePolyfill.
 *
 *
 */
var sharePolyfill = new SharePolyfill();


// navigator.share = navigator.share || sharePolyfill.share();

//TODO convert all of these
// need to be individualy re-tested and added to defaults.


/*

  // Cleaned up icons from material UI and Fontawsome
  // Colors pallete https://www.materialui.co/colors/grey/500
  // Icon Colors from https://brandcolors.net
  const icon = {
    'share': mac ? '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g><path fill="#424242" d="M381.9,181l95.8-95.8v525.9c0,13.4,8.9,22.3,22.3,22.3c13.4,0,22.3-8.9,22.3-22.3V85.2l95.8,95.8c4.5,4.5,8.9,6.7,15.6,6.7c6.7,0,11.1-2.2,15.6-6.7c8.9-8.9,8.9-22.3,0-31.2L515.6,16.1c-2.2-2.2-4.5-4.5-6.7-4.5c-4.5-2.2-11.1-2.2-17.8,0c-2.2,2.2-4.5,2.2-6.7,4.5L350.7,149.8c-8.9,8.9-8.9,22.3,0,31.2C359.6,190,373,190,381.9,181z M812,276.9H633.7v44.6H812v624H188v-624h178.3v-44.6H188c-24.5,0-44.6,20.1-44.6,44.6v624c0,24.5,20.1,44.6,44.6,44.6h624c24.5,0,44.6-20.1,44.6-44.6v-624C856.6,296.9,836.5,276.9,812,276.9z"/></g></svg>' : '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="#424242" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>',
    'email': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0z"/><path fill="#424242" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/></svg>',
    'copy': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#424242" d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"></path></svg>',
    'print': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#424242" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
    'sms': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#424242" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>',
    'messenger': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#0084ff" d="M224 32C15.9 32-77.5 278 84.6 400.6V480l75.7-42c142.2 39.8 285.4-59.9 285.4-198.7C445.8 124.8 346.5 32 224 32zm23.4 278.1L190 250.5 79.6 311.6l121.1-128.5 57.4 59.6 110.4-61.1-121.1 128.5z"></path></svg>',
    'facebook': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#3b5998" d="M448 56.7v398.5c0 13.7-11.1 24.7-24.7 24.7H309.1V306.5h58.2l8.7-67.6h-67v-43.2c0-19.6 5.4-32.9 33.5-32.9h35.8v-60.5c-6.2-.8-27.4-2.7-52.2-2.7-51.6 0-87 31.5-87 89.4v49.9h-58.4v67.6h58.4V480H24.7C11.1 480 0 468.9 0 455.3V56.7C0 43.1 11.1 32 24.7 32h398.5c13.7 0 24.8 11.1 24.8 24.7z"></path></svg>',
    'whatsapp': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#075e54" d="M224 122.8c-72.7 0-131.8 59.1-131.9 131.8 0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6 49.9-13.1 4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8 0-35.2-15.2-68.3-40.1-93.2-25-25-58-38.7-93.2-38.7zm77.5 188.4c-3.3 9.3-19.1 17.7-26.7 18.8-12.6 1.9-22.4.9-47.5-9.9-39.7-17.2-65.7-57.2-67.7-59.8-2-2.6-16.2-21.5-16.2-41s10.2-29.1 13.9-33.1c3.6-4 7.9-5 10.6-5 2.6 0 5.3 0 7.6.1 2.4.1 5.7-.9 8.9 6.8 3.3 7.9 11.2 27.4 12.2 29.4s1.7 4.3.3 6.9c-7.6 15.2-15.7 14.6-11.6 21.6 15.3 26.3 30.6 35.4 53.9 47.1 4 2 6.3 1.7 8.6-1 2.3-2.6 9.9-11.6 12.5-15.5 2.6-4 5.3-3.3 8.9-2 3.6 1.3 23.1 10.9 27.1 12.9s6.6 3 7.6 4.6c.9 1.9.9 9.9-2.4 19.1zM400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM223.9 413.2c-26.6 0-52.7-6.7-75.8-19.3L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5 29.9 30 47.9 69.8 47.9 112.2 0 87.4-72.7 158.5-160.1 158.5z"></path></svg>',
    'twitter': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#1da1f2" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path></svg>',
    'linkedin': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#0077b5" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"></path></svg>',
    'telegram': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="#0088cc" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"></path></svg>',
    'skype': '<svg class="the-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#00aff0" d="M424.7 299.8c2.9-14 4.7-28.9 4.7-43.8 0-113.5-91.9-205.3-205.3-205.3-14.9 0-29.7 1.7-43.8 4.7C161.3 40.7 137.7 32 112 32 50.2 32 0 82.2 0 144c0 25.7 8.7 49.3 23.3 68.2-2.9 14-4.7 28.9-4.7 43.8 0 113.5 91.9 205.3 205.3 205.3 14.9 0 29.7-1.7 43.8-4.7 19 14.6 42.6 23.3 68.2 23.3 61.8 0 112-50.2 112-112 .1-25.6-8.6-49.2-23.2-68.1zm-194.6 91.5c-65.6 0-120.5-29.2-120.5-65 0-16 9-30.6 29.5-30.6 31.2 0 34.1 44.9 88.1 44.9 25.7 0 42.3-11.4 42.3-26.3 0-18.7-16-21.6-42-28-62.5-15.4-117.8-22-117.8-87.2 0-59.2 58.6-81.1 109.1-81.1 55.1 0 110.8 21.9 110.8 55.4 0 16.9-11.4 31.8-30.3 31.8-28.3 0-29.2-33.5-75-33.5-25.7 0-42 7-42 22.5 0 19.8 20.8 21.8 69.1 33 41.4 9.3 90.7 26.8 90.7 77.6 0 59.1-57.1 86.5-112 86.5z"></path></svg>',
    'pinterest': '<svg class="the-icon" width="256px" height="256px" viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid"><path d="M0,128.002 C0,180.416 31.518,225.444 76.619,245.241 C76.259,236.303 76.555,225.573 78.847,215.848 C81.308,205.457 95.317,146.1 95.317,146.1 C95.317,146.1 91.228,137.927 91.228,125.848 C91.228,106.879 102.222,92.712 115.914,92.712 C127.557,92.712 133.182,101.457 133.182,111.929 C133.182,123.633 125.717,141.14 121.878,157.355 C118.671,170.933 128.686,182.008 142.081,182.008 C166.333,182.008 182.667,150.859 182.667,113.953 C182.667,85.899 163.772,64.901 129.405,64.901 C90.577,64.901 66.388,93.857 66.388,126.201 C66.388,137.353 69.676,145.217 74.826,151.307 C77.194,154.104 77.523,155.229 76.666,158.441 C76.052,160.796 74.642,166.466 74.058,168.713 C73.206,171.955 70.579,173.114 67.649,171.917 C49.765,164.616 41.436,145.031 41.436,123.015 C41.436,86.654 72.102,43.054 132.918,43.054 C181.788,43.054 213.953,78.418 213.953,116.379 C213.953,166.592 186.037,204.105 144.887,204.105 C131.068,204.105 118.069,196.635 113.616,188.15 C113.616,188.15 106.185,217.642 104.611,223.337 C101.897,233.206 96.585,243.07 91.728,250.758 C103.24,254.156 115.401,256.007 128.005,256.007 C198.689,256.007 256.001,198.698 256.001,128.002 C256.001,57.309 198.689,0 128.005,0 C57.314,0 0,57.309 0,128.002 Z" fill="#CB1F27"></path></svg>'
  }

      const configs = {
        ...{
          copy: true,
          print: true,
          email: true,
          sms: true,
          messenger: true,
          facebook: true,
          whatsapp: true,
          twitter: true,
          linkedin: true,
          telegram: true,
          skype: false,
          pinterest: false,
          language: 'en'
        }, ...configurations
      };


          tool.addEventListener('click', event => {
            const payload = encodeURIComponent(text + ': ' + url);
            switch (tool.dataset.tool) {
              case 'copy': {
                navigator.clipboard.writeText(`${title}\n${data.text || ''}\n${url}`);
                break;
              }
              case 'print': {
                // to ensure it has been closed and the user has a clean view of the page
                setTimeout(_ => {
                  self.print();
                }, 500);
                break;
              }
              case 'email': {
                // %0D%0A is newline
                const emailText = `${encodeURIComponent(text)}%0D%0A`
                const mailto = `mailto:?subject=${title}&body=${emailText}${encodeURIComponent(url)}`
                window.open(mailto);
                break;
              }
              case 'sms': {
                location.href = `sms:${language.selectSms}?&body=${encodeURIComponent(title)}: ${encodeURIComponent(data.text || '')} ${url}`;
                break;
              }
              case 'messenger': {
                window.open(
                  'http://www.facebook.com/dialog/send?' +
                  'app_id=' + fbId +
                  '&display=popup' +
                  '&href=' + encodeURIComponent(url) +
                  '&link=' + encodeURIComponent(url) +
                  '&redirect_uri=' + encodeURIComponent(url) +
                  '&quote=' + encodeURIComponent(text)
                );
                break;
              }
              case 'facebook': {
                window.open(
                  'https://www.facebook.com/sharer/sharer.php?' +
                  'u=' + encodeURIComponent(url) +
                  '&quote=' + encodeURIComponent(text) +
                  '&hashtag=' + (hashtag || hashtags || '')
                )
                break;
              }
              case 'whatsapp': {
                window.open((isDesktop ? 'https://api.whatsapp.com/send?text=' : 'whatsapp://send?text=') + encodeURIComponent(text + '\n' + url));
                break;
              }
              case 'twitter': {
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags || ''}&via=${via ? encodeURIComponent(via) : ''}`
                );
                break;
              }
              case 'linkedin': {
                window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${title}&summary=${text}&source=LinkedIn`);
                break;
              }
              case 'telegram': {
                window.open((isDesktop ? 'https://telegram.me/share/msg?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text) : 'tg://msg?text=' + payload));
                break;
              }
              case 'pinterest': {
                window.open('https://pinterest.com/pin/create/button/?url=' + encodeURIComponent(url) + '&description=' + encodeURIComponent(text) + '&media=' + image);
                break;
              }
            }
            resolve();
            closeShareUI();
          });
        });
        container.querySelector('.shareAPIPolyfill-footer').addEventListener('click', closeShareUI);
      }
    });
  };
}());

*/

// All Social Media Sites
// -------------------------------------------------
//https://github.com/bradvin/social-share-urls
// All Social Media Sites ~ Nice Names
// -------------------------------------------------
//
// function GetSocialMediaSites_NiceNames() {
//   return {
//     'add.this': 'AddThis',
//     'blogger': 'Blogger',
//     'buffer': 'Buffer',
//     'diaspora': 'Diaspora',
//     'douban': 'Douban',
//     'email': 'EMail',
//     'evernote': 'EverNote',
//     'getpocket': 'Pocket',
//     'facebook': 'FaceBook',
//     'flattr': 'Flattr',
//     'flipboard': 'FlipBoard',
//     'google.bookmarks': 'GoogleBookmarks',
//     'instapaper': 'InstaPaper',
//     'line.me': 'Line.me',
//     'linkedin': 'LinkedIn',
//     'livejournal': 'LiveJournal',
//     'gmail': 'GMail',
//     'hacker.news': 'HackerNews',
//     'ok.ru': 'OK.ru',
//     'pinterest': 'Pinterest',
//     'qzone': 'QZone',
//     'reddit': 'Reddit',
//     'renren': 'RenRen',
//     'skype': 'Skype',
//     'sms': 'SMS',
//     'surfingbird.ru': 'SurfingBird.ru',
//     'telegram.me': 'Telegram.me',
//     'threema': 'Threema',
//     'tumblr': 'Tumblr',
//     'twitter': 'Twitter',
//     'vk': 'VK',
//     'weibo': 'Weibo',
//     'whatsapp': 'WhatsApp',
//     'xing': 'Xing',
//     'yahoo': 'Yahoo',
//   };
// }
//
// // Social Media Sites With Share Links
// // -------------------------------------------------
// function GetSocialMediaSites_WithShareLinks_OrderedByPopularity() {
//   return [
//     'google.bookmarks',
//     'facebook',
//     'reddit',
//     'whatsapp',
//     'twitter',
//     'linkedin',
//     'tumblr',
//     'pinterest',
//     'blogger',
//     'livejournal',
//     'evernote',
//     'add.this',
//     'getpocket',
//     'hacker.news',
//     'buffer',
//     'flipboard',
//     'instapaper',
//     'surfingbird.ru',
//     'flattr',
//     'diaspora',
//     'qzone',
//     'vk',
//     'weibo',
//     'ok.ru',
//     'douban',
//     'xing',
//     'renren',
//     'threema',
//     'sms',
//     'line.me',
//     'skype',
//     'telegram.me',
//     'email',
//     'gmail',
//     'yahoo',
//   ];
// }
//
// function GetSocialMediaSites_WithShareLinks_SyonPreferred() {
//   return [
//     'google.bookmarks',
//     'telegram.me',
//     'email',
//     'gmail',
//     'yahoo',
//     'sms',
//     'whatsapp',
//     'twitter',
//     'facebook',
//     'linkedin',
//     'threema',
//     'line.me',
//     'skype',
//     'reddit',
//     'tumblr',
//     // 'pinterest',
//     // 'blogger',
//     // 'livejournal',
//     // 'evernote',
//     // 'add.this',
//     // 'getpocket',
//     // 'hacker.news',
//     // 'buffer',
//     //
//     //
//     //
//     // 'instapaper',
//   ];
// }
//
// function GetSocialMediaSites_WithShareLinks_OrderedByAlphabet() {
//   const nice_names = GetSocialMediaSites_NiceNames();
//
//   return Object.keys(nice_names);
// }
//
// // Social Media Site Links With Share Links
// // -------------------------------------------------
// function GetSocialMediaSiteLinks_WithShareLinks(args) {
//   const validargs = [
//     'url',
//     'title',
//     'image',
//     'desc',
//     'appid',
//     'redirecturl',
//     'via',
//     'hashtags',
//     'provider',
//     'language',
//     'userid',
//     'category',
//     'phonenumber',
//     'emailaddress',
//     'cemailaddress',
//     'bccemailaddress',
//   ];
//
//   for (var i = 0; i < validargs.length; i++) {
//     const validarg = validargs[i];
//     if (!args[validarg]) {
//       args[validarg] = '';
//     }
//   }
//
//   const url = fixedEncodeURIComponent(args.url);
//   const title = fixedEncodeURIComponent(args.title);
//   const image = fixedEncodeURIComponent(args.image);
//   const desc = fixedEncodeURIComponent(args.desc);
//   const app_id = fixedEncodeURIComponent(args.appid);
//   const redirect_url = fixedEncodeURIComponent(args.redirecturl);
//   const via = fixedEncodeURIComponent(args.via);
//   const hash_tags = fixedEncodeURIComponent(args.hashtags);
//   const provider = fixedEncodeURIComponent(args.provider);
//   const language = fixedEncodeURIComponent(args.language);
//   const user_id = fixedEncodeURIComponent(args.userid);
//   const category = fixedEncodeURIComponent(args.category);
//   const phone_number = fixedEncodeURIComponent(args.phonenumber);
//   const email_address = fixedEncodeURIComponent(args.emailaddress);
//   const cc_email_address = fixedEncodeURIComponent(args.ccemailaddress);
//   const bcc_email_address = fixedEncodeURIComponent(args.bccemailaddress);
//
//   var text = title;
//
//   if (desc) {
//     text += '%20%3A%20';	// This is just this, " : "
//     text += desc;
//   }
//
//   return {
//     'add.this': 'http://www.addthis.com/bookmark.php?url=' + url,
//     'blogger': 'https://www.blogger.com/blog-this.g?u=' + url + '&n=' + title + '&t=' + desc,
//     'buffer': 'https://buffer.com/add?text=' + text + '&url=' + url,
//     'diaspora': 'https://share.diasporafoundation.org/?title=' + title + '&url=' + url,
//     'douban': 'http://www.douban.com/recommend/?url=' + url + '&title=' + text,
//     'email': 'mailto:' + email_address + '?subject=' + title + '&body=' + desc,
//     'evernote': 'https://www.evernote.com/clip.action?url=' + url + '&title=' + text,
//     'getpocket': 'https://getpocket.com/edit?url=' + url,
//     'facebook': 'http://www.facebook.com/sharer.php?u=' + url,
//     'flattr': 'https://flattr.com/submit/auto?user_id=' + user_id + '&url=' + url + '&title=' + title + '&description=' + text + '&language=' + language + '&tags=' + hash_tags + '&hidden=HIDDEN&category=' + category,
//     'flipboard': 'https://share.flipboard.com/bookmarklet/popout?v=2&title=' + text + '&url=' + url,
//     'gmail': 'https://mail.google.com/mail/?view=cm&to=' + email_address + '&su=' + title + '&body=' + url + '&bcc=' + bcc_email_address + '&cc=' + cc_email_address,
//     'google.bookmarks': 'https://www.google.com/bookmarks/mark?op=edit&bkmk=' + url + '&title=' + title + '&annotation=' + text + '&labels=' + hash_tags + '',
//     'instapaper': 'http://www.instapaper.com/edit?url=' + url + '&title=' + title + '&description=' + desc,
//     'line.me': 'https://lineit.line.me/share/ui?url=' + url + '&text=' + text,
//     'linkedin': 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
//     'livejournal': 'http://www.livejournal.com/update.bml?subject=' + text + '&event=' + url,
//     'hacker.news': 'https://news.ycombinator.com/submitlink?u=' + url + '&t=' + title,
//     'ok.ru': 'https://connect.ok.ru/dk?st.cmd=WidgetSharePreview&st.shareUrl=' + url,
//     'pinterest': 'http://pinterest.com/pin/create/button/?url=' + url,
//     'qzone': 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=' + url,
//     'reddit': 'https://reddit.com/submit?url=' + url + '&title=' + title,
//     'renren': 'http://widget.renren.com/dialog/share?resourceUrl=' + url + '&srcUrl=' + url + '&title=' + text + '&description=' + desc,
//     'skype': 'https://web.skype.com/share?url=' + url + '&text=' + text,
//     'sms': 'sms:' + phone_number + '?body=' + text,
//     'surfingbird.ru': 'http://surfingbird.ru/share?url=' + url + '&description=' + desc + '&screenshot=' + image + '&title=' + title,
//     'telegram.me': 'https://t.me/share/url?url=' + url + '&text=' + text + '&to=' + phone_number,
//     'threema': 'threema://compose?text=' + text + '&id=' + user_id,
//     'tumblr': 'https://www.tumblr.com/widgets/share/tool?canonicalUrl=' + url + '&title=' + title + '&caption=' + desc + '&tags=' + hash_tags,
//     'twitter': 'https://twitter.com/intent/tweet?url=' + url + '&text=' + text + '&via=' + via + '&hashtags=' + hash_tags,
//     'vk': 'http://vk.com/share.php?url=' + url + '&title=' + title + '&comment=' + desc,
//     'weibo': 'http://service.weibo.com/share/share.php?url=' + url + '&appkey=&title=' + title + '&pic=&ralateUid=',
//     'whatsapp': 'https://api.whatsapp.com/send?text=' + text + '%20' + url,
//     'xing': 'https://www.xing.com/spi/shares/new?url=' + url,
//     'yahoo': 'http://compose.mail.yahoo.com/?to=' + email_address + '&subject=' + title + '&body=' + text,
//   };
// }
