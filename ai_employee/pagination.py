from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 50


def paginate_queryset(request, queryset, view=None):
    """Apply the global pagination class and return (paginator, page_or_None)."""
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    return paginator, page
