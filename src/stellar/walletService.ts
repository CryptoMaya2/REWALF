import * as StellarSdk from '@stellar/stellar-sdk';
import freighter from '@stellar/freighter-api';
import albedo from '@albedo-link/intent';
import type { ConnectedWallet, WalletType } from './types';
import { NETWORK_PASSPHRASE, getAccountBalances, generateTestnetKeypair } from './stellarService';

const STORAGE_KEY_WALLET = 'rewalf_connected_wallet_v2';

/**
 * Check if Freighter extension is available in the browser
 */
export async function checkFreighterInstalled(): Promise<boolean> {
  try {
    const res = await freighter.isConnected();
    return !!res?.isConnected;
  } catch {
    return false;
  }
}

/**
 * Connect using official Freighter browser extension
 */
export async function connectFreighter(): Promise<ConnectedWallet> {
  const isInstalled = await checkFreighterInstalled();
  if (!isInstalled) {
    throw new Error('Freighter extension not detected. Please install Freighter from https://freighter.app or use Albedo.');
  }

  // Request access / public key from user
  const accessRes = await freighter.requestAccess();
  if (accessRes?.error) {
    throw new Error(typeof accessRes.error === 'string' ? accessRes.error : 'Freighter access rejected by user.');
  }

  const address = accessRes?.address;
  if (!address || !StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
    // Fallback to getAddress
    const addrRes = await freighter.getAddress();
    if (!addrRes?.address) {
      throw new Error('Could not retrieve public key from Freighter.');
    }
    return buildWalletObject(addrRes.address, 'freighter', 'Freighter Wallet');
  }

  return buildWalletObject(address, 'freighter', 'Freighter Wallet');
}

/**
 * Connect using Albedo (zero-install Web3 signer)
 */
export async function connectAlbedo(): Promise<ConnectedWallet> {
  const result = await albedo.publicKey({
    require_existing: false,
  });

  if (!result || !result.pubkey) {
    throw new Error('Albedo connection was cancelled or returned no public key.');
  }

  return buildWalletObject(result.pubkey, 'albedo', 'Albedo Web Signer');
}

/**
 * Connect a disposable Testnet Sandbox keypair (for demo or testing without an extension)
 */
export async function connectSandbox(): Promise<ConnectedWallet> {
  const kp = await generateTestnetKeypair(true);
  return connectTestAccount(kp.publicKey, kp.secretKey, 'Testnet Sandbox (Demo)');
}

/**
 * Connect a specific generated/tested testnet account keypair
 */
export function connectTestAccount(
  publicKey: string,
  secretKey?: string,
  label = 'Testnet Account'
): ConnectedWallet {
  const wallet: ConnectedWallet = {
    publicKey,
    walletType: 'sandbox',
    label,
    balanceXlm: '10000.0000000',
    balanceUsdc: '0.0000000',
    secretKey,
  };
  saveConnectedWallet(wallet);
  return wallet;
}


/**
 * Connect any Stellar address in view-only / manual mode
 */
export async function connectManual(address: string): Promise<ConnectedWallet> {
  const clean = address.trim();
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(clean)) {
    throw new Error('Invalid Stellar address. Must be a 56-character Ed25519 public key starting with G.');
  }
  return buildWalletObject(clean, 'manual', 'Connected Account (View Only)');
}

/**
 * Helper to build and populate wallet with balances
 */
async function buildWalletObject(publicKey: string, type: WalletType, label: string): Promise<ConnectedWallet> {
  const balances = await getAccountBalances(publicKey).catch(() => ({
    exists: false,
    xlm: '0.0000000',
    usdc: '0.0000000',
  }));

  const wallet: ConnectedWallet = {
    publicKey,
    walletType: type,
    label,
    balanceXlm: balances.xlm,
    balanceUsdc: balances.usdc,
  };

  saveConnectedWallet(wallet);
  return wallet;
}

/**
 * Sign a transaction using the connected wallet (non-custodial)
 */
export async function signTransactionWithWallet(
  tx: StellarSdk.Transaction,
  wallet: ConnectedWallet
): Promise<StellarSdk.Transaction> {
  const txXdr = tx.toXDR();

  if (wallet.walletType === 'freighter') {
    const res = await freighter.signTransaction(txXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: wallet.publicKey,
    });

    if (res?.error) {
      const msg = typeof res.error === 'string' ? res.error : 'Transaction signing rejected in Freighter.';
      throw new Error(msg);
    }

    if (!res?.signedTxXdr) {
      throw new Error('Freighter did not return signed transaction XDR.');
    }

    return StellarSdk.TransactionBuilder.fromXDR(res.signedTxXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction;
  }

  if (wallet.walletType === 'albedo') {
    const res = await albedo.tx({
      xdr: txXdr,
      network: 'testnet',
      pubkey: wallet.publicKey,
    });

    if (!res?.signed_envelope_xdr) {
      throw new Error('Albedo did not return signed transaction XDR.');
    }

    return StellarSdk.TransactionBuilder.fromXDR(res.signed_envelope_xdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction;
  }

  if (wallet.walletType === 'sandbox') {
    if (!wallet.secretKey) {
      throw new Error('Sandbox keypair missing secret key. Please reconnect.');
    }
    const kp = StellarSdk.Keypair.fromSecret(wallet.secretKey);
    tx.sign(kp);
    return tx;
  }

  throw new Error('This account is connected in View-Only mode and cannot sign transactions. Please connect with Freighter or Albedo.');
}

/**
 * Save connected wallet to localStorage
 */
export function saveConnectedWallet(wallet: ConnectedWallet | null): void {
  if (!wallet) {
    localStorage.removeItem(STORAGE_KEY_WALLET);
  } else {
    // Strip secretKey if not sandbox to ensure safe non-custodial storage
    const safeData: ConnectedWallet = {
      publicKey: wallet.publicKey,
      walletType: wallet.walletType,
      label: wallet.label,
      balanceXlm: wallet.balanceXlm,
      balanceUsdc: wallet.balanceUsdc,
      ...(wallet.walletType === 'sandbox' && wallet.secretKey ? { secretKey: wallet.secretKey } : {}),
    };
    localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(safeData));
  }
  window.dispatchEvent(new Event('rewalf_wallet_changed'));
}

/**
 * Load saved connected wallet on app boot
 */
export async function loadSavedWallet(): Promise<ConnectedWallet | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WALLET);
    if (!raw) return null;
    const data: ConnectedWallet = JSON.parse(raw);
    if (!data?.publicKey) return null;

    // Refresh balance
    const balances = await getAccountBalances(data.publicKey).catch(() => ({
      exists: false,
      xlm: '0.0000000',
      usdc: '0.0000000',
    }));

    return {
      ...data,
      balanceXlm: balances.xlm,
      balanceUsdc: balances.usdc,
    };
  } catch {
    return null;
  }
}

/**
 * Disconnect current wallet
 */
export function disconnectWallet(): void {
  saveConnectedWallet(null);
}
