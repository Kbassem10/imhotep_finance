from collections import defaultdict
from transaction_management.models import Transactions, NetWorth


def recalculate_networth(user):
    """Recalculate user's networth from all transactions, grouped by (currency, place).

    Since both `place` on Transactions and NetWorth are EncryptedCharFields,
    we cannot group or filter by place at the DB level. Instead we load all
    transactions and aggregate in Python.
    """
    try:
        if not user:
            return False, "User must be provided"

        # Load all transactions for this user
        all_transactions = Transactions.objects.filter(user=user)

        if not all_transactions.exists():
            # Clear existing networth records if no transactions exist
            NetWorth.objects.filter(user=user).delete()
            return True, {
                "currencies_processed": 0,
                "networth_records_created": 0,
                "bucket_totals": {}
            }

        # Group transactions by (currency, place) in Python
        # Each bucket tracks deposits and withdrawals separately
        buckets = defaultdict(lambda: {"deposits": 0.0, "withdrawals": 0.0})

        for txn in all_transactions:
            key = (txn.currency, txn.place or "Cash")
            if txn.trans_status.lower() == "deposit":
                buckets[key]["deposits"] += float(txn.amount)
            elif txn.trans_status.lower() == "withdraw":
                buckets[key]["withdrawals"] += float(txn.amount)

        # Clear existing networth records for this user
        NetWorth.objects.filter(user=user).delete()

        # Create a new NetWorth record for each (currency, place) bucket
        bucket_totals = {}
        created_count = 0

        for (currency, place), totals in buckets.items():
            net_balance = totals["deposits"] - totals["withdrawals"]
            bucket_totals[f"{currency} ({place})"] = net_balance

            NetWorth.objects.create(
                user=user,
                currency=currency,
                place=place,
                total=net_balance,
            )
            created_count += 1

            print(
                f"Currency: {currency}, Place: {place}, "
                f"Deposits: {totals['deposits']}, Withdrawals: {totals['withdrawals']}, "
                f"Net: {net_balance}"
            )

        unique_currencies = set(currency for currency, _ in buckets.keys())

        return True, {
            "currencies_processed": len(unique_currencies),
            "networth_records_created": created_count,
            "bucket_totals": bucket_totals,
        }

    except Exception as e:
        print(f"Error in recalculate_networth: {str(e)}")
        return False, "Error occurred while recalculating networth"

