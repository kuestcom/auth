'use client'

import type { KeyBundle } from '@/types/keygen'
import { useWalletInfo } from '@reown/appkit/react'
import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  WalletIcon,
  XIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { UserRejectedRequestError } from 'viem'
import {
  useAccount,
  useDisconnect,
  useSignTypedData,
  useSwitchChain,
} from 'wagmi'
import { polygon, polygonAmoy } from 'wagmi/chains'
import { EnvBlock } from '@/components/env-block'
import { KeysPanel } from '@/components/keys-panel'
import { SiteLogoIcon } from '@/components/site-logo-icon'
import { useAppKit } from '@/hooks/useAppKit'
import { shortenAddress } from '@/lib/format'
import {
  createKuestKey,
  listKuestKeys,
  revokeKuestKey,
} from '@/lib/kuest'
import { createSupabaseClient } from '@/lib/supabase'

const EMAIL_STORAGE_KEY = 'kuest-email'
const EMAIL_STORAGE_TTL = 1000 * 60 * 60 * 24 * 3 // 3 days
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || 'Kuest'
const TARGET_CHAIN_MODE
  = process.env.NEXT_PUBLIC_KUEST_CHAIN_MODE === 'polygon'
    ? 'polygon'
    : 'amoy'
const REQUIRED_CHAIN = TARGET_CHAIN_MODE === 'polygon' ? polygon : polygonAmoy
const REQUIRED_CHAIN_ID = REQUIRED_CHAIN.id
const REQUIRED_CHAIN_LABEL = TARGET_CHAIN_MODE === 'polygon'
  ? 'Polygon Mainnet (137)'
  : 'Polygon Amoy Testnet (80002)'
const AMOY_CHAIN_HEX = `0x${polygonAmoy.id.toString(16)}`
const AMOY_ADD_PARAMS = {
  chainId: AMOY_CHAIN_HEX,
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology/'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
}

interface Eip1193Provider {
  request: (args: { method: string, params?: unknown[] }) => Promise<unknown>
}

interface ErrorWithCode extends Error {
  code?: number
  cause?: unknown
}

interface ActionPromptProps {
  open: boolean
  title: string
  description: string
  showConnectedWalletIcon?: boolean
  allowClose?: boolean
  onClose?: () => void
}

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') {
    return null
  }

  const maybeProvider = (
    window as Window & { ethereum?: Eip1193Provider }
  ).ethereum

  if (!maybeProvider || typeof maybeProvider.request !== 'function') {
    return null
  }

  return maybeProvider
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

function isMissingChainError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const candidate = error as ErrorWithCode
  const cause = candidate.cause as { code?: number, message?: string } | undefined
  const message = candidate.message.toLowerCase()
  const causeMessage = cause?.message?.toLowerCase() ?? ''

  return candidate.code === 4902
    || cause?.code === 4902
    || message.includes('4902')
    || causeMessage.includes('4902')
    || message.includes('unrecognized chain')
    || causeMessage.includes('unrecognized chain')
}

function ActionPrompt({
  open,
  title,
  description,
  showConnectedWalletIcon = false,
  allowClose = false,
  onClose,
}: ActionPromptProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-background/85 px-4 py-6 backdrop-blur-md">
      <div className="relative w-full max-w-sm auth-panel p-6 text-center">
        {allowClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 auth-icon-button p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close waiting modal"
          >
            <XIcon className="size-4" />
          </button>
        )}

        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-5 flex justify-center">
          <div className="relative size-36 overflow-hidden rounded-[30px] bg-card text-primary">
            <div className={`
              pointer-events-none absolute inset-0 animate-[spin_1500ms_linear_infinite]
              bg-[conic-gradient(from_0deg,transparent_0deg,transparent_288deg,currentColor_320deg,currentColor_350deg,transparent_360deg)]
            `}
            />
            <div className="absolute inset-[3px] rounded-[26px] bg-background" />
            <div className="relative flex size-full items-center justify-center">
              <div className="flex size-[88%] items-center justify-center">
                {showConnectedWalletIcon ? <ActionPromptWalletIcon /> : <WalletIcon className="size-16 text-primary" strokeWidth={1.7} />}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Loader2Icon className="size-4 animate-spin text-primary" />
          <span>Waiting for wallet approval...</span>
        </div>
      </div>
    </div>
  )
}

