import { Loading as Suspense } from '@solidjs/web';
import { createComponent, hydrate, render } from '@solidjs/web';
import { createStore, reconcile } from 'solid-js';

const alreadyInitializedElements = new WeakMap();

const renderer = (element: Element) => (Component: unknown, props: unknown, slotted: Record<string, string>, context: { client?: string }) => {
  if (!(element as HTMLElement).hasAttribute('ssr')) return;
  const isHydrate = context.client !== 'only';
  let slot: Element | undefined;
  const _slots: Record<string, Element> = {};
  if (Object.keys(slotted).length > 0) {
    if (context.client !== 'only') {
      const iterator = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, (node) => {
        if (node === element) return NodeFilter.FILTER_SKIP;
        if (node.nodeName === 'ASTRO-SLOT') return NodeFilter.FILTER_ACCEPT;
        if (node.nodeName === 'ASTRO-ISLAND') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_SKIP;
      });
      while ((slot = iterator.nextNode())) {
        _slots[slot.getAttribute('name') || 'default'] = slot;
      }
    }
    for (const [key, value] of Object.entries(slotted)) {
      if (_slots[key]) continue;
      const el = document.createElement('astro-slot');
      if (key !== 'default') {
        el.setAttribute('name', key);
      }
      el.innerHTML = value;
      _slots[key] = el;
    }
  }
  const { default: children, ...slots } = _slots as { default?: Element } & Record<string, Element>;
  const renderId = (element as HTMLElement).dataset.solidRenderId;
  if (alreadyInitializedElements.has(element)) {
    alreadyInitializedElements.get(element)(reconcile({ ...(props as object), ...slots, children }));
  } else {
    const [store, setStore] = createStore({
      ...(props as Record<string, unknown>),
      ...slots,
      children,
    });
    alreadyInitializedElements.set(element, setStore);
    const fn = () => {
      const inner = () => createComponent(Component as never, store);
      if (isHydrate) {
        return createComponent(Suspense as never, {
          get children() {
            return inner();
          },
        });
      }
      return inner();
    };
    let dispose: (() => void) | undefined;
    if (isHydrate) {
      dispose = hydrate(fn, element, { renderId });
    } else {
      (element as HTMLElement).innerHTML = '';
      dispose = render(fn, element);
    }
    (element as HTMLElement).addEventListener('astro:unmount', () => dispose?.(), { once: true });
  }
};

const solidRendererFactory = (element: Element) => (Component: unknown, props: unknown, slotted: Record<string, string>, context: { client?: string }) =>
  renderer(element)(Component, props, slotted, context);

export default solidRendererFactory;
