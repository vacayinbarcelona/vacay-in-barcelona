'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Renders the reCAPTCHA v2 checkbox via grecaptcha.render() inside a
// useEffect, instead of Google's automatic "scan the page for
// .g-recaptcha divs" behavior. The automatic mode injects an iframe into
// the div as soon as its script loads, which can happen mid-hydration and
// causes a "server HTML did not match" hydration error since React didn't
// put that iframe there. Rendering explicitly, after mount, sidesteps that
// entirely — the container is empty on both server and client render.
//
// Most forms using this submit natively (<form action={serverAction}>), so
// Google's own hidden "g-recaptcha-response" input inside the widget gets
// picked up by FormData automatically — no ref needed. Checkout builds its
// payload in JS instead of a native submit, so it grabs the token
// imperatively via this ref (see RecaptchaWidgetHandle below).

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: { sitekey: string }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
    };
    __onRecaptchaScriptLoad__?: () => void;
  }
}

const SCRIPT_ID = 'recaptcha-script';

export type RecaptchaWidgetHandle = {
  getValue: () => string;
  reset: () => void;
};

export const RecaptchaWidget = forwardRef<RecaptchaWidgetHandle, { siteKey: string }>(function RecaptchaWidget(
  { siteKey },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const widgetIdRef = useRef<number | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    getValue: () => window.grecaptcha?.getResponse(widgetIdRef.current) ?? '',
    reset: () => window.grecaptcha?.reset(widgetIdRef.current)
  }));

  useEffect(() => {
    function renderWidget() {
      if (renderedRef.current || !containerRef.current || !window.grecaptcha?.render) return;
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, { sitekey: siteKey });
      renderedRef.current = true;
    }

    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    window.__onRecaptchaScriptLoad__ = renderWidget;

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://www.google.com/recaptcha/api.js?onload=__onRecaptchaScriptLoad__&render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [siteKey]);

  return <div ref={containerRef} />;
});
