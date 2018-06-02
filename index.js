/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const critical = require('critical');
const puppeteer = require('puppeteer');

const DEFAULT_OPTIONS = {
  visitPath: '/app-shell',
  outputFile: 'index.html',
  chromeFlags: []
};

const DEFAULT_CRITICAL_OPTIONS = {
  minify: true,
};

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
   if (this.app.env === 'test') {
      return;
    }
    let { chromeFlags, outputFile, visitPath, skipCritical, root } = this.app.options['ember-app-shell'];

    return this._launchAppServer(directory, root).then(server => {
      return puppeteer.launch(chromeFlags).then(browser => {
        return browser.newPage().then(page => {
          let url = path.join(`http://localhost:${SERVER_PORT}`, visitPath);
          return page.goto(url).then(() => {
            const appSelector = '.ember-view';
            return page.waitForSelector(appSelector).then(() => {
              return page.evaluate(appSelector => {
                return document.body.querySelector(appSelector).outerHTML;
              }, appSelector).then(content => {
                let indexHTML = fs.readFileSync(path.join(directory, outputFile)).toString();
                let appShellHTML = indexHTML.replace(PLACEHOLDER, content);

                if (skipCritical) {
                  fs.writeFileSync(path.join(directory, outputFile), appShellHTML, 'utf8');
                  return;
                }
                let criticalOptions = Object.assign(DEFAULT_CRITICAL_OPTIONS, {
                  inline: true,
                  base: directory,
                  folder: directory,
                  html: appShellHTML,
                  dest: outputFile
                }, this.app.options['ember-app-shell'].criticalCSSOptions);
                return critical.generate(criticalOptions);
              }).then(() => {
                browser.close();
                server.close();
              },
              (err) => {
                browser.close();
                server.close();
              })
            });
          });
        });
      });
    });
  },

  contentFor(type) {
    if (type === 'body-footer' && this.app.env !== 'test') {
      return PLACEHOLDER;
    }
  },

  _launchAppServer(directory, root) {
    return new Promise((resolve, reject) => {
      let app = express();
      let server = http.createServer(app);
      if (root) {
        app.use(root, express.static(directory));
      } else {
        app.use(express.static(directory));
      }
      app.get('*', function (req, res) {
        res.sendFile('/index.html', { root: directory });
      });

      server.listen(SERVER_PORT, () => {
        resolve(server);
      });
    });
  }

};

