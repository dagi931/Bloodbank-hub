const { mainDb, labDb } = require("../src/config/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  console.log("Start seeding...");

  // 1. Hash passwords
  const adminHash = bcrypt.hashSync("admin123", 10);

  // 2. Clear existing PostgreSQL tables
  await mainDb.emailVerification.deleteMany({});
  await mainDb.sentSmsLog.deleteMany({});
  await mainDb.bloodSample.deleteMany({});
  await mainDb.donor.deleteMany({});
  await mainDb.warehouseStock.deleteMany({});
  await mainDb.hospitalStock.deleteMany({});
  await mainDb.hospitalRequest.deleteMany({});
  await mainDb.hospitalInterRequest.deleteMany({});
  await mainDb.announcement.deleteMany({});
  await mainDb.user.deleteMany({});

  // 3. Clear existing Lab database tables
  await labDb.labMedicalRecord.deleteMany({});

  // 4. Seed only the central Admin user
  const admin = await mainDb.user.create({
    data: {
      email: "admin@bloodbank.org",
      password_hash: adminHash,
      role: "admin",
      status: "approved",
      entity_name: "Central Administration",
    },
  });

  console.log("Seeded admin user.");

  // 5. Seed FAYDA donors in PostgreSQL (mock national registry)
  // These represent profile cards that can be pre-filled during donor registration
  const donor1 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-001",
      name: "Daniel worku",
      phone: "0966393660",
      dob: new Date("1990-05-15"),
      gender: "Male",
      address: "Bole, Addis Ababa",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  const donor2 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-002",
      name: "Marta Kebede",
      phone: "+251912345678",
      dob: new Date("1995-08-20"),
      gender: "Female",
      address: "Kazanchis, Addis Ababa",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  const donor3 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-003",
      name: "Almaz Tolosa",
      phone: "+251913456789",
      dob: new Date("1988-12-02"),
      gender: "Female",
      address: "Hawassa",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  const donor4 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-004",
      name: "Bekele Lemma",
      phone: "+251914567890",
      dob: new Date("1982-03-30"),
      gender: "Male",
      address: "Adama",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  const donor5 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-005",
      name: "Adnan Abdulkadr",
      phone: "+251985340573",
      dob: new Date("1997-10-12"),
      gender: "Male",
      address: "Bahir Dar",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  const donor6 = await mainDb.donor.create({
    data: {
      fayda_id: "ET-006",
      name: "Samuel Negash",
      phone: "+251916789012",
      dob: new Date("1992-06-18"),
      gender: "Male",
      address: "Mekelle",
      blood_type: "UNKNOWN",
      last_donation_date: null,
      health_status: "unknown",
      points: 0,
    },
  });

  console.log("Seeded PostgreSQL FAYDA donor profiles.");

  // 6. Seed Lab Database records (Patient Medical Profiles)
  // This enables emergency lookups for seeded national IDs right away
  await labDb.labMedicalRecord.create({
    data: {
      faydaId: "ET-001",
      name: "Daniel worku",
      phone: "0966393660",
      bloodType: "A+",
      diseases: "HIV: Negative, Syphilis: Negative, Hepatitis B: Negative",
      hemoglobin: "14.8 g/dL",
      platelets: "250,000 /mcL",
      allergies: "None",
      otherNotes: "Fit donor, clean test history.",
      updatedAt: new Date(),
    },
  });

  await labDb.labMedicalRecord.create({
    data: {
      faydaId: "ET-002",
      name: "Marta Kebede",
      phone: "+251912345678",
      bloodType: "O-",
      diseases: "HIV: Negative, Syphilis: Negative, Hepatitis B: Negative",
      hemoglobin: "12.5 g/dL",
      platelets: "300,000 /mcL",
      allergies: "Penicillin",
      otherNotes: "Universal donor. Clean tests.",
      updatedAt: new Date(),
    },
  });

  console.log("Seeded Lab Database records.");
  console.log("Seeding completed successfully.");
}

main().catch((e) => {
  console.error("Seeding error:", e);
  process.exit(1);
});
