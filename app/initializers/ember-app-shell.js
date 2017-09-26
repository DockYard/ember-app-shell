import $ from 'jquery';

export function initialize(application) {
  let rootElement = $(application.rootElement);
  if (rootElement.hasClass('ember-application')) {
    rootElement.removeClass('ember-application');
  }
}

export default { initialize };

