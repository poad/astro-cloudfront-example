import { createStore, reconcile } from 'solid-js';
import { createComponent, generateHydrationScript, NoHydration, renderToString, renderToStream as renderToStringAsync, ssr, Loading as Suspense } from '@solidjs/web';

const slotName = (str: string) => str.trim().replace(/[-_]([a-z])/g, (_: string, w: string) => w.toUpperCase());

const escapeSlotName = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface CheckContext {
  result?: unknown;
}

async function check(
  this: CheckContext,
  Component: unknown,
  props: Record<string, unknown>,
  children: unknown,
): Promise<boolean> {
  if (typeof Component !== 'function') return false;
  if ((Component as { name?: string }).name === 'QwikComponent') return false;
  const componentStr = (Component as { toString(): string }).toString();
  if (componentStr.includes('$$payload') || componentStr.includes('$$renderer')) return false;
  let html: unknown;
  try {
    const result = await (renderToStaticMarkup as unknown as (
      this: unknown,
      Component: unknown,
      props: Record<string, unknown>,
      children: unknown,
      metadata: { renderStrategy: string },
    ) => Promise<{ html: string }>)(this, Component, props, children, { renderStrategy: 'sync' });
    html = result.html;
  } catch {}
  return typeof html === 'string';
}

async function renderToStaticMarkup(
  this: CheckContext,
  Component: unknown,
  props: Record<string, unknown>,
  slots: Record<string, unknown>,
  metadata: { hydrate?: boolean; astroStaticSlot?: boolean; renderStrategy?: string },
): Promise<{ attrs: Record<string, string>; html: string }> {
  const renderId = metadata?.hydrate ? '' : '';
  const needsHydrate = metadata?.astroStaticSlot ? !!metadata.hydrate : true;
  const tagName = needsHydrate ? 'astro-slot' : 'astro-static-slot';
  const renderStrategy = metadata?.renderStrategy ?? 'async';
  const renderFn = () => {
    const childSlots: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(slots)) {
      const name = slotName(key);
      childSlots[name] = ssr(`<${tagName} name="${escapeSlotName(name)}">${value}</${tagName}>`);
    }
    const newProps: Record<string, unknown> = {
      ...props,
      ...childSlots,
      children: (slots as { children?: unknown }).children,
    };
    if (renderStrategy === 'sync') {
      return createComponent(Component, newProps);
    }
    if (needsHydrate) {
      return createComponent(Suspense as never, {
        get children() {
          return createComponent(Component, newProps);
        },
      });
    }
    return createComponent(NoHydration as never, {
      get children() {
        return createComponent(Suspense as never, {
          get children() {
            return createComponent(Component, newProps);
          },
        });
      },
    });
  };
  const componentHtml = renderStrategy === 'async' ? await renderToStringAsync(renderFn, { renderId }) : renderToString(renderFn, { renderId });
  return {
    attrs: { 'data-solid-render-id': renderId },
    html: componentHtml,
  };
}

const renderer = {
  name: '@astrojs/solid',
  check,
  renderToStaticMarkup,
  supportsAstroStaticSlot: true,
  renderHydrationScript: () => generateHydrationScript(),
};

export default renderer;
export { renderToStringAsync, createComponent, generateHydrationScript, NoHydration, renderToString, ssr, Suspense };
export { createStore, reconcile };
