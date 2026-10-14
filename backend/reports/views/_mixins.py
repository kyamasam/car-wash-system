from datetime import date
from rest_framework.exceptions import ValidationError
from reports.services.utils import resolve_branch_ids, parse_date, current_month_start


class ReportFilterMixin:
    """
    Parses start_date, end_date, granularity, branch, and worker query params.
    Provides self.get_report_filters() returning a dict of validated params.
    """

    def get_report_filters(self):
        params = self.request.query_params
        today = date.today()

        start_date = parse_date(params.get("start_date"), current_month_start())
        end_date = parse_date(params.get("end_date"), today)

        if end_date < start_date:
            raise ValidationError({"end_date": "end_date must be on or after start_date."})

        granularity = params.get("granularity", "day")
        if granularity not in ("day", "week", "month"):
            raise ValidationError({"granularity": "Must be day, week, or month."})

        branch_id = params.get("branch") or None
        worker_id = params.get("worker") or None

        branch_ids = resolve_branch_ids(self.request.user, branch_id)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "granularity": granularity,
            "branch_id": branch_id,
            "worker_id": worker_id,
            "branch_ids": branch_ids,
        }
