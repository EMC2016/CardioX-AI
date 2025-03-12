from django.db import models

class Patient(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    birthDate = models.DateField(null=True, blank=True)
    familyName = models.CharField(max_length=20, null=True, blank=True)
    givenName = models.CharField(max_length=50,null = True, blank = True)
  
    # create rawdata attributes to store original json data.
       
    def __str__(self):
        return f"{self.id}-{self.givenName}-{self.familyName}"
    
class ObservationType(models.Model):
    name = models.CharField( max_length=50)
    def __str__(self):
        return self.name
    
class ConditionType(models.Model):
    name = models.CharField( max_length=50)
    def __str__(self):
        return self.name
    

# The observation values are digits.
class ObservationQuantity(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="observations_quality")
    observation = models.ForeignKey(ObservationType, on_delete=models.CASCADE, related_name="observations_quality")
    value = models.FloatField(null=True, blank=True)  # Numeric values like BMI, glucose, etc.
    unit = models.CharField(max_length=20, null=True, blank=True)
    timestamp = models.DateTimeField()
    
    def __str__(self):
        return f"- {self.observation}: {self.value} {self.unit} (Time: {self.timestamp})"
    
    class Meta:
        ordering = ["timestamp"] 

# The observation values are texts.
class ObservationConcept(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="observations_concept")
    observation = models.ForeignKey(ObservationType, on_delete=models.CASCADE, related_name="observations_concept")
    value = models.CharField(max_length=50, null=True, blank=True)  # Numeric values like BMI, glucose, etc.
    timestamp = models.DateTimeField()
    
    def __str__(self):
        return f"  - {self.observation}: {self.value} (Time: {self.timestamp})"
    
    
    class Meta:
        ordering = ["timestamp"] 
    

class Condition(models.Model):
    CLINICAL_STATUS_CHOICES = [
        ("active", "Active"),
        ("recurrence", "Recurrence"),
        ("relapse", "Relapse"),
        ("inactive", "Inactive"),
        ("remission", "Remission"),
        ("resolved", "Resolved"),
    ]
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="conditions")
    condition = models.ForeignKey(ConditionType, on_delete=models.CASCADE, related_name="conditions") 
    clinical_status = models.CharField(
        max_length=20,
        choices=CLINICAL_STATUS_CHOICES,
        default="active"
    )
   
    timestamp = models.DateTimeField()
    
    def __str__(self):
        return f"{self.condition.name} ({self.get_clinical_status_display()}), Diagnosed on: {self.timestamp}"
    
    class Meta:
        ordering = ["timestamp"] 
    
class CVDPrediction(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="CVDPrediction")
    probability = models.FloatField(null = True,blank = True)
    model_version = models.CharField(max_length=50, null=True, blank=True)  # Version of ML model used
    explanation = models.TextField(null=True, blank=True)  # Explanation of the prediction
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ["timestamp"]
    
    

   
