'use client';

import { useEffect, useRef } from 'react';

// Renders the reCAPTCHA v2 checkbox via grecaptcha.render() inside a
// useEffect, instead of Google's automatic "scan the page for
// .g-recaptcha divs" behavior. The automatic mode injects an iframe into
// the div as soon as its script loads, which can happen mid-hydration and
// causes a "server HTML did not match" hydration error since React didn't
// put that iframe there. Rendering explicitly, after mount, sidesteps that
// entirely — the container is empty on both server and client render.

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: { sitekey: string }) => number;
    };
    __onRecaptchaScriptLoad__?: () => void;
  }
}

const SCRIPT_ID = 'recaptcha-script';

export function RecaptchaWidget({ siteKey }: { siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    function renderWidget() {
      if (renderedRef.current || !containerRef.current || !window.grecaptcha?.render) return;
      window.grecaptcha.render(containerRef.current, { sitekey: siteKey });
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
}
