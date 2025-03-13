from django.urls import path
from .views import *

urlpatterns = [
    
    path("cds-services/",discovery_cds_services,name="discovery"),
    path("cds-services/<str:app_id>",check_id,name = "check_id"),#This verifies the app user is valid by checking id is correct. 
    path("api/patients/<str:patient_id>/", get_patient_by_id, name="get_patient_by_id"),#For Vite to get patient data by patient_id.
]