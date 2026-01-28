from django.urls import path
from .apis import (
    ExternalTransactionCreateApi,
    ExternalTransactionDeleteApi,
    ExternalTransactionListApi,
    AvailableCurrenciesApi,
)

urlpatterns = [
    path('transaction/add/', ExternalTransactionCreateApi.as_view(), name='external_create_transaction'),
    path('transaction/list/', ExternalTransactionListApi.as_view(), name='external_list_transactions'),
    path('transaction/delete/<int:transaction_id>/', ExternalTransactionDeleteApi.as_view(), name='external_delete_transaction'),
    # Public endpoint - no auth required
    path('currencies/', AvailableCurrenciesApi.as_view(), name='available_currencies'),
]
