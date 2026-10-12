from users.models import Profile
from rest_framework import serializers


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["id", "tagline","description", "profile_photo", 
                  "user_id", "cover_photo", "created_at", "updated_at"]
        read_only_fields = ["user_id", ]

    def create(self, validated_data):
        user = self.context["request"].user
        prof = Profile.objects.filter(user_id=user.id)
        if prof.count() > 0:
            new_prof = prof[0]
            new_prof.tagline = validated_data["tagline"]
            new_prof.description = validated_data["description"]
            new_prof.save()
            return new_prof
        else:
            Profile.objects.create(user=user, **validated_data)
        return Profile

    def update(self, instance, validated_data):
        profile = super().update(instance, validated_data)
        return profile
