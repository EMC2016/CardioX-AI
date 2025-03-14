import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import CreateBarChart from "./CreateBarChart"; // Import your D3 chart component

const URL = "a6a5d0b779ab1c.lhr.life";

const normalRangeFemale = {
  bmi: { min: 18.5, max: 24.9 },
  fasting_glucose: { min: 70, max: 99 },
  hdl: { min: 50, max: 80 },
  triglycerides: { min: 0, max: 150 },
  hba1c: { min: 0, max: 5.7 },
  serum_creatinine: { min: 0.59, max: 1.04 },
  alt: { min: 0, max: 30 },
  ast: { min: 8, max: 33 },
};
const normalRangeMale = {
  bmi: { min: 18.5, max: 24.9 },
  fasting_glucose: { min: 70, max: 99 },
  hdl: { min: 40, max: 60 },
  triglycerides: { min: 0, max: 150 },
  hba1c: { min: 0, max: 5.7 },
  serum_creatinine: { min: 0.74, max: 1.35 },
  alt: { min: 0, max: 40 },
  ast: { min: 8, max: 48 },
};

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

function getLatestHypertensionValue(patient) {
  if (!patient || !patient.conditions) return "No data";

  // Filter for all "Hypertension" conditions
  const hypertensionRecords = patient.conditions.filter(
    (obs) => obs.condition.name === "hypertension"
  );

  if (hypertensionRecords.length === 0) return "Not recorded";

  // Find the latest hypertension condition by comparing timestamps
  const latestHypertension = hypertensionRecords.reduce((latest, current) =>
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  );

  return latestHypertension.clinical_status;
}

function getSmokingStatus(patient) {
  if (!patient || !patient.observations_concept) return "No data";

  // Filter for all "smoking" observations
  const smokingRecords = patient.observations_concept.filter(
    (obs) => obs.observation.name === "smoking_status"
  );

  if (smokingRecords.length === 0) return "Not recorded";

  // Find the latest  observation by comparing timestamps
  const lastSmoking = smokingRecords.reduce((latest, current) =>
    new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
  );

  return lastSmoking.value;
}

function groupObservationsByAttribute(patient) {
  if (!patient || !patient.observations_quality) return {};

  return patient.observations_quality.reduce((grouped, obs) => {
    const attribute = obs.observation.name; // Get observation type (e.g., "Blood Pressure")
    if (!grouped[attribute]) {
      grouped[attribute] = [];
    }
    grouped[attribute].push({
      value: obs.value,
      timestamp: new Date(obs.timestamp),
      unit: obs.unit,
    });
    grouped[attribute].sort((a, b) => a.timestamp - b.timestamp);

    return grouped;
  }, {});
}

function FetchAndVisualize({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [normalRange, setNormalRange] = useState(null);

  useEffect(() => {
    if (!patientId) return; // Ensure patientId exists before fetching

    d3.json(`https://${URL}/bpapp/api/patients/${patientId}`)
      .then((patientData) => {
        console.log("Fetched Data:", patientData);
        setPatient(patientData); // ✅ Store patient data

        // ✅ Dynamically set normal range based on gender
        setNormalRange(
          patientData.gender === "male" ? normalRangeMale : normalRangeFemale
        );

        const grouped = groupObservationsByAttribute(patientData);
        setGroupedData(grouped);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [patientId]);

  if (!patient) return <p>Loading patient data...</p>;

  return (
    <div>
      <h2>Patient Information</h2>
      <p>
        <strong>Family Name:</strong> {patient.familyName}
      </p>
      <p>
        <strong>Given Name:</strong> {patient.givenName}
      </p>
      <p>
        <strong>Age:</strong> {calculateAge(patient.birthDate)}
      </p>
      <p>
        <strong>Gender:</strong> {patient.gender}
      </p>
      <p>
        <strong>Hypertension:</strong> {getLatestHypertensionValue(patient)}
      </p>
      <p>
        <strong>Smoking Status:</strong> {getSmokingStatus(patient)}
      </p>
      <hr />

      {/* ✅ Render charts dynamically */}
      {Object.entries(groupedData).map(([category, data]) => (
        <div key={category}>
          <h3>{category}</h3>
          <CreateBarChart
            data={data}
            category={category}
            normalRange={normalRange}
          />
        </div>
      ))}
    </div>
  );
}

export default FetchAndVisualize;
