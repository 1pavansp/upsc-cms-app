import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

const DEFAULT_ADD_TAGS = ['iframe', 'video', 'audio', 'source'];
const DEFAULT_ADD_ATTR = ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'autoplay', 'playsinline'];

const buildConfig = (overrides = {}) => ({
  USE_PROFILES: { html: true },
  ADD_TAGS: DEFAULT_ADD_TAGS,
  ADD_ATTR: DEFAULT_ADD_ATTR,
  ALLOW_DATA_ATTR: true,
  ...overrides
});

const SafeHtml = ({ html = '', className, config }) => {
  const sanitized = useMemo(
    () => DOMPurify.sanitize(html || '', buildConfig(config)),
    [html, config]
  );

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

export default SafeHtml;
