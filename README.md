# Share API Polyfill

This is a (30kb) polyfill for the `Web Share API` that can be used in desktop too, so your users can share in their twitter, facebook, messenger, linkedin, sms, e-mail, print, telegram or whatsapp.

It also supports multilanguage ([see the list of languages](#multi-language) and you can help us with that :) ).

This is a very simple, single file import polyfill. Simply include it in your project and use the native share api.

![JavaScript Share API Polyfill in a Browser](https://github.com/syonfox/share-api-polyfill/blob/master/demo/demo.gif?raw=true)  
[(original/legacy) see the share api polyfill in action](https://syonfox.github.io/share-api-polyfill/demo/)

# 

New demos/ site

[New Demo Page](https://syonfox.github.io/share-api-polyfill/demo)

[New Docs Page](https://syonfox.github.io/share-api-polyfill/docs)
## Installing it:

Just import it like so:

### legacy import (no ShareTarget)
```html
<script src="https://unpkg.com/share-api-polyfill/dist/share-min.js"></script>
```

> Note that we are using the unpkg cdn to load it, you could also save it in your own structure so you can cache it with service workers and have it "close" to your own domain.

You can also install it using npm:

```sh

npm install git+https://github.com/syonfox/share-api-polyfill.git

#todo merge or deploy to npm @syonfox:SharePolyfill
npm install share-api-polyfill --save

# or
yarn add share-api-polyfill
```

Now, it will use the native share panel if it is available (only available on mobile devices) and, if not, it will enable an HTML structure in your page showing options for your users.

Here, check this demo and see the [original (legacy) share api polyfill in action](https://syonfox.github.io/share-api-polyfill/demo/).

## The Share API

I have created a version of this polyfill that creates 2 classes SharePolyfill and ShareTarget  this by default acts as a polyfill in addition to providing a default instance `sharePolyfill`

end users may then add more share targets by creating one and calling
`sharePolyfill.registerShareTarget()`

[docs ShareTarget](https://syonfox.github.io/share-api-polyfill/docs/ShareTarget.html)


if a user would like to disable native sharing they can ether reinitialize like so
`shareTarget = newShareTarget({forcePolyfill:true})`
alternatively one could simply override the share function
`navigator.share = sharePolyfill.share`


The official share api works like this:

```js
navigator.share({
  title: 'Web Share API Polyfill',
  text: 'A polyfill for the Share API. Use it to share in both desktops and mobile devices.',
  url: location.href
})
.then( _ => console.log('Yay, you shared it :)'))
.catch( error => console.log('Oh noh! You couldn\'t share it! :\'(\n', error));
```

But in this case, you can also pass your `Facebook App Id` to enable sharing with **messenger**.
Also, you can pass in a list of hash_tags to be used when sharing with twitter or facebook. Only one hashtag can be shared with facebook so the first one in the list will be shared.

[See the docs on ShareTarget](https://syonfox.github.io/share-api-polyfill/docs/ShareTarget.html)
For more information on extended capabilities


```js
navigator.share({
  title: 'Web Share API Polyfill',
  text: 'A polyfill for the Share API. Use it to share in both desktops and mobile devices.',
  url: location.href,

  // extra, optional options
  app_id: '123456789123456',// required for mesanger
  hash_tags: ['javascript', 'shareAPI', 'Polyfill'],
  via: 'tweiter_username',
  desc: 'basical text',
  email_address, cc_email_address, bcc_email_address, phone_number,
  // redirect... etc the idea is you should be able to do anything
  
})
.then( _ => console.log('Yay, you shared it :)'))
.catch( error => console.log('Oh noh! You couldn\'t share it! :\'(\n', error));
```
> You can disable a ShareTarget by setting its name === false in the share options 

> You can pass the hash_tags as a single (comma separated) string, or as an array.

### Multi language

It will try and use the supported languages based on user's `browser language` configuration.  
If the language is not found, it will use a fallback (default english).

Currently, supported languages:

- cs
- de
- it
- da
- en
- es
- fr
- hu
- is
- ja
- ko
- nl
- ta
- pl
- pt
- ru
- sv
- sk
- tr
- zh

> Feel free to contribute with more languages sending Pull Requests for them :)

### Turning features off, in Desktop

You can disable some of the social buttons from the tool by passing a second object as argument.  
As your mobile device will probably have native support for the share API, it will be ignored, being applied only for desktops.

Example:

```js
navigator.share({
  title: 'Web Share API Polyfill',
  text: 'A polyfill for the Share API. Use it to share in both desktops and mobile devices.',
  url: location.href,

    fbId: '123456789123456',
    hashtags: 'javascript,shareAPI,polyfill'
  },
  {
    // change this configurations to hide specific unnecessary icons
    copy: true,
    email: true,
    print: true,
    sms: true,
    messenger: true,
    facebook: true,
    whatsapp: true,
    twitter: true,
    linkedin: true,
    telegram: true,
    skype: true,
    pinterest: true,
    language: 'pt' // specify the default language
  }
)
  .then( _ => console.log('Yay, you shared it :)'))
  .catch( error => console.log('Oh noh! You couldn\'t share it! :\'(\n', error));
```

  > If you disable Skype, it will no longer load Skype's SDK, what might be something you want, in case you would like to improve the privacy in your project, avoiding loading **third party libraries**.

## It's open source

Yup, it's open source and you can contribute to it :)

Please refer to our [CONTRIBUTING.md](https://github.com/syonfox/share-api-polyfill/blob/master/CONTRIBUTING.md) and help us improve this tool.

To re-build id, just install the dependencies:

```sh
npm install
```

And build it with gulp

```sh
npm run build
```

And try it locally

```sh
npm run demo
```


And build the docs
```sh
npm run docs
```

Also, if you need to change the icons, they are SVGs located on the share.js script.
You will find the oridinal vector (.svg) in the src/icons directory in case you want to change it and copy the svg code.
I have added a few more icons, but sadly bookmarks don't work without a extension.
Help wanted for a more flexible icon system. but i ❤️ svg so.

## Donate ❤️

Buy us a coffee :)

BTC: 1GuTME1bGbk7hY7ssrUBh3M1k4AeyVCSjW<br/>
ETH: 0x49f1612d4a8e9165f2eb94be79af9dbbf3815af5


