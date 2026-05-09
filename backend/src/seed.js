function isoNow() {
  return new Date().toISOString();
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function createSeedData() {
  const patientAliceId = "patient-alice-001";
  const patientMarcusId = "patient-marcus-001";
  const patientSofiaId = "patient-sofia-001";
  const doctorId = "doctor-robert-001";
  const pharmacistId = "pharmacy-healthcare-001";
  const pharmacistTwoId = "pharmacy-manish-001";

  return {
    users: [
      {
        id: patientAliceId,
        email: "patient@demo.com",
        name: "Alice Johnson",
        role: "patient",
        password: "Patient@2025!",
        date_of_birth: "1990-05-15",
        blood_type: "O+",
        phone: "+1-555-0101",
        medical_history: [
          { condition: "Hypertension", diagnosed: "2020-01-10", status: "active" },
          { condition: "Type 2 Diabetes", diagnosed: "2019-06-22", status: "active" }
        ],
        allergies: ["Penicillin", "Sulfa drugs"],
        created_at: daysAgo(30)
      },
      {
        id: patientMarcusId,
        email: "marcus@demo.com",
        name: "Marcus Lee",
        role: "patient",
        password: "Patient@2025!",
        date_of_birth: "1985-11-03",
        blood_type: "A+",
        phone: "+1-555-0102",
        medical_history: [
          { condition: "Asthma", diagnosed: "2016-03-14", status: "active" }
        ],
        allergies: ["Dust"],
        created_at: daysAgo(22)
      },
      {
        id: patientSofiaId,
        email: "sofia@demo.com",
        name: "Sofia Patel",
        role: "patient",
        password: "Patient@2025!",
        date_of_birth: "1996-08-20",
        blood_type: "B+",
        phone: "+1-555-0103",
        medical_history: [
          { condition: "Migraine", diagnosed: "2022-09-01", status: "active" }
        ],
        allergies: [],
        created_at: daysAgo(14)
      },
      {
        id: doctorId,
        email: "doctor@demo.com",
        name: "Dr. Robert Chen",
        role: "doctor",
        password: "Doctor@2025!",
        specialization: "Internal Medicine",
        license_number: "MD-2021-78432",
        phone: "+1-555-0202",
        created_at: daysAgo(30)
      },
      {
        id: pharmacistId,
        email: "pharmacist@demo.com",
        name: "Sarah Williams",
        role: "pharmacist",
        password: "Pharma@2025!",
        pharmacy_name: "HealthCare Pharmacy",
        license_number: "RPH-2019-11234",
        phone: "+1-555-0303",
        created_at: daysAgo(30)
      },
      {
        id: pharmacistTwoId,
        email: "manish@gmail.com",
        name: "Manish",
        role: "pharmacist",
        password: "Pharma@2025!",
        pharmacy_name: "Manish Pharma",
        license_number: "RPH-903-067",
        phone: "",
        created_at: daysAgo(10)
      }
    ],
    sessions: [],
    prescriptions: [
      {
        id: "rx-001",
        patient_id: patientAliceId,
        pharmacy_id: pharmacistId,
        prescriber_id: doctorId,
        prescriber_name: "Dr. Robert Chen",
        patient_name: "Alice Johnson",
        pharmacy_name: "HealthCare Pharmacy",
        medication_name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "30 days",
        notes: null,
        diagnosis: "Type 2 Diabetes",
        status: "rejected",
        created_at: daysAgo(6),
        updated_at: daysAgo(5)
      },
      {
        id: "rx-002",
        patient_id: patientAliceId,
        pharmacy_id: pharmacistId,
        prescriber_id: doctorId,
        prescriber_name: "Dr. Robert Chen",
        patient_name: "Alice Johnson",
        pharmacy_name: "HealthCare Pharmacy",
        medication_name: "Paracetamol",
        dosage: "500mg",
        frequency: "Twice daily",
        duration: "7 days",
        notes: "Give particular advice to patient",
        diagnosis: "Viral fever",
        status: "fulfilled",
        created_at: daysAgo(3),
        updated_at: daysAgo(2)
      },
      {
        id: "rx-003",
        patient_id: patientMarcusId,
        pharmacy_id: pharmacistTwoId,
        prescriber_id: doctorId,
        prescriber_name: "Dr. Robert Chen",
        patient_name: "Marcus Lee",
        pharmacy_name: "Manish Pharma",
        medication_name: "Albuterol Inhaler",
        dosage: "2 puffs",
        frequency: "As needed",
        duration: "30 days",
        notes: "Monitor rescue inhaler usage",
        diagnosis: "Asthma",
        status: "pending",
        created_at: isoNow(),
        updated_at: isoNow()
      }
    ],
    notifications: [
      {
        id: "notif-001",
        pharmacy_id: pharmacistId,
        prescription_id: "rx-001",
        type: "new_prescription",
        medication_name: "Metformin",
        patient_name: "Alice Johnson",
        prescriber_name: "Dr. Robert Chen",
        created_at: daysAgo(6),
        read: false
      },
      {
        id: "notif-002",
        pharmacy_id: pharmacistId,
        prescription_id: "rx-002",
        type: "new_prescription",
        medication_name: "Paracetamol",
        patient_name: "Alice Johnson",
        prescriber_name: "Dr. Robert Chen",
        created_at: daysAgo(3),
        read: false
      }
    ]
  };
}
