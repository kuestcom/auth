# UI Spec

The UI intentionally preserves the auth app layout and fields.

## Page

- Dark theme only.
- Body background: `#0e1117`.
- Font: Open Sauce One from `/fonts/open-sauce-one-latin-*.woff2`.
- Main container: centered, max width `1332px`, `px-4`, vertical padding `py-10 sm:py-14`.
- Auth card: centered, max width `4xl`, rounded `2rem`, translucent dark panel, `px-6 py-8 sm:px-10`.

## Header Inside Card

- Centered Kuest logo, 32px asset rendered at `1.7rem`.
- Brand text: `text-2xl`, `font-semibold`.
- Main title: `Generate API credentials`, centered, `text-3xl sm:text-4xl`.

## Stepper

Three equal columns:

1. `Connect wallet`
2. `Activate Polygon Amoy` or `Activate Polygon Mainnet`
3. `Sign message`

Active and done states use the same white circular index treatment as the current app.

## Step Card

Fields and texts are unchanged:

- Step number label.
- Title.
- Description.
- Step 1 includes the MetaMask browser extension link.
- Connected wallet line: shortened address and chain name.
- Primary CTA button.
- Error feedback under the CTA.

## Advanced Options

Single collapsible block:

- Label: `Advanced options`
- Field: `Email address (optional)`
- Input id: `kuest-email`
- Placeholder: `you@team.com`

No extra fields were added.

## Success State

After generation:

- White check circle.
- Title: `API key generated successfully`
- Description: `Copy the credentials block below and paste it into your \`.env\` file.`
- Read-only textarea with:

```text
KUEST_ADDRESS=
KUEST_API_KEY=
KUEST_API_SECRET=
KUEST_PASSPHRASE=
```

## Key Management

Shown only when connected and keys exist:

- Collapsible `Key Management`.
- `My keys` section.
- `Refresh` button.
- Each key row has copy and revoke actions.

## Wallet Prompts

Modal overlays remain:

- `Connecting wallet`
- `Waiting for signature`

Both use the same spinner ring, wallet icon fallback, and `Waiting for wallet approval...` footer.
