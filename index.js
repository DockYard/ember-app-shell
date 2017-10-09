/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const critical = require('critical');
const chromeLauncher = require('chrome-launcher');
const chromeInterface = require('chrome-remote-interface');

const DEFAULT_OPTIONS = {
  visitPath: '/app-shell',
  outputFile: 'index.html',
  retries: 2
};

const DEFAULT_CRITICAL_OPTIONS = {
  minify: true
}

const PLACEHOLDER = '<!-- EMBER_APP_SHELL_PLACEHOLDER -->';

module.exports = {
  name: 'ember-app-shell',

  included(app) {
    this._super.included && this._super.included.apply(this, arguments);
    this.app = app;
    this.app.options = this.app.options || {};
    this.app.options['ember-app-shell'] = Object.assign({}, DEFAULT_OPTIONS, this.app.options['ember-app-shell']);
  },

  postBuild({ directory }) {
    let { outputFile, visitPath } = this.app.options['ember-app-shell'];

    return this._launchAppServer(directory)
      .then((server) => {
        return this._launchChrome().then(({ client, chrome }) => {
          const { Page, Runtime } = client;

          const kill = () => {
            server.close();
            client.close();
            return chrome.kill();
          }

          const navigate = Page.enable()
            .then(() => Page.navigate({ url: `http://localhost:4321${visitPath}` }))
            .then(() => Page.loadEventFired());

          return navigate
            .then(() => this._getFirstEmberView(Runtime, this.app.options['ember-app-shell'].retries))
            .then((html) => {
              let indexHTML = fs.readFileSync(path.join(directory, 'index.html')).toString();
              let appShellHTML = indexHTML.replace(PLACEHOLDER, html.result.value.toString());
              let criticalOptions = Object.assign(DEFAULT_CRITICAL_OPTIONS, {
                inline: true,
                base: directory,
                folder: directory,
                html: appShellHTML,
                dest: outputFile
              }, this.app.options['ember-app-shell'].criticalCSSOptions);
              return critical.generate(criticalOptions);
            })
            .then(kill, kill);

        });
      });
  },

  contentFor(type) {
    if (type === 'body-footer') {
      return PLACEHOLDER;
    }
  },

  _getFirstEmberView(Runtime, retry) {
    if (retry < 0) {
      throw new Error('Unable to find an `.ember-view` element');
    }

    return Runtime.evaluate({ expression: "document.body.querySelector('.ember-view').outerHTML" })
      .then(result => {
        if (/Cannot read property 'outerHTML' of null/.test(result.result.description)) {
          return new Promise(resolve => setTimeout(resolve, 50))
            .then(() => this._getFirstEmberView(Runtime, retry - 1));
        }

        return result;
      })
  },

  _launchAppServer(directory) {
    return new Promise((resolve, reject) => {
      let app = express();
      let server = http.createServer(app);
      app.use(express.static(directory));
      app.get('*', function (req, res) {
        res.sendFile('/index.html', { root: directory });
      });

      server.listen(4321, () => {
        resolve(server);
      });
    });
  },

  _launchChrome() {
    return chromeLauncher.launch({
      chromeFlags: [ '--disable-gpu', '--headless' ]
    }).then(chrome => {
      return chromeInterface({ port: chrome.port }).then((client) => {
        return { client, chrome };
      });
    });
  }
};
