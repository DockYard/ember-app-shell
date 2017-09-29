// copied from:
// https://github.com/ember-fastboot/ember-cli-fastboot/blob/e05d1a70c3b700102d1a2259b2fafda464773848/app/instance-initializers/clear-double-boot.js
export function initialize(appInstance) {
  if (typeof FastBoot === 'undefined') {
    let originalDidCreateRootView = appInstance.didCreateRootView;

    appInstance.didCreateRootView = function() {
      let elements = document.querySelectorAll(
        appInstance.rootElement + ' .ember-view'
      );
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        element.parentNode.removeChild(element);
      }

      originalDidCreateRootView.apply(appInstance, arguments);
    };
  }
}

export default { name: 'ember-app-shell', initialize };
