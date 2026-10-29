from rest_framework import serializers

from commons.models import Business, Branch


class BusinessSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    receipt_footer = serializers.CharField(required=False, allow_blank=True, max_length=500)
    job_card_footer = serializers.CharField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = Business
        fields = "__all__"
        read_only_fields = ["primary_user"]

    def to_internal_value(self, data):
        # Multipart clients send logo="" to clear the logo.
        if hasattr(data, "get") and data.get("logo") == "":
            data = {**data.dict(), "logo": None} if hasattr(data, "dict") else {**data, "logo": None}
        return super().to_internal_value(data)

    def validate_currency(self, value):
        if self.instance and self.instance.currency and value != self.instance.currency:
            raise serializers.ValidationError("Currency cannot be changed once set.")
        return value


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = "__all__"