function ActionPromptWalletIcon() {
  const { walletInfo } = useWalletInfo()
  const [walletIconLoadFailed, setWalletIconLoadFailed] = useState(false)
  const walletName = typeof walletInfo?.name === 'string' ? walletInfo.name : undefined
  const walletIconUrl = typeof walletInfo?.icon === 'string' ? walletInfo.icon.trim() : ''

  useEffect(() => {
    setWalletIconLoadFailed(false)
  }, [walletIconUrl])

  if (!walletIconUrl || walletIconLoadFailed) {
    return <WalletIcon className="size-16 text-primary" strokeWidth={1.7} />
  }

  return (
    <Image
      src={walletIconUrl}
      alt={walletName ? `${walletName} wallet icon` : 'Connected wallet icon'}
      width={64}
      height={64}
      unoptimized
      className="size-16 rounded-2xl object-cover"
      onError={() => setWalletIconLoadFailed(true)}
    />
  )
}

export function KeyGenerator() {
  const account = useAccount()
  const { disconnect, status: disconnectStatus } = useDisconnect()
  const { switchChain, status: switchStatus } = useSwitchChain()
  const { signTypedDataAsync } = useSignTypedData()
  const { open: openAppKit, isReady: isAppKitReady } = useAppKit()

  const isConnected
    = account.status === 'connected' && Boolean(account.address)
  const onRequiredChain
    = isConnected && account.chainId !== undefined
      ? account.chainId === REQUIRED_CHAIN_ID
      : false

  const [nonce, setNonce] = useState('0')
  const [bundle, setBundle] = useState<KeyBundle | null>(null)
  const [keys, setKeys] = useState<string[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [keysError, setKeysError] = useState<string | null>(null)
  const [keysHelper, setKeysHelper] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)
  const [flowInfo, setFlowInfo] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [isEnsuringNetwork, setIsEnsuringNetwork] = useState(false)
  const [connectPromptOpen, setConnectPromptOpen] = useState(false)
  const [autoProceedAfterConnect, setAutoProceedAfterConnect] = useState(false)
  const [emailNotice, setEmailNotice] = useState<string | null>(null)
  const [nonceInputError, setNonceInputError] = useState<string | null>(null)
  const [showKeyManagement, setShowKeyManagement] = useState(false)

  const keyManagementDisabled = !bundle

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const saved = window.localStorage.getItem(EMAIL_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          value?: string
          savedAt?: number
        }
        if (parsed?.value) {
          const age = Date.now() - (parsed.savedAt ?? 0)
          if (age < EMAIL_STORAGE_TTL) {
            setEmailDraft(parsed.value)
          }
          else {
            window.localStorage.removeItem(EMAIL_STORAGE_KEY)
          }
        }
      }
      catch {
        window.localStorage.removeItem(EMAIL_STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (account.status === 'disconnected') {
      setBundle(null)
      setKeys([])
      setKeysHelper(null)
      setKeysError(null)
      setEmailNotice(null)
      setConnectPromptOpen(false)
      setAutoProceedAfterConnect(false)
    }
  }, [account.status])

  useEffect(() => {
    if (isConnected) {
      setConnectPromptOpen(false)
    }
  }, [isConnected])

  function updateEmailDraft(value: string) {
    setEmailDraft(value)
    if (typeof window === 'undefined') {
      return
    }
    const trimmed = value.trim()
    if (trimmed) {
      window.localStorage.setItem(
        EMAIL_STORAGE_KEY,
        JSON.stringify({ value: trimmed, savedAt: Date.now() }),
      )
    }
    else {
      window.localStorage.removeItem(EMAIL_STORAGE_KEY)
    }
  }

  function sanitizeNonceInput(value: string) {
    return value.replace(/\D+/g, '')
  }

  async function handleWalletConnectClick() {
    setFlowError(null)
    setFlowInfo(null)
    setConnectPromptOpen(true)
    setAutoProceedAfterConnect(true)
    try {
      await openAppKit()
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Failed to open wallet modal.'
      setFlowError(message)
      setConnectPromptOpen(false)
      setAutoProceedAfterConnect(false)
    }
  }

  async function handleEnsureRequiredNetwork() {
    setFlowError(null)
    setFlowInfo(null)

    if (!isConnected) {
      setFlowError('Connect a wallet before switching networks.')
      return false
    }

    if (onRequiredChain) {
      setFlowInfo(`${REQUIRED_CHAIN_LABEL} is already active.`)
      return true
    }

    setIsEnsuringNetwork(true)

    try {
      if (!switchChain) {
        throw new Error(
          'Automatic network switch is not available for this wallet. Switch manually in wallet settings.',
        )
      }

      await switchChain({ chainId: REQUIRED_CHAIN_ID })
      setFlowInfo(`${REQUIRED_CHAIN_LABEL} is active.`)
      return true
    }
    catch (error) {
      if (REQUIRED_CHAIN_ID === polygonAmoy.id && isMissingChainError(error)) {
        try {
          const provider = getInjectedProvider()
          if (!provider) {
            throw new Error(
              'Auto-add works only with injected wallets (browser extension or in-app browser).',
            )
          }

          setFlowInfo('Adding Polygon Amoy to your wallet...')
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_ADD_PARAMS],
          })
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: AMOY_CHAIN_HEX }],
          })
          setFlowInfo('Polygon Amoy enabled. You can sign now.')
          return true
        }
        catch (addError) {
          setFlowError(
            getErrorMessage(
              addError,
              'Unable to add Polygon Amoy automatically. Switch manually in your wallet.',
            ),
          )
          return false
        }
      }
      else {
        setFlowError(
          getErrorMessage(error, `Unable to switch to ${REQUIRED_CHAIN_LABEL}.`),
        )
        return false
      }
    }
    finally {
      setIsEnsuringNetwork(false)
    }
  }

  useEffect(() => {
    if (!autoProceedAfterConnect || !isConnected || bundle) {
      return
    }
    if (isEnsuringNetwork || switchStatus === 'pending' || isSigning) {
      return
    }

    if (!onRequiredChain) {
      handleEnsureRequiredNetwork()
        .then((ok) => {
          if (!ok) {
            setAutoProceedAfterConnect(false)
          }
        })
        .catch(() => {
          setAutoProceedAfterConnect(false)
        })
      return
    }

    handleSignAndGenerate()
      .finally(() => {
        setAutoProceedAfterConnect(false)
      })
    // We intentionally react to connection/chain/signing state transitions.
    // Handler identities are recreated on render and are not used as effect triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoProceedAfterConnect,
    isConnected,
    bundle,
    isEnsuringNetwork,
    switchStatus,
    isSigning,
    onRequiredChain,
  ])

  useEffect(() => {
    if (!flowError || typeof window === 'undefined') {
      return
    }

    function clearFlowError() {
      setFlowError(null)
    }

    window.addEventListener('pointerdown', clearFlowError, { once: true })
    window.addEventListener('keydown', clearFlowError, { once: true })

    return () => {
      window.removeEventListener('pointerdown', clearFlowError)
      window.removeEventListener('keydown', clearFlowError)
    }
  }, [flowError])

  function getAuthContext() {
    if (!bundle) {
      throw new Error('Generate an API key before managing credentials.')
    }
    if (!account.address) {
      throw new Error('Connect your wallet to manage keys.')
    }

    return {
      address: account.address,
      apiKey: bundle.apiKey,
      apiSecret: bundle.apiSecret,
      passphrase: bundle.passphrase,
    }
  }

  async function handleSignAndGenerate() {
    setFlowError(null)
    setFlowInfo(null)

    if (!account.address || account.chainId === undefined) {
      setFlowError('Connect a wallet before signing.')
      return
    }
    if (!onRequiredChain) {
      setFlowError(`Switch to ${REQUIRED_CHAIN_LABEL} before signing.`)
      return
    }

    const rawNonce = nonce.trim()
    const safeNonce = rawNonce === '' ? '0' : sanitizeNonceInput(rawNonce)
    if (!/^\d+$/.test(safeNonce)) {
      setNonceInputError('Nonce must contain digits only.')
      return
    }
    setNonceInputError(null)
    if (safeNonce !== nonce) {
      setNonce(safeNonce)
    }

    const timestamp = Math.floor(Date.now() / 1000).toString()

    try {
      setIsSigning(true)
      setFlowInfo('Open your wallet and sign the Kuest attestation.')

      const typedData = {
        domain: {
          name: 'ClobAuthDomain',
          version: '1',
          chainId: account.chainId,
        },
        types: {
          ClobAuth: [
            { name: 'address', type: 'address' as const },
            { name: 'timestamp', type: 'string' as const },
            { name: 'nonce', type: 'uint256' as const },
            { name: 'message', type: 'string' as const },
          ],
        },
        primaryType: 'ClobAuth' as const,
        message: {
          address: account.address,
          timestamp,
          nonce: safeNonce,
          message: 'This message attests that I control the given wallet',
        },
      }

      const signature = await signTypedDataAsync(typedData)

      setFlowInfo('Minting your Kuest credentials...')
      const result = await createKuestKey({
        address: account.address,
        signature,
        timestamp,
        nonce: safeNonce,
      })

      setBundle({ ...result, address: account.address })
      handleRefreshKeys().catch(() => {})
      setKeys(previous =>
        previous.includes(result.apiKey)
          ? previous
          : [result.apiKey, ...previous],
      )
      setKeysHelper(
        'New key minted. Use refresh to fetch all keys from Kuest.',
      )
      setKeysError(null)

      const trimmedEmail = emailDraft.trim()
      if (trimmedEmail) {
        try {
          const supabase = createSupabaseClient()
          const { error } = await supabase.from('key_emails').insert({
            api_key: result.apiKey,
            email: trimmedEmail,
          })

          if (error) {
            if (error.code === '23505') {
              setEmailNotice('Email already saved for this key.')
            }
            else {
              throw new Error(
                error.message ?? 'Supabase rejected this request.',
              )
            }
          }
          else {
            setEmailNotice('Saved. You can revoke any time.')
          }
          updateEmailDraft(trimmedEmail)
        }
        catch (error) {
          setEmailNotice(
            error instanceof Error
              ? `Email save failed: ${error.message}`
              : 'Email save failed.',
          )
        }
      }
      else {
        setEmailNotice(null)
        updateEmailDraft('')
      }

      setFlowInfo(null)
    }
    catch (error) {
      if (error instanceof UserRejectedRequestError) {
        setFlowError('Signature was rejected in your wallet.')
      }
      else if (
        error instanceof Error
        && error.message?.includes('Proposal expired')
      ) {
        setFlowError(
          'Wallet session expired. Reopen your wallet and try connecting again.',
        )
        disconnect()
      }
      else {
        setFlowError(
          error instanceof Error
            ? error.message
            : 'Unable to generate keys. Please try again.',
        )
      }
    }
    finally {
      setIsSigning(false)
    }
  }

  async function handleRefreshKeys() {
    setKeysError(null)
    setKeysHelper(null)
    setKeysLoading(true)
    try {
      const auth = getAuthContext()
      const latest = await listKuestKeys(auth)
      setKeys(latest)
      setKeysHelper(
        latest.length
          ? `Loaded ${latest.length} active key${latest.length > 1 ? 's' : ''}.`
          : 'No keys found for this wallet.',
      )
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : 'Failed to load keys.'
      setKeysError(message)
      setKeys([])
      if (error instanceof Error && /401|403/.test(message)) {
        setBundle(null)
        setKeysHelper(
          'Credentials look invalid. Generate a new API key to continue.',
        )
      }
    }
    finally {
      setKeysLoading(false)
    }
  }

  async function handleRevoke(key: string) {
    setKeysError(null)
    setKeysHelper(null)
    setKeysLoading(true)
    try {
      const auth = getAuthContext()
      await revokeKuestKey(auth, key)
      setKeys(previous => previous.filter(value => value !== key))
      if (bundle?.apiKey === key) {
        setBundle(null)
        setEmailNotice(null)
        setKeysHelper('Key revoked. Generate a new API key to keep trading.')
      }
      else {
        setKeysHelper('Key revoked. Refresh to verify remaining credentials.')
      }
    }
    catch (error) {
      setKeysError(
        error instanceof Error ? error.message : 'Failed to revoke key.',
      )
    }
    finally {
      setKeysLoading(false)
    }
  }

  const networkActionPending = isEnsuringNetwork || switchStatus === 'pending'
  const canSign
    = isConnected && onRequiredChain && !isSigning && !networkActionPending
  const chainStepLabel = TARGET_CHAIN_MODE === 'amoy'
    ? 'Activate Polygon Amoy'
    : 'Activate Polygon Mainnet'
  const currentStep = !isConnected
    ? {
        number: 1,
        title: 'Connect your wallet',
        description: 'This is a signature-only step: no balance required, no funds moved, no gas fees.',
        actionLabel: isAppKitReady ? 'Connect wallet' : 'Loading...',
        action: handleWalletConnectClick,
        disabled: !isAppKitReady,
      }
    : !onRequiredChain
        ? {
            number: 2,
            title: chainStepLabel,
            description: TARGET_CHAIN_MODE === 'amoy'
              ? 'We will try to switch automatically and add Amoy if needed.'
              : 'Switch network before signing.',
            actionLabel: networkActionPending
              ? 'Switching network...'
              : TARGET_CHAIN_MODE === 'amoy'
                ? 'Activate Amoy'
                : 'Switch network',
            action: handleEnsureRequiredNetwork,
            disabled: networkActionPending,
          }
        : {
            number: 3,
            title: 'Sign to generate API key',
            description: 'One EIP-712 signature, no funds moved.',
            actionLabel: isSigning ? 'Waiting for signature...' : 'Sign now',
            action: handleSignAndGenerate,
            disabled: !canSign,
          }

  const steps = [
    {
      number: 1,
      label: 'Connect wallet',
      done: isConnected || Boolean(bundle),
    },
    {
      number: 2,
      label: chainStepLabel,
      done: onRequiredChain || Boolean(bundle),
    },
    {
      number: 3,
      label: 'Sign message',
      done: Boolean(bundle),
    },
  ]
  const activeStepNumber = bundle ? 3 : currentStep.number
  const completedSteps = steps.filter(
    step => step.done && step.number < currentStep.number,
  )

  return (
    <>
      <div className="mx-auto w-full max-w-4xl py-6">
        <section className="w-full auth-shell px-6 py-8 sm:px-10">
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-3 text-foreground">
              <SiteLogoIcon
                alt={`${SITE_NAME} logo`}
                className="size-[1.7rem]"
                imageClassName="object-contain"
                size={32}
              />
              <span className="text-2xl font-semibold tracking-tight">{SITE_NAME}</span>
            </div>
          </div>
          <h1 className="mt-3 text-center text-3xl font-semibold text-foreground sm:text-4xl">
            Generate API credentials
          </h1>

          <div className="mt-6 w-full auth-stepper">
            <div className="grid w-full grid-cols-3">
              {steps.map(step => (
                <div
                  key={step.number}
                  data-state={
                    step.number === activeStepNumber
                      ? 'active'
                      : step.done
                        ? 'done'
                        : 'idle'
                  }
                  className="auth-step text-center text-xs sm:text-sm"
                >
                  <span className="auth-step-index shrink-0">{step.number}</span>
                  <span className="truncate">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!bundle && (
            <div className="mt-6 space-y-6">
              {completedSteps.map(step => (
                <div
                  key={step.number}
                  className="flex items-center justify-between auth-subpanel px-6 py-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {step.number}
                    .
                    {' '}
                    {step.label}
                  </p>
                  <div className={`
                    flex size-12 items-center justify-center rounded-full border border-white/70 bg-white
                    text-background shadow-[0_12px_28px_rgba(0,0,0,0.18)]
                  `}
                  >
                    <CheckIcon className="size-7" strokeWidth={2.4} />
                  </div>
                </div>
              ))}

              <div className="auth-panel p-6">
                <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                  Step
                  {' '}
                  {currentStep.number}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  {currentStep.title}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  {currentStep.number === 1
                    ? (
                        <>
                          <a
                            href="https://metamask.io/download"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium auth-link"
                          >
                            MetaMask browser extension
                          </a>
                          {' '}
                          is recommended for the simplest setup.
                          {' '}
                          {currentStep.description}
                        </>
                      )
                    : currentStep.description}
                </p>

                {isConnected && account.address && (
                  <p className="mt-4 text-xs text-muted-foreground sm:text-sm">
                    {shortenAddress(account.address)}
                    {' · '}
                    {account.chain?.name ?? `Chain ${account.chainId ?? '-'}`}
                  </p>
                )}

                <div className="mt-7 flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <button
                      type="button"
                      onClick={currentStep.action}
                      disabled={currentStep.disabled}
                      className={`
                        inline-flex w-full items-center justify-center auth-cta px-6 py-4 text-sm font-semibold
                        tracking-[0.16em] uppercase
                        focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none
                      `}
                    >
                      {currentStep.actionLabel}
                    </button>
                  </div>
                </div>

                {flowError && (
                  <p
                    className={`
                      mx-auto mt-4 max-w-sm auth-feedback auth-feedback-error px-4 py-3 text-sm text-destructive
                    `}
                  >
                    {flowError}
                  </p>
                )}
              </div>

              <div className="auth-subpanel px-5 py-4">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(previous => !previous)}
                  className={`
                    flex w-full items-center justify-between text-left text-sm font-medium text-foreground transition
                    hover:text-foreground
                  `}
                >
                  <span>Advanced options</span>
                  <ChevronDownIcon
                    className={`size-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {advancedOpen && (
                  <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                    <label htmlFor="kuest-email" className="block space-y-2">
                      <span className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                        Email address (optional)
                      </span>
                      <input
                        id="kuest-email"
                        type="email"
                        value={emailDraft}
                        onChange={event => updateEmailDraft(event.target.value)}
                        placeholder="you@team.com"
                        className="w-full auth-input px-4 py-2.5 text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-foreground">
                      <span className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                        Nonce
                      </span>
                      <input
                        type="text"
                        value={nonce}
                        onChange={(event) => {
                          setNonceInputError(null)
                          setNonce(sanitizeNonceInput(event.target.value))
                        }}
                        inputMode="numeric"
                        pattern="\d*"
                        className="auth-input px-3 py-2 font-mono text-sm"
                        placeholder="0"
                      />
                      {nonceInputError && (
                        <span className="text-xs text-destructive">
                          {nonceInputError}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Leave 0 unless you need a different key.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {flowInfo && (
            <p className="mt-6 auth-feedback px-4 py-3 text-sm text-foreground">
              {flowInfo}
            </p>
          )}
          {emailNotice && (
            <p className="mt-4 auth-feedback auth-feedback-success px-4 py-3 text-sm">
              {emailNotice}
            </p>
          )}

          {bundle && (
            <div className="mt-6 space-y-6">
              <div className={`
                mx-auto flex size-24 animate-[auth-success-pop_520ms_ease-out] items-center justify-center rounded-full
                border border-white/70 bg-white text-background shadow-[0_18px_40px_rgba(0,0,0,0.22)]
              `}
              >
                <CheckIcon className="size-12" strokeWidth={2.2} />
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  API key generated successfully
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Copy the credentials block below and paste it into your `.env` file.
                </p>
              </div>
              <EnvBlock bundle={bundle} />
            </div>
          )}

          {isConnected && keys.length > 0 && (
            <div className="mt-6 auth-subpanel px-5 py-4">
              <button
                type="button"
                onClick={() => setShowKeyManagement(previous => !previous)}
                className={`
                  flex w-full items-center justify-between text-left text-sm font-medium text-foreground transition
                  hover:text-foreground
                `}
              >
                <span>Key Management</span>
                <ChevronDownIcon
                  className={`size-4 transition-transform ${showKeyManagement ? 'rotate-180' : ''}`}
                />
              </button>
              {showKeyManagement && (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <KeysPanel
                    keys={keys}
                    onRefresh={handleRefreshKeys}
                    onRevoke={handleRevoke}
                    loading={keysLoading}
                    disabled={keyManagementDisabled}
                    helper={keysHelper}
                    error={keysError}
                    activeKey={bundle?.apiKey ?? null}
                  />
                </div>
              )}
            </div>
          )}

          {isConnected && account.address && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => disconnect()}
                disabled={disconnectStatus === 'pending'}
                className={`
                  inline-flex items-center justify-center auth-secondary-button px-3 py-1.5 text-xs font-semibold
                  tracking-[0.2em] text-muted-foreground uppercase
                  hover:text-foreground
                `}
              >
                Disconnect
              </button>
            </div>
          )}
        </section>
      </div>

      <ActionPrompt
        open={connectPromptOpen}
        title="Connecting wallet"
        description="Open your wallet and approve the connection to continue."
        showConnectedWalletIcon={isAppKitReady}
        allowClose
        onClose={() => setConnectPromptOpen(false)}
      />

      <ActionPrompt
        open={isSigning}
        title="Waiting for signature"
        description="Approve the signature in your wallet to generate credentials."
        showConnectedWalletIcon={isAppKitReady}
        allowClose
        onClose={() => {
          setIsSigning(false)
        }}
      />
    </>
  )
}
