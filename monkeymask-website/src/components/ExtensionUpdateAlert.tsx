import { SiteAlert } from '@/components/ui/SiteAlert';

/** Flip to false once v0.2.1 is live on the Chrome Web Store. */
export const EXTENSION_UPDATE_ALERT_ENABLED = true;

const REQUIRED_EXTENSION_VERSION = '0.2.1';

export function ExtensionUpdateAlert() {
  if (!EXTENSION_UPDATE_ALERT_ENABLED) return null;

  return (
    <SiteAlert
      variant="warning"
      icon="mdi:update"
      title={`Extension update rolling out (v${REQUIRED_EXTENSION_VERSION})`}
      className="mt-6"
    >
      <p>
        We recently shipped updated npm packages and website features. The Chrome extension is
        catching up — demos on this site may not work until{' '}
        <strong>MonkeyMask v{REQUIRED_EXTENSION_VERSION}</strong> is available in the Web Store.
      </p>
      <p className="mt-2">
        If you already have an older extension installed, please wait for the update (or check
        chrome://extensions and reload once the store listing shows v{REQUIRED_EXTENSION_VERSION}).
      </p>
    </SiteAlert>
  );
}
