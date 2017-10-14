import { detachListeners } from './listeners';
import { HostElement, PlatformApi } from '../../util/interfaces';
import { invokeDestroy } from '../renderer/patch';
import { propagateElementLoaded } from './init';
import { _include_did_unload_, _include_custom_slot_ } from '../../util/core-include';


export function disconnectedCallback(plt: PlatformApi, elm: HostElement) {
  // only disconnect if we're not temporarily disconnected
  // tmpDisconnected will happen when slot nodes are being relocated
  if (!plt.tmpDisconnected && isDisconnected(elm)) {

    // ok, let's officially destroy this thing
    // set this to true so that any of our pending async stuff
    // doesn't continue since we already decided to destroy this node
    elm._hasDestroyed = true;

    // double check that we've informed the ancestor host elements
    // that they're good to go and loaded (cuz this one is on its way out)
    propagateElementLoaded(elm);

    const instance = elm.$instance;
    if (instance) {
      // destroy instance stuff
      // if we've created an instance for this

      if (_include_did_unload_) {
        // call the user's componentDidUnload if there is one
        instance.componentDidUnload && instance.componentDidUnload();
      }

      // get outta town
      elm.$instance = instance.__el = instance.__values = instance.__values.__propWillChange = instance.__values.__propDidChange = null;
    }

    // detatch any event listeners that may have been added
    // this will also set _listeners to null if there are any
    detachListeners(elm);

    // destroy the vnode and child vnodes if they exist
    invokeDestroy(elm._vnode);

    if (_include_custom_slot_) {
      if (elm._hostContentNodes) {
        // overreacting here just to reduce any memory leak issues
        elm._hostContentNodes = elm._hostContentNodes.defaultSlot = elm._hostContentNodes.namedSlots = null;
      }
    }

    // fuhgeddaboudit
    // set it all to null to ensure we forget references
    // and reset values incase this node gets reused somehow
    // (possible that it got disconnected, but the node was reused)
    elm.$activeLoading = elm.$connected = elm.$defaultHolder = elm._root = elm._vnode = elm._ancestorHostElement = elm._hasLoaded = elm._isQueuedForUpdate = elm._observer = null;
  }
}


function isDisconnected(elm: HTMLElement) {
  while (elm) {
    if (elm.parentElement === null) {
      return elm.tagName !== 'HTML';
    }
    elm = elm.parentElement;
  }
  return false;
}
