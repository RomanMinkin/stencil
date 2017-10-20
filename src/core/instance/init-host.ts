import { attributeChangedCallback } from './attribute-changed';
import { ComponentMeta, HostElement, PlatformApi } from '../../util/interfaces';
import { connectedCallback } from './connected';
import { disconnectedCallback } from './disconnected';
import { initLoad } from './init-component';
import { proxyHostElementPrototype } from './proxy';
import { queueUpdate } from './update';
import { render } from './render';


export function initHostConstructor(plt: PlatformApi, cmpMeta: ComponentMeta, HostElementConstructor: HostElement, hydratedCssClass?: string) {
  // let's wire up our functions to the host element's prototype
  // we can also inject our platform into each one that needs that api
  // note: these cannot be arrow functions cuz "this" is important here hombre

  HostElementConstructor.connectedCallback = function() {
    // coolsville, our host element has just hit the DOM
    connectedCallback(plt, cmpMeta, (this as HostElement));
  };

  HostElementConstructor.attributeChangedCallback = function(attribName: string, oldVal: string, newVal: string) {
    // the browser has just informed us that an attribute
    // on the host element has changed
    attributeChangedCallback(cmpMeta, (this as HostElement), attribName, oldVal, newVal);
  };

  HostElementConstructor.disconnectedCallback = function() {
    // the element has left the builing
    disconnectedCallback(plt, (this as HostElement));
  };

  HostElementConstructor.componentOnReady = function(cb: (elm: HostElement) => void) {
    let promise: Promise<any>;
    if (!cb) {
      promise = new Promise(resolve => {
        cb = resolve;
      });
    }
    componentOnReady((this as HostElement), cb);
    return promise;
  };

  HostElementConstructor._queueUpdate = function() {
    queueUpdate(plt, (this as HostElement));
  };

  HostElementConstructor.$initLoad = function() {
    initLoad(plt, (this as HostElement), hydratedCssClass);
  };

  HostElementConstructor._render = function(isInitialRender: boolean) {
    render(plt, (this as HostElement), plt.getComponentMeta((this as HostElement)), isInitialRender);
  };

  if (cmpMeta.membersMeta) {
    // add getters/setters to the host element members
    // these would come from the @Prop and @Method decorators that
    // should create the public API to this component
    proxyHostElementPrototype(plt, cmpMeta.membersMeta, HostElementConstructor);
  }
}


function componentOnReady(elm: HostElement, cb: (elm: HostElement) => void) {
  if (!elm._hasDestroyed) {
    if (elm._hasLoaded) {
      cb(elm);
    } else {
      (elm._onReadyCallbacks = elm._onReadyCallbacks || []).push(cb);
    }
  }
}
