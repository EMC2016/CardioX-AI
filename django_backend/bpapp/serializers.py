from rest_framework import serializers
from .models import (
    Patient, ObservationQuantity, ObservationConcept, Condition, 
    ObservationType, ConditionType
)

class ObservationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservationType
        fields = ["id", "name"]

class ConditionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConditionType
        fields = ["id", "name"]

class ObservationQuantitySerializer(serializers.ModelSerializer):
    observation = ObservationTypeSerializer()  # Include observation type details

    class Meta:
        model = ObservationQuantity
        fields = ["observation", "value", "unit", "timestamp"]

class ObservationConceptSerializer(serializers.ModelSerializer):
    observation = ObservationTypeSerializer()  # Include observation type details

    class Meta:
        model = ObservationConcept
        fields = ["observation", "value", "timestamp"]

class ConditionSerializer(serializers.ModelSerializer):
    condition = ConditionTypeSerializer()  # Include condition type details

    class Meta:
        model = Condition
        fields = ["condition", "clinical_status", "timestamp"]

class PatientSerializer(serializers.ModelSerializer):
    observations_quality = ObservationQuantitySerializer(many=True, read_only=True)
    observations_concept = ObservationConceptSerializer(many=True, read_only=True)
    conditions = ConditionSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ["id", "gender", "birthDate", "familyName", "givenName", 
                  "jsonFilePath", "observations_quality", "observations_concept", "conditions"]
