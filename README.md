# Text Translation Manager

This application is created to easily manage all translation keys and values needed to localize a website in multiple languages. Unlike i18n, this application works with the translation keys from a repo in Enonic XP, making it possible to update without building a new application and deploying.


## Prerequisites

You need to be on Enonic XP 7.9.2 or higher.

## Installation
Install the app via Enonic market in the applications tool or build it yourself.

### Building
```bash
git clone https://github.com/seeds/text-translation-manager-xp.git
cd text-translation-manager-xp
./gradlew clean build
```
The application jar should be in /build/libs as translationmanager-x.x.x.jar

## How to use
The application includes an admin tool "Text Translation Manager".
This is where you set keys for your sites to use for localization.
The application also needs to be added to the sites that will use the localization keys.
The app exposes a JSON script API with all translation keys to external sources. [YOUR SITE]/api/translate

## Implementation

When installing the application from Enonic Market, translations are done front-end using a specific data tag to inject the translated keys.

In the "Text Translation Manager", add a key to your site, and give it a value, for instance: my.special.label = My label!

To automatically translate this on a component that uses this key we need to add the following data tag to the HTML element you want to localize:

```html
<div data-translate-manager="my.special.label">"My label!" will be inserted here</div>
```
The Enonic Processor included in the app on the site will automatically find what keys are used on the site and include the localized values in a JSON object. When the page loads in your browser, the translate script will find all keys being used and replace innerHTML of any DOM element with the data tag.

## Releases and Compatibility

| Version | XP version   |
| ------- | ------------ |
| 1.0.0  | 7.9.2       |

## License and credits
The application is licensed under the [GNU Affero General Public License](https://github.com/seeds/text-translation-manager-xp/blob/master/LICENSE.txt)
## Thanks
This application was built together with the [Norwegian Directorate of Health](https://www.helsedirektoratet.no). They made the development of this application possible, and allowed us to share it as an open source project. Thank you for sharing!

### This app utilizes the following open source libraries:
- Various libs form [Enonic XP](https://github.com/enonic/xp), License: [GPL 3.0](https://github.com/enonic/xp/blob/master/LICENSE.txt) & [Apache 2.0](https://github.com/enonic/xp/blob/master/LICENSE_AL.txt)
- [Bootstrap](https://github.com/twbs/bootstrap), License: [MIT](https://github.com/twbs/bootstrap/blob/main/LICENSE)
- [Semantic UI](https://github.com/Semantic-Org/Semantic-UI), License: [MIT](https://github.com/Semantic-Org/Semantic-UI/blob/master/LICENSE.md)
- [JSON Java](https://github.com/stleary/JSON-java), License: [Public Domain](https://github.com/stleary/JSON-java/blob/master/LICENSE)
