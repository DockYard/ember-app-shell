/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const critical = require('critical');
const chromeLauncher = require('chrome-launcher');
const chromeInterface = require('chrome-remote-interface');
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const envTarget = process.env.DEPLOY_TARGET || EmberApp.env();
const stringUtil = require('ember-cli-string-utils');

const DEFAULT_OPTIONS = {
  visitPath: '/app-shell',
  outputFile: 'index.html',
  disableSandbox: false
};

const DEFAULT_CRITICAL_OPTIONS = {
  minify: true
}

const PLACEHOLDER = '<!-- EMBER_APP_SHELL_PLACEHOLDER -->';

const SERVER_PORT = process.env.APP_SHELL_EXPRESS_PORT || '4321';

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

          const url = path.join(`http://localhost:${SERVER_PORT}`, visitPath);

          const navigate = Page.enable()
            .then(() => Page.navigate({ url }))
            .then(() => Page.loadEventFired());

          return navigate
            .then(() => Runtime.evaluate({ awaitPromise: true, expression: `
              ${this._appGlobal()}.visit('${visitPath}')
                .then((application) => {
                  return document.body.querySelector('.ember-view').outerHTML;
                });
            `}))
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

  _launchAppServer(directory) {
    return new Promise((resolve, reject) => {
      let app = express();
      let server = http.createServer(app);
      app.use(express.static(directory));
      app.get('*', function (req, res) {
        res.sendFile('/index.html', { root: directory });
      });

      server.listen(SERVER_PORT, () => {
        resolve(server);
      });
    });
  },

  _launchChrome() {
    let { disableSandbox } = this.app.options['ember-app-shell']

    let chromeFlags = [
      '--disable-gpu',
      '--headless',
      ...(disableSandbox ? ['--no-sandbox'] : [])
    ]

    return chromeLauncher.launch({ chromeFlags }).then(chrome => {
      return chromeInterface({ port: chrome.port }).then((client) => {
        return { client, chrome };
      });
    });
  },

  _appGlobal() {
    let config = require(path.join(this.app.project.root, 'config/environment'))(envTarget);

    var value = config.exportApplicationGlobal;

    if (typeof value === 'string') {
      return value;
    } else {
      return stringUtil.classify(config.modulePrefix);
    }
  }
};
