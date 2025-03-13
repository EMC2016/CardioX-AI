from datetime import datetime
import pandas as pd
from . import models as db
from django.db.models import Max
import json
import os
from django.conf import settings


DEFAULT_VALUES = {
    'BMI': 25.55,
    'HDL': 51.0,
    'Triglycerides': 83.5,
    'Glucose': 101.0,
    'HbA1c': 5.5,
    'SerumCreatinine': 0.76,
    'ALT': 17.0,
    'AST': 19.0
}

def delete_patient(patient_id):
    patient = db.Patient.objects.get(id = patient_id)
    patient.delete()

def save_to_database(data):
    prefetch = data.get("prefetch", {})
    patient_id = prefetch.get("patient", {}).get("id")
    
    """Store json file"""
    backup_path = os.path.join(settings.MEDIA_ROOT,"json_backups")
    json_file_path = os.path.join(backup_path,f"patient_{patient_id}.json")
    with open(json_file_path,"w") as json_file:
        json.dump(data,json_file)
    
    
    current_patient, created = db.Patient.objects.update_or_create(id = patient_id, 
            defaults = {
            "gender": prefetch.get("patient", {}).get("gender"),
            "birthDate" : prefetch.get("patient", {}).get("birthDate"), 
            "familyName" : prefetch.get("patient",{}).get("name")[0].get("family"),
            "givenName" : " ".join(prefetch.get("patient",{}).get("name")[0].get("given")),
            "jsonFilePath" : json_file_path,
            } 
            )
    
    
    
    # Loop through prefetch data
    for category, details in prefetch.items():
        if isinstance(details, dict) and "entry" in details:
            for entry in details["entry"]:
                resource = entry.get("resource", {})
                if resource.get("resourceType")=="Observation":
                    timestamp = resource.get("effectiveDateTime")
                    value = None
                    unit = ""
                    
                    ob_type, created = db.ObservationType.objects.update_or_create(name=category)

                    if "valueQuantity" in resource:
                        value = resource["valueQuantity"]["value"]
                        unit = resource["valueQuantity"].get("unit", "")
                        observation,created = db.ObservationQuantity.objects.update_or_create(patient = current_patient, 
                                                        observation = ob_type,
                                                        value = value, 
                                                        unit = unit,
                                                        timestamp = timestamp,
                                                        )

                    elif "valueCodeableConcept" in resource:
                        value = resource["valueCodeableConcept"]["text"]
                        observation,created = db.ObservationConcept.objects.update_or_create(patient = current_patient, 
                                                        observation = ob_type,
                                                        value = value, 
                                                        timestamp = timestamp,
                                                        )
                        
                elif resource.get("resourceType")=="Condition":
                    condition_type,created = db.ConditionType.objects.update_or_create(name = category)
                    condition,created= db.Condition.objects.update_or_create(
                        patient = current_patient,
                        condition = condition_type,
                        clinical_status = resource.get("clinicalStatus", {}).get("coding", [{}])[0].get("code"),
                        timestamp = resource.get("onsetDateTime")
                    )    
    
def display_patient_data(patient_id):
    try:
        patient = db.Patient.objects.get(id=patient_id)
        print(f"\n📌 Patient Details")
        print(f"ID: {patient.id}")
        print(f"Family Name: {patient.familyName}")
        givenName_list = patient.givenName.split(" ")
        print(f"Given Name: {givenName_list}")
        print(f"Gender: {patient.gender}")
        print(f"Birth Date: {patient.birthDate}")

        print("\n📊 Value Observations:")
        observations_quantity = db.ObservationQuantity.objects.filter(patient=patient).order_by("timestamp")

        grouped_observations_quantity = {}
        for obs in observations_quantity:
            grouped_observations_quantity.setdefault(obs.observation.name, []).append(obs)

        # Print grouped data
        for obs_type, obs_list in grouped_observations_quantity.items():
            for obs in obs_list:
                print(obs) 
              
        print("\n📊 Concept Observations:")
        
        observations_concept = db.ObservationConcept.objects.filter(patient=patient).order_by("timestamp")

        grouped_observations_concept = {}
        for obs in observations_concept:
            grouped_observations_concept.setdefault(obs.observation.name, []).append(obs)

        # Print grouped data
        for obs_type, obs_list in grouped_observations_concept.items():
            for obs in obs_list:
                print(obs) 

        print("\n🩺 Conditions:")
        conditions = db.Condition.objects.filter(patient=patient).order_by("timestamp")

        grouped_conditions = {}
        for obs in conditions:
            grouped_conditions.setdefault(obs.condition.name, []).append(obs)

        # Print grouped data
        for obs_type, obs_list in grouped_conditions.items():
            for obs in obs_list:
                print(obs) 
        
    except db.Patient.DoesNotExist:
        print("Patient not found.")
        
 
def get_latest_observation_quantity(patient_id, observation_name):
    obs = db.ObservationQuantity.objects.filter(patient_id=patient_id,observation__name=observation_name).latest("timestamp")
    return obs.value if obs else None
    
def get_latest_observation_concept(patient_id, observation_name):
    obs = db.ObservationConcept.objects.filter(patient_id=patient_id,observation__name=observation_name).latest("timestamp")
    return obs.value if obs else None
 

def get_latest_condition(patient_id, condition_name):
    cdt =  db.Condition.objects.filter(patient_id=patient_id,condition__name=condition_name).latest("timestamp")
    return cdt.get_clinical_status_display() if cdt else None
    
def extract_latest_data(patient_id):
    patient = db.Patient.objects.get(id=patient_id)
    data = {
        
        "Age": patient.birthDate,  
        "Gender": patient.gender,
        
        "BMI": get_latest_observation_quantity(patient_id,"bmi"),
        "Hypertension": get_latest_condition(patient_id,"hypertension")=="Active",
        "Glucose": get_latest_observation_quantity(patient_id,"fasting_glucose"),
        "HDL":get_latest_observation_quantity(patient_id,"hdl"),
        "Triglycerides": get_latest_observation_quantity(patient_id,"triglycerides"),
        "Smoking": get_latest_observation_concept(patient_id,"smoking_status"),
        "HbA1c": get_latest_observation_quantity(patient_id,"hba1c"),
        "SerumCreatinine": get_latest_observation_quantity(patient_id,"serum_creatinine"),
        "ALT": get_latest_observation_quantity(patient_id,"alt"),
        "AST": get_latest_observation_quantity(patient_id,"ast"),
        
    }
    
            # Convert birthdate to age (assuming today's date)
    if data["Age"]:
        data["Age"] = datetime.today().year - data["Age"].year
    if data["Hypertension"]=="Resolved":
        data["Hypertension"]=0
    else:
        data["Hypertension"]=1
        
    smoking_map = {
        "Never smoked tobacco (finding)": 0,
        "Ex-smoker (finding)": 1,
        "Current smoker (finding)": 1
    }
    gender_map = {"male": 1, "female": 2}
    # Convert Smoking Status to 0 or 1
    data["Smoking"] = smoking_map.get(data["Smoking"], 0)
    data["Gender"] = gender_map.get(data["Gender"],0)
    
    
    for attr,val in data.items():
        if val is None:
            data[attr] = DEFAULT_VALUE[attr]
    
    df_patient = pd.DataFrame([data])
    print(df_patient)
   
    
    return df_patient

    
