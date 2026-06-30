#!/usr/bin/env python3
"""Check whether the configured Kling credentials authenticate, without
spending any generation credits and without ever printing the key/secret.

What this CAN tell you:
  - Whether KLING_API_KEY (or KLING_ACCESS_KEY/KLING_SECRET_KEY) is present
    and well-formed enough for KlingClient to build a request.
  - Whether the key/secret is accepted by Kling's auth layer (a real
    network round trip, but to a poll endpoint — not a generation call).

What this CANNOT tell you:
  - Your actual remaining credit/resource-package balance. Kling (and most
    resellers fronting Kling) do not document a public balance/billing API
    endpoint that this script can safely call without guessing at a URL.
    "Account balance not enough" errors only surface when you attempt a
    real generation call.

IMPORTANT: Kling's consumer website wallet and the Kling Open Platform /
API balance can be SEPARATE balances. Seeing credit in the website UI does
NOT guarantee the API key has its own non-zero balance. Check your balance
manually in: KlingAI Open Platform -> API Console -> Billing / Resource
Package (or your reseller's equivalent dashboard) before retrying.

Usage:
    python3 scripts/check_kling_balance.py
"""
from utils import load_env


def main():
    env = load_env()

    from kling_client import KlingClient, KlingConfigError, KlingAPIError

    try:
        client = KlingClient(env)
    except KlingConfigError as exc:
        print(f"Credential setup: FAILED -> {exc}")
        return

    print(f"Credential setup: OK (auth mode: {client._auth_mode}, base_url: {client.base_url})")
    print("Running a lightweight auth probe (no video generation, no credits spent)...")

    try:
        result = client.check_auth()
    except KlingAPIError as exc:
        print(f"Auth probe: FAILED -> {exc}")
        print()
        _print_balance_warning()
        return

    if result["auth_ok"]:
        print(f"Auth probe: OK -> {result['detail']}")
    else:
        print(f"Auth probe: FAILED -> {result['detail']}")
        print("Your KLING_API_KEY (or access/secret pair) is being rejected outright.")
        print()
        _print_balance_warning()
        return

    print()
    print("Balance/credit amount: NOT AVAILABLE (no documented endpoint to query it).")
    _print_balance_warning()


def _print_balance_warning():
    print(
        "Kling web credits and Kling Open Platform / API credits may be "
        "separate balances. Please confirm your API balance directly in "
        "KlingAI Open Platform -> API Console / Billing / Resource Package "
        "(or your reseller's billing dashboard) before retrying --live-kling."
    )


if __name__ == "__main__":
    main()
