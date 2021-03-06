import assign from 'ember-metal/assign';
import {
  COMPONENT_PATH,
  COMPONENT_HASH,
  isComponentCell,
  mergeInNewHash,
  processPositionalParamsFromCell,
} from  './closure-component';
import lookupComponent from 'ember-htmlbars/utils/lookup-component';
import extractPositionalParams from 'ember-htmlbars/utils/extract-positional-params';

export default {
  setupState(lastState, env, scope, params, hash) {
    let componentPath = getComponentPath(params[0], env);
    return assign({}, lastState, {
      componentPath,
      isComponentHelper: true
    });
  },

  render(morph, ...rest) {
    let state = morph.getState();

    if (state.manager) {
      state.manager.destroy();
    }

    // Force the component hook to treat this as a first-time render,
    // because normal components (`<foo-bar>`) cannot change at runtime,
    // but the `{{component}}` helper can.
    state.manager = null;

    render(morph, ...rest);
  },

  rerender: render
};

function getComponentPath(param, env) {
  let path = env.hooks.getValue(param);
  if (isComponentCell(path)) {
    path = path[COMPONENT_PATH];
  }
  return path;
}

function render(morph, env, scope, [path, ...params], hash, template, inverse, visitor, isRerender=false) {
  let {
    componentPath
  } = morph.getState();

  // If the value passed to the {{component}} helper is undefined or null,
  // don't create a new ComponentNode.
  if (componentPath === undefined || componentPath === null) {
    return;
  }

  path = env.hooks.getValue(path);

  if (isRerender) {
    let result = lookupComponent(env.owner, componentPath);
    let component = result.component;

    extractPositionalParams(null, component, params, hash);
  }

  if (isComponentCell(path)) {
    let closureComponent = env.hooks.getValue(path);

    // This needs to be done in each nesting level to avoid raising assertions
    processPositionalParamsFromCell(closureComponent, params, hash);
    params = [];
    hash = mergeInNewHash(closureComponent[COMPONENT_HASH], hash);
  }

  let templates = { default: template, inverse };
  env.hooks.component(
    morph, env, scope, componentPath,
    params, hash, templates, visitor
  );
}
