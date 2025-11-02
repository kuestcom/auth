'use client';

import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { polygon, polygonAmoy } from 'wagmi/chains';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://auth.forka.st';
const appIconUrl =
  process.env.NEXT_PUBLIC_APP_ICON ??
  'https://auth.forka.st/forkast-logo.svg';

export const wagmiConfig = createConfig({
  chains: [polygon, polygonAmoy],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: 'Forkast Auth',
      appLogoUrl: appIconUrl,
      preference: 'all',
      enableMobileWalletLink: true,
      reloadOnDisconnect: true,
    }),
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: {
              name: 'Forkast Auth',
              description: 'Generate Forkast API credentials.',
              url: defaultAppUrl,
              icons: [
                appIconUrl,
                'https://forka.st/favicon.ico?favicon.71f60070.ico',
              ],
            },
            qrModalOptions: {
              themeMode: 'dark',
              themeVariables: {
                '--wcm-z-index': '9999',
              },
            },
          }),
        ]
      : []),
  ],
  multiInjectedProviderDiscovery: false,
});
