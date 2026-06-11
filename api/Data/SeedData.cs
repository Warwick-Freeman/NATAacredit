using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using NexusApi.Models;

namespace NexusApi.Data;

public static class SeedData
{
    public static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return "";
        html = Regex.Replace(html, @"<(script|style)[^>]*>[\s\S]*?</\1>", " ", RegexOptions.IgnoreCase);
        html = Regex.Replace(html, @"<[^>]+>", " ");
        html = System.Net.WebUtility.HtmlDecode(html);
        return Regex.Replace(html, @"\s+", " ").Trim();
    }

    private static string Wf(params object[] steps) =>
        JsonSerializer.Serialize(steps, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

    private static object Step(string step, string who, string date = "—",
        bool done = false, bool active = false, bool rejected = false, string comment = "") =>
        new { step, who, date, done, active, rejected, comment };

    private static readonly JsonSerializerOptions CamelCase = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static string J(object? obj) => JsonSerializer.Serialize(obj, CamelCase);

    public static void SeedPatients(NexusDbContext db)
    {
        if (db.Patients.Any()) return;

        var patients = new[]
        {
            new Patient {
                PatientId = "PAT-001", Name = "R. Kingston", Initials = "RK", Dob = "1974-06-12", Sex = "M",
                Mrn = "MRN-4412", Site = "Riverside Main Lab", Status = "active",
                Referrer = "Dr. H. Williams (GP)", Physician = "Dr. R. Okafor", NextReview = "2026-07-20",
                DiagnosesJson  = J(new[]{"Severe OSA (AHI 42.3/h)","Hypertension","Type 2 DM"}),
                StudiesJson    = J(new[]{"PSG-2024-018","PSG-2026-0441"}),
                AlertsJson     = J(new[]{"Compliance 61% — below 70% Medicare threshold"}),
                TreatmentJson  = J(new{ type="CPAP", provider="resmed", device="ResMed AirSense 11 AutoSet", serial="RS-24-7734821", startDate="2024-09-12", prescription=new{mode="APAP",pMin=8,pMax=12,mask="ResMed AirFit F20 (Full face)",humidifier="Auto"}}),
                ComplianceJson = J(new{ rate=61, meanUsage=4.1, meanAhi=3.2, p90Pressure=10.4, meanLeak=12, lastSync="2026-05-15"}),
                ContactJson    = J(new{ phone="0412 345 678", email="r.kingston@email.com.au", address=new{line1="42 Riverside Drive",line2="",suburb="Richmond",state="VIC",postcode="3121"}, emergencyContact=new{name="Jane Kingston",relationship="Spouse",phone="0409 876 543"}}),
            },
            new Patient {
                PatientId = "PAT-002", Name = "T. Nguyen", Initials = "TN", Dob = "1989-09-03", Sex = "M",
                Mrn = "MRN-4387", Site = "Riverside Main Lab", Status = "active",
                Referrer = "Dr. K. Cheng (Cardiologist)", Physician = "Dr. R. Okafor", NextReview = "2026-08-03",
                DiagnosesJson  = J(new[]{"Moderate OSA (AHI 18.7/h)","Obesity BMI 33.2"}),
                StudiesJson    = J(new[]{"PSG-2025-003","PSG-2026-0440"}),
                AlertsJson     = J(Array.Empty<string>()),
                TreatmentJson  = J(new{ type="CPAP", provider="resmed", device="ResMed AirSense 11 AutoSet", serial="RS-24-8821034", startDate="2025-02-03", prescription=new{mode="APAP",pMin=6,pMax=10,mask="ResMed AirFit N30i (Nasal cradle)",humidifier="Auto"}}),
                ComplianceJson = J(new{ rate=89, meanUsage=6.8, meanAhi=1.4, p90Pressure=8.8, meanLeak=6, lastSync="2026-05-15"}),
                ContactJson    = J(new{ phone="0421 987 654", email="t.nguyen@gmail.com", address=new{line1="8 St Kilda Road",line2="Apt 14",suburb="St Kilda",state="VIC",postcode="3182"}, emergencyContact=new{name="Linh Nguyen",relationship="Spouse",phone="0418 234 567"}}),
            },
            new Patient {
                PatientId = "PAT-003", Name = "D. Mitchell", Initials = "DM", Dob = "1955-04-08", Sex = "M",
                Mrn = "MRN-4301", Site = "Riverside Main Lab", Status = "active",
                Referrer = "Dr. P. Nguyen (Cardiologist)", Physician = "Dr. R. Okafor", NextReview = "2026-06-18",
                DiagnosesJson  = J(new[]{"Severe OSA (AHI 58.1/h)","Atrial fibrillation","CHF (EF 45%)"}),
                StudiesJson    = J(new[]{"PSG-2023-041","PSG-2023-055","PSG-2026-0438"}),
                AlertsJson     = J(new[]{"Review date approaching — 33 days"}),
                TreatmentJson  = J(new{ type="BiPAP", provider="philips", device="Philips DreamStation 2 Auto BiPAP", serial="PH-23-5512789", startDate="2023-05-18", prescription=new{mode="Auto BiPAP",ipap=14,epap=8,mask="Philips DreamWear Full Face",humidifier="Heated tube"}}),
                ComplianceJson = J(new{ rate=94, meanUsage=7.2, meanAhi=2.8, p90Pressure=(double?)null, meanLeak=9, lastSync="2026-05-14"}),
                ContactJson    = J(new{ phone="0435 111 222", email="d.mitchell@outlook.com", address=new{line1="17 Hawthorn Street",line2="",suburb="Hawthorn",state="VIC",postcode="3122"}, emergencyContact=new{name="Carol Mitchell",relationship="Spouse",phone="0407 333 444"}}),
            },
            new Patient {
                PatientId = "PAT-004", Name = "L. Walsh", Initials = "LW", Dob = "2012-02-14", Sex = "F",
                Mrn = "MRN-4455", Site = "Eastside Paediatric Lab", Status = "monitoring",
                Referrer = "Dr. M. Fisher (Paediatric ENT)", Physician = "Dr. L. Hartono", NextReview = "2026-09-10",
                DiagnosesJson  = J(new[]{"Paediatric OSA — post-adenotonsillectomy monitoring"}),
                StudiesJson    = J(new[]{"PSG-2026-0439"}),
                AlertsJson     = J(Array.Empty<string>()),
                TreatmentJson  = "null", ComplianceJson = "null",
                ContactJson    = J(new{ phone="0398 654 321", email="walsh.family@iinet.net.au", address=new{line1="5 Doncaster Road",line2="",suburb="Doncaster",state="VIC",postcode="3108"}, emergencyContact=new{name="Mark Walsh",relationship="Parent",phone="0412 654 321"}}),
            },
            new Patient {
                PatientId = "PAT-005", Name = "S. Carter", Initials = "SC", Dob = "1998-07-17", Sex = "F",
                Mrn = "MRN-4398", Site = "Riverside Main Lab", Status = "active",
                Referrer = "Dr. J. Park (Neurologist)", Physician = "Dr. R. Okafor", NextReview = "2026-07-01",
                DiagnosesJson  = J(new[]{"Narcolepsy Type 1 (CSF hypocretin <110 pg/mL)","Cataplexy confirmed"}),
                StudiesJson    = J(new[]{"PSG-2025-008","MSLT-2026-0031"}),
                AlertsJson     = J(Array.Empty<string>()),
                TreatmentJson  = J(new{ type="Medication", provider=(string?)null, device=(string?)null, serial=(string?)null, startDate="2025-06-01", prescription=new{mode="Modafinil 200mg mane + Sodium oxybate 4.5g nocte",mask=(string?)null}}),
                ComplianceJson = "null",
                ContactJson    = J(new{ phone="0447 222 333", email="s.carter@student.unimelb.edu.au", address=new{line1="33 Johnston Street",line2="Unit 7",suburb="Fitzroy",state="VIC",postcode="3065"}, emergencyContact=new{name="Helen Carter",relationship="Mother",phone="0388 445 566"}}),
            },
            new Patient {
                PatientId = "PAT-006", Name = "P. Brown", Initials = "PB", Dob = "1968-11-22", Sex = "F",
                Mrn = "MRN-4471", Site = "Home Service – North", Status = "awaiting-study",
                Referrer = "Dr. S. Adams (GP)", Physician = "Dr. F. Liu", NextReview = "",
                DiagnosesJson  = J(new[]{"Suspected OSA (Epworth 16/24)","Hypothyroidism","Obesity BMI 31.4"}),
                StudiesJson    = J(new[]{"HSAT-2026-0218"}),
                AlertsJson     = J(new[]{"HSAT-2026-0218 in scoring — report pending"}),
                TreatmentJson  = "null", ComplianceJson = "null",
                ContactJson    = J(new{ phone="0393 887 766", email="patricia.brown@bigpond.com", address=new{line1="102 Brunswick Road",line2="",suburb="Brunswick",state="VIC",postcode="3056"}, emergencyContact=new{name="Gary Brown",relationship="Spouse",phone="0414 556 677"}}),
            },
            new Patient {
                PatientId = "PAT-007", Name = "A. Park", Initials = "AP", Dob = "1971-01-29", Sex = "M",
                Mrn = "MRN-4329", Site = "Eastside Paediatric Lab", Status = "active",
                Referrer = "Dr. K. Cheng (Cardiologist)", Physician = "Dr. F. Liu", NextReview = "2026-10-28",
                DiagnosesJson  = J(new[]{"Severe OSA (AHI 37.8/h)","Hypertension","Obesity BMI 34.1"}),
                StudiesJson    = J(new[]{"PSG-2026-0437"}),
                AlertsJson     = J(Array.Empty<string>()),
                TreatmentJson  = J(new{ type="CPAP", provider="fp", device="Fisher & Paykel SleepStyle 650", serial="FP-26-3301122", startDate="2026-04-28", prescription=new{mode="APAP",pMin=7,pMax=14,mask="F&P Evora Full Face",humidifier="Integrated"}}),
                ComplianceJson = J(new{ rate=72, meanUsage=5.1, meanAhi=4.8, p90Pressure=11.2, meanLeak=18, lastSync="2026-05-13"}),
                ContactJson    = J(new{ phone="0398 123 456", email="a.park@kew.net.au", address=new{line1="29 Cotham Road",line2="",suburb="Kew",state="VIC",postcode="3101"}, emergencyContact=new{name="Susan Park",relationship="Spouse",phone="0402 789 012"}}),
            },
            new Patient {
                PatientId = "PAT-008", Name = "M. Torres", Initials = "MT", Dob = "1983-05-15", Sex = "F",
                Mrn = "MRN-4489", Site = "Home Service – North", Status = "active",
                Referrer = "Dr. T. Brown (GP)", Physician = "Dr. F. Liu", NextReview = "2026-08-20",
                DiagnosesJson  = J(new[]{"Moderate OSA (AHI 22.4/h) — confirmed HSAT-2026-0217","Excessive daytime sleepiness (ESS 14/24)"}),
                StudiesJson    = J(new[]{"HSAT-2026-0217"}),
                AlertsJson     = J(new[]{"CPAP prescription pending — report signed 09 May 2026"}),
                TreatmentJson  = "null", ComplianceJson = "null",
                ContactJson    = J(new{ phone="0411 765 432", email="maria.torres@hotmail.com", address=new{line1="14 Murray Road",line2="Unit 3",suburb="Preston",state="VIC",postcode="3072"}, emergencyContact=new{name="Carlos Torres",relationship="Spouse",phone="0423 876 543"}}),
            },
        };

        var now = DateTime.Now.ToString("yyyy-MM-ddTHH:mm:ss");
        foreach (var p in patients) p.CreatedAt = now;
        db.Patients.AddRange(patients);
        db.SaveChanges();
    }

    public static void SeedUsers(NexusDbContext db)
    {
        if (db.Users.Any()) return;

        var seedUsers = new[]
        {
            new AppUser { Email = "kavya.patel@nexus360.com",   Name = "K. Patel",                  Role = "Quality Manager",           Mfa = true, Auth = "Local", Sites = "[]" },
            new AppUser { Email = "rafael.okafor@nexus360.com", Name = "Dr. R. Okafor",              Role = "Medical Director",           Mfa = true, Auth = "Local", Sites = "[]" },
            new AppUser { Email = "lily.hartono@nexus360.com",  Name = "Dr. L. Hartono",             Role = "Paediatric Sleep Physician", Mfa = true, Auth = "Local", Sites = "[\"Eastside Paediatric Lab\"]" },
            new AppUser { Email = "meilin.chen@nexus360.com",   Name = "M. Chen",                    Role = "Senior Technologist",        Mfa = true, Auth = "Local", Sites = "[\"Riverside Main Lab\"]" },
            new AppUser { Email = "arjun.singh@nexus360.com",   Name = "A. Singh",                   Role = "Scoring Technologist",       Mfa = true, Auth = "Local", Sites = "[\"Riverside Main Lab\",\"Eastside Paediatric Lab\"]" },
            new AppUser { Email = "j.roy@nexus360.com",         Name = "J. Roy",                     Role = "External Auditor",           Mfa = true, Auth = "Local", Sites = "[]" },
            new AppUser { Email = "assessor@nata.gov.au",       Name = "NATA Assessor (time-boxed)", Role = "External Assessor",          Mfa = true, Auth = "Local", Sites = "[]" },
        };

        foreach (var u in seedUsers)
            u.PasswordHash = HashPassword("demo");

        db.Users.AddRange(seedUsers);
        db.SaveChanges();
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static void ImportSopDirectory(NexusDbContext db, string sopDir, string dataDir)
    {
        if (!Directory.Exists(sopDir)) return;

        var files = Directory.GetFiles(sopDir, "*.html");
        var existingIds = db.Documents.Select(d => d.DocId).ToHashSet();
        bool anyAdded = false;

        foreach (var filePath in files.OrderBy(f => f))
        {
            var baseName = Path.GetFileNameWithoutExtension(filePath);
            var sep = baseName.IndexOf('_');
            if (sep <= 0) continue;
            var docId = baseName[..sep];
            var titleRaw = baseName[(sep + 1)..];
            if (!docId.Contains('-')) continue;
            if (existingIds.Contains(docId)) continue;

            var title = titleRaw.Replace('_', ' ').Trim();
            var folder = docId.StartsWith("FRM")  ? "forms"
                       : docId.StartsWith("REG")  ? "records"
                       : docId.StartsWith("POL-") ? "policies"
                       : "sops";
            var status = folder == "forms" ? "Live form" : "Issued";
            var owner = docId switch
            {
                _ when docId.StartsWith("SOP-PSG") => "Dr. R. Okafor",
                _ when docId.StartsWith("SOP-EQ")  => "M. Chen",
                _ when docId.StartsWith("SOP-RPT") => "Dr. R. Okafor",
                _ when docId.StartsWith("SOP-TX")  => "Dr. R. Okafor",
                _ when docId.StartsWith("SOP-QC")  => "Dr. R. Okafor",
                _ when docId.StartsWith("PRO-LAB") => "M. Chen",
                _ when docId.StartsWith("PRO-HST") => "M. Chen",
                _ when docId.StartsWith("POL-NET") => "Dr. R. Okafor",
                _ when docId.StartsWith("POL-LAB") => "M. Chen",
                _ when docId.StartsWith("POL-HST") => "M. Chen",
                _ => "K. Patel",
            };

            var storedName = docId + ".html";
            var destPath = Path.Combine(dataDir, storedName);
            File.Copy(filePath, destPath, overwrite: true);

            var rawHtml = File.ReadAllText(filePath);
            var contentText = StripHtml(rawHtml);
            var isForm   = folder == "forms";
            var importDate  = DateTime.Now.ToString("dd MMM yyyy");
            var reviewDate  = DateTime.Now.AddMonths(isForm ? 12 : 24).ToString("dd MMM yyyy");
            var wfJson = Wf(
                Step("Draft",           owner,  importDate, done: true),
                Step("Peer review",     owner,  importDate, done: true),
                Step("Approval",        owner,  importDate, done: true),
                Step("Issue",           owner,  importDate, done: true),
                Step("Periodic review", isForm ? "+12 mo" : "+24 mo", reviewDate)
            );

            db.Documents.Add(new Document
            {
                DocId          = docId,
                Title          = title,
                Version        = "1.0",
                Status         = status,
                Folder         = folder,
                Owner          = owner,
                Clauses        = "",
                ReviewDue      = reviewDate,
                Updated        = importDate,
                FileType       = "html",
                FileName       = Path.GetFileName(filePath),
                StoredFileName = storedName,
                ContentText    = contentText,
                Workflow       = wfJson,
            });

            existingIds.Add(docId);
            anyAdded = true;
        }

        if (anyAdded) db.SaveChanges();
    }

    public static void SeedDocuments(NexusDbContext db)
    {
        if (db.Documents.Any()) return;

        db.Documents.AddRange(
            new Document
            {
                DocId = "SOP-PSG-031", Title = "Pre-study bio-signal verification",
                Version = "3.2", Status = "Issued", Folder = "sops", ReviewDue = "12 Mar 2027",
                Owner = "M. Chen", Clauses = "5.3.4,5.5.2", Updated = "21 Apr 2026",
                Workflow = Wf(
                    Step("Draft",           "M. Chen",       "01 Mar 2026", done: true),
                    Step("Peer review",     "K. Patel",      "08 Mar 2026", done: true, comment: "Reviewed — no issues."),
                    Step("Approval",        "Dr. R. Okafor", "12 Mar 2026", done: true, comment: "Approved for issue."),
                    Step("Issue",           "K. Patel",      "21 Apr 2026", done: true),
                    Step("Periodic review", "+24 mo",        "12 Mar 2027"))
            },
            new Document
            {
                DocId = "SOP-PSG-014", Title = "Adult attended PSG protocol",
                Version = "3.2", Status = "Issued", Folder = "sops", ReviewDue = "08 Jul 2027",
                Owner = "Dr. R. Okafor", Clauses = "5.5.3", Updated = "14 Apr 2026",
                Workflow = Wf(
                    Step("Draft",           "Dr. R. Okafor", "01 Mar 2026", done: true),
                    Step("Peer review",     "M. Chen",       "10 Mar 2026", done: true, comment: "Reviewed — minor wording update in section 3."),
                    Step("Approval",        "Dr. R. Okafor", "15 Mar 2026", done: true),
                    Step("Issue",           "K. Patel",      "14 Apr 2026", done: true),
                    Step("Periodic review", "+24 mo",        "08 Jul 2028"))
            },
            new Document
            {
                DocId = "SOP-PED-007", Title = "Paediatric attended PSG protocol",
                Version = "2.1", Status = "Issued", Folder = "sops", ReviewDue = "22 Sep 2027",
                Owner = "Dr. L. Hartono", Clauses = "5.5.3.2,5.8.5", Updated = "18 Mar 2026",
                Workflow = Wf(
                    Step("Draft",           "Dr. L. Hartono", "01 Feb 2026", done: true),
                    Step("Peer review",     "M. Chen",        "10 Feb 2026", done: true, comment: "Reviewed — EEG montage updated for age <6."),
                    Step("Approval",        "Dr. R. Okafor",  "18 Feb 2026", done: true),
                    Step("Issue",           "K. Patel",       "18 Mar 2026", done: true),
                    Step("Periodic review", "+24 mo",         "22 Sep 2028"))
            },
            new Document
            {
                DocId = "SOP-EQP-004", Title = "Equipment acceptance testing",
                Version = "1.4", Status = "Issued", Folder = "sops", ReviewDue = "01 Jun 2028",
                Owner = "M. Chen", Clauses = "5.3.2", Updated = "30 Mar 2026",
                Workflow = Wf(
                    Step("Draft",           "M. Chen",       "01 Feb 2026", done: true),
                    Step("Peer review",     "K. Patel",      "10 Feb 2026", done: true, comment: "Reviewed — acceptance criteria table updated."),
                    Step("Approval",        "Dr. R. Okafor", "20 Feb 2026", done: true),
                    Step("Issue",           "K. Patel",      "30 Mar 2026", done: true),
                    Step("Periodic review", "+24 mo",        "01 Jun 2028"))
            },
            new Document
            {
                DocId = "SOP-EQP-012", Title = "Decontamination of reusable equipment",
                Version = "2.0", Status = "Draft", Folder = "sops", ReviewDue = "Overdue 8d",
                Owner = "M. Chen", Clauses = "5.3.5", Updated = "09 May 2026",
                Workflow = Wf(
                    Step("Draft",           "M. Chen",  active: true),
                    Step("Peer review",     "K. Patel", "05 May 2026", rejected: true,
                         comment: "Section 4.2 incomplete — mobile equipment decontamination procedure missing. Please revise before resubmission."),
                    Step("Approval",        "Dr. R. Okafor"),
                    Step("Issue",           "K. Patel"),
                    Step("Periodic review", "+24 mo"))
            },
            new Document
            {
                DocId = "SOP-EMG-001", Title = "Emergency & escalation protocol",
                Version = "4.0", Status = "Under review", Folder = "sops", ReviewDue = "—",
                Owner = "K. Patel", Clauses = "5.5.1", Updated = "10 May 2026",
                Workflow = Wf(
                    Step("Draft",           "K. Patel", "10 May 2026", done: true,
                         comment: "Revised per updated BLS guidelines and expanded escalation criteria."),
                    Step("Peer review",     "M. Chen",        active: true),
                    Step("Approval",        "Dr. R. Okafor"),
                    Step("Issue",           "K. Patel"),
                    Step("Periodic review", "+24 mo"))
            },
            new Document
            {
                DocId = "SOP-CPAP-002", Title = "Split-night titration protocol",
                Version = "1.2", Status = "Issued", Folder = "sops", ReviewDue = "15 Jan 2028",
                Owner = "Dr. R. Okafor", Clauses = "5.5.3.4", Updated = "20 Feb 2026",
                Workflow = Wf(
                    Step("Draft",           "Dr. R. Okafor", "01 Jan 2026", done: true),
                    Step("Peer review",     "M. Chen",       "10 Jan 2026", done: true, comment: "Reviewed — pressure titration thresholds confirmed."),
                    Step("Approval",        "Dr. R. Okafor", "18 Jan 2026", done: true),
                    Step("Issue",           "K. Patel",      "20 Feb 2026", done: true),
                    Step("Periodic review", "+24 mo",        "15 Jan 2028"))
            },
            new Document
            {
                DocId = "POL-QMS-001", Title = "Quality policy",
                Version = "2.3", Status = "Issued", Folder = "policies", ReviewDue = "31 Dec 2026",
                Owner = "Dr. R. Okafor", Clauses = "4.2.1", Updated = "15 Jan 2026",
                Workflow = Wf(
                    Step("Draft",           "Dr. R. Okafor", "10 Jan 2026", done: true),
                    Step("Peer review",     "K. Patel",      "12 Jan 2026", done: true, comment: "Reviewed — objectives updated for 2026 cycle."),
                    Step("Approval",        "Dr. R. Okafor", "14 Jan 2026", done: true),
                    Step("Issue",           "K. Patel",      "15 Jan 2026", done: true),
                    Step("Periodic review", "+24 mo",        "31 Dec 2027"))
            },
            new Document
            {
                DocId = "POL-CONF-002", Title = "Confidentiality & data handling",
                Version = "1.5", Status = "Issued", Folder = "policies", ReviewDue = "20 Nov 2026",
                Owner = "K. Patel", Clauses = "4.1.6,4.13", Updated = "20 Nov 2025",
                Workflow = Wf(
                    Step("Draft",           "K. Patel",      "01 Nov 2025", done: true),
                    Step("Peer review",     "Dr. R. Okafor", "10 Nov 2025", done: true, comment: "Reviewed — Privacy Act 2024 amendments incorporated."),
                    Step("Approval",        "Dr. R. Okafor", "15 Nov 2025", done: true),
                    Step("Issue",           "K. Patel",      "20 Nov 2025", done: true),
                    Step("Periodic review", "+24 mo",        "20 Nov 2027"))
            },
            new Document
            {
                DocId = "POL-VAL-003", Title = "Validation & verification policy",
                Version = "1.0", Status = "Under review", Folder = "policies", ReviewDue = "Overdue 14d",
                Owner = "M. Chen", Clauses = "5.3", Updated = "20 Apr 2026",
                Workflow = Wf(
                    Step("Draft",           "M. Chen",  "01 Mar 2026", done: true,
                         comment: "Initial version — scope updated for expanded equipment fleet."),
                    Step("Peer review",     "K. Patel", "20 Apr 2026", done: true,
                         comment: "Reviewed — verification intervals aligned with SOP-EQP-004."),
                    Step("Approval",        "Dr. R. Okafor", active: true),
                    Step("Issue",           "K. Patel"),
                    Step("Periodic review", "+24 mo"))
            },
            new Document
            {
                DocId = "FRM-CoI-2026", Title = "Conflict of interest declaration 2026",
                Version = "—", Status = "Live form", Folder = "forms", ReviewDue = "Annual",
                Owner = "K. Patel", Clauses = "4.1.5", Updated = "01 Jan 2026",
                Workflow = "[]",
                SurveyJson = """
{
  "title": "Conflict of Interest Declaration 2026",
  "description": "Annual staff declaration for Nexus 360 Sleep Disorders Service. Complete and submit before 31 January 2026.",
  "pages": [
    {
      "name": "declaration",
      "title": "Staff declaration",
      "elements": [
        {
          "type": "text",
          "name": "staff_name",
          "title": "Full name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "role",
          "title": "Role / position",
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "no_conflicts",
          "title": "I have no conflicts of interest to declare for the period 1 January – 31 December 2026",
          "defaultValue": false
        },
        {
          "type": "paneldynamic",
          "name": "interests",
          "title": "Declared interests",
          "description": "Add all interests below. If you have none to declare, check the box above instead.",
          "visibleIf": "{no_conflicts} <> true",
          "addPanelText": "Add interest",
          "templateTitle": "Interest #{panelIndex}",
          "minPanelCount": 0,
          "templateElements": [
            {
              "type": "comment",
              "name": "interest_description",
              "title": "Nature of interest",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "dropdown",
              "name": "interest_type",
              "title": "Type",
              "choices": ["Financial", "Personal relationship", "Professional / employment", "Other"],
              "isRequired": true
            },
            {
              "type": "text",
              "name": "value_extent",
              "title": "Value / extent",
              "placeholder": "e.g. $5,000 annual consultancy fee"
            },
            {
              "type": "comment",
              "name": "management_plan",
              "title": "Management / mitigation plan",
              "rows": 2,
              "isRequired": true
            }
          ]
        },
        {
          "type": "text",
          "name": "declaration_date",
          "title": "Date of declaration",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ],
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit declaration"
}
"""
            },
            new Document
            {
                DocId = "MAN-QMS-001", Title = "Quality manual",
                Version = "5.1", Status = "Issued", Folder = "manual", ReviewDue = "12 Aug 2026",
                Owner = "Dr. R. Okafor", Clauses = "4.2", Updated = "10 Feb 2026",
                Workflow = Wf(
                    Step("Draft",           "Dr. R. Okafor", "01 Jan 2026", done: true),
                    Step("Peer review",     "K. Patel",      "20 Jan 2026", done: true, comment: "Reviewed — section 5.8 reporting timeline updated."),
                    Step("Approval",        "Dr. R. Okafor", "05 Feb 2026", done: true),
                    Step("Issue",           "K. Patel",      "10 Feb 2026", done: true),
                    Step("Periodic review", "+24 mo",        "12 Aug 2028"))
            }
        );

        db.SaveChanges();
    }

    public static void Seed(NexusDbContext db)
    {
        if (db.Studies.Any()) return;

        // ── Staff ────────────────────────────────────────────────────────────────
        // Dr. Richard Okafor   — Medical Director / Reporting Physician (Riverside Main)
        // Dr. Linda Hartono    — Sleep Physician, Paediatric specialist (Eastside Paed.)
        // Dr. Frank Liu        — Sleep Physician (Home Service / Eastside)
        // Mei Chen             — Senior Sleep Technologist / Scorer
        // Arun Singh           — Sleep Technologist / Scorer
        // James Owusu          — Sleep Technologist / Scorer
        // Kavita Patel         — Quality & Administration Manager

        // ── Patients ─────────────────────────────────────────────────────────────
        // Each study has a fictional patient matched by initials.
        //   R.K.  Robert Kingston    M  DOB 12 Jun 1974  age 51
        //   T.N.  Thanh Nguyen      M  DOB 03 Sep 1989  age 36
        //   L.W.  Lily Walsh        F  DOB 14 Feb 2012  age 14  (paediatric)
        //   P.B.  Patricia Brown    F  DOB 22 Nov 1968  age 57
        //   D.M.  David Mitchell    M  DOB 08 Apr 1955  age 71
        //   S.C.  Sophie Carter     F  DOB 17 Jul 1998  age 27
        //   A.P.  Andrew Park       M  DOB 29 Jan 1971  age 55
        //   M.T.  Maria Torres      F  DOB 15 May 1983  age 42

        db.Studies.AddRange(
            // SLA critical — due today, awaiting Dr. Okafor sign-off (Task T-004)
            new Study
            {
                StudyId = "PSG-2026-0440", Patient = "T. Nguyen · M · DOB 03 Sep 1989",
                PatientInitials = "T.N.", Type = "Adult attended PSG",
                SiteCode = "RML", Scorer = "A. Singh", Physician = "Dr. R. Okafor",
                Status = "Awaiting sign-off", Contact = "06 May", Due = 0, Sla = "bad"
            },
            // SLA warning — 1 day remaining, awaiting Dr. Okafor sign-off
            new Study
            {
                StudyId = "PSG-2026-0441", Patient = "R. Kingston · M · DOB 12 Jun 1974",
                PatientInitials = "R.K.", Type = "Adult attended PSG",
                SiteCode = "RML", Scorer = "M. Chen", Physician = "Dr. R. Okafor",
                Status = "Awaiting sign-off", Contact = "07 May", Due = 1, Sla = "warn"
            },
            // SLA warning — MSLT, awaiting Dr. Okafor sign-off, 2 days remaining
            new Study
            {
                StudyId = "MSLT-2026-0031", Patient = "S. Carter · F · DOB 17 Jul 1998",
                PatientInitials = "S.C.", Type = "MSLT",
                SiteCode = "RML", Scorer = "M. Chen", Physician = "Dr. R. Okafor",
                Status = "Awaiting sign-off", Contact = "08 May", Due = 2, Sla = "warn"
            },
            // Scoring in progress — paediatric PSG, Dr. Hartono (Eastside)
            new Study
            {
                StudyId = "PSG-2026-0439", Patient = "L. Walsh · F · DOB 14 Feb 2012",
                PatientInitials = "L.W.", Type = "Paediatric attended PSG",
                SiteCode = "EPL", Scorer = "M. Chen", Physician = "Dr. L. Hartono",
                Status = "Scoring", Contact = "09 May", Due = 3, Sla = "good"
            },
            // Preliminary report issued — split-night, Dr. Okafor
            new Study
            {
                StudyId = "PSG-2026-0438", Patient = "D. Mitchell · M · DOB 08 Apr 1955",
                PatientInitials = "D.M.", Type = "Split-night PSG/CPAP titration",
                SiteCode = "RML", Scorer = "A. Singh", Physician = "Dr. R. Okafor",
                Status = "Preliminary", Contact = "10 May", Due = 4, Sla = "good"
            },
            // Scoring in progress — HSAT type 3, Dr. Liu (Home Service)
            new Study
            {
                StudyId = "HSAT-2026-0218", Patient = "P. Brown · F · DOB 22 Nov 1968",
                PatientInitials = "P.B.", Type = "Type 3 HSAT",
                SiteCode = "HSN", Scorer = "J. Owusu", Physician = "Dr. F. Liu",
                Status = "Scoring", Contact = "11 May", Due = 5, Sla = "good"
            },
            // Final — PSG signed by Dr. Liu, 7 days (within SLA)
            new Study
            {
                StudyId = "PSG-2026-0437", Patient = "A. Park · M · DOB 29 Jan 1971",
                PatientInitials = "A.P.", Type = "Adult attended PSG",
                SiteCode = "EPL", Scorer = "J. Owusu", Physician = "Dr. F. Liu",
                Status = "Final", Contact = "22 Apr", Due = 0, Sla = "good", SignedDays = 7
            },
            // Final — HSAT signed by Dr. Liu, 9 days (within SLA)
            new Study
            {
                StudyId = "HSAT-2026-0217", Patient = "M. Torres · F · DOB 15 May 1983",
                PatientInitials = "M.T.", Type = "Type 2 HSAT",
                SiteCode = "HSN", Scorer = "A. Singh", Physician = "Dr. F. Liu",
                Status = "Final", Contact = "20 Apr", Due = 0, Sla = "good", SignedDays = 9
            }
        );

        db.Equipment.AddRange(
            new Equipment { AssetId = "PSG-COMP-001", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier",       Site = "Riverside Main",   Serial = "GRL-4421-A",  Artg = "394821", LastVerify = "01 Mar 2026", NextVerify = "01 Jun 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "PSG-COMP-002", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier",       Site = "Riverside Main",   Serial = "GRL-4421-B",  Artg = "394821", LastVerify = "12 Mar 2026", NextVerify = "12 Jun 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "PSG-COMP-003", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier",       Site = "Eastside Paed.",   Serial = "GRL-5103-A",  Artg = "394821", LastVerify = "20 Feb 2026", NextVerify = "20 May 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "PSG-EMB-001",  Name = "Embla N7000 Amplifier",           Type = "PSG Amplifier",       Site = "Eastside Paed.",   Serial = "EMB-N7-3301", Artg = "263711", LastVerify = "28 Feb 2026", NextVerify = "28 May 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "HSAT-NOX-012", Name = "Nox T3 Sleep Monitor",            Type = "HSAT Device",         Site = "Home Service N.",  Serial = "T3-19204",    Artg = "212388", LastVerify = "10 Apr 2026", NextVerify = "10 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "HSAT-NOX-013", Name = "Nox T3 Sleep Monitor",            Type = "HSAT Device",         Site = "Home Service N.",  Serial = "T3-19205",    Artg = "212388", LastVerify = "10 Apr 2026", NextVerify = "10 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "HSAT-NOX-014", Name = "Nox T3 Sleep Monitor",            Type = "HSAT Device",         Site = "Home Service N.",  Serial = "T3-19381",    Artg = "212388", LastVerify = "02 Jan 2026", NextVerify = "Overdue 14d", VerifyStatus = "bad"  },
            new Equipment { AssetId = "OXI-NON-007",  Name = "Nonin WristOx2 3150",             Type = "Oximeter",            Site = "Home Service N.",  Serial = "NWO-88231",   Artg = "271044", LastVerify = "14 Apr 2026", NextVerify = "14 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "CPAP-RES-004", Name = "ResMed AirSense 11 AutoSet",      Type = "CPAP Titration Device", Site = "Riverside Main", Serial = "AS11-4400221",Artg = "341022", LastVerify = "05 Apr 2026", NextVerify = "05 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "CAL-MKS-001",  Name = "MKS Instruments Calibration Gas", Type = "Calibration Gas",     Site = "Riverside Main",   Serial = "CAL-20240211",Artg = "—",      LastVerify = "11 Feb 2026", NextVerify = "11 Aug 2026", VerifyStatus = "good" }
        );

        db.Indicators.AddRange(
            new Indicator { IndicatorId = "KPI-01", Name = "Referral-to-study wait",         Phase = "pre",   Value = "8.4",  Unit = "days", Target = "≤ 14d",  Status = "good", Trend = "[12,11,10,10,9,9,9,8,8,8,8,8]" },
            new Indicator { IndicatorId = "KPI-02", Name = "Incomplete referrals",            Phase = "pre",   Value = "3.2",  Unit = "%",    Target = "≤ 5%",   Status = "good", Trend = "[8,7,6,5,5,4,4,3,4,3,3,3]" },
            new Indicator { IndicatorId = "KPI-03", Name = "Pre-study cancellation rate",     Phase = "pre",   Value = "6.1",  Unit = "%",    Target = "≤ 8%",   Status = "good", Trend = "[9,8,7,7,6,7,6,5,6,6,6,6]" },
            new Indicator { IndicatorId = "KPI-04", Name = "Study technical failure rate",    Phase = "study", Value = "1.8",  Unit = "%",    Target = "≤ 2%",   Status = "good", Trend = "[3,3,2,3,2,2,2,2,2,1,2,2]" },
            new Indicator { IndicatorId = "KPI-05", Name = "EEG impedance compliance",        Phase = "study", Value = "97.3", Unit = "%",    Target = "≥ 95%",  Status = "good", Trend = "[91,93,94,95,95,96,96,97,97,97,97,97]" },
            new Indicator { IndicatorId = "KPI-06", Name = "Inter-scorer κ (mean)",           Phase = "study", Value = "0.82", Unit = "",     Target = "≥ 0.75", Status = "good", Trend = "[0.74,0.76,0.77,0.78,0.79,0.80,0.80,0.81,0.82,0.82,0.82,0.82]" },
            new Indicator { IndicatorId = "KPI-07", Name = "Report turnaround (10d SLA)",     Phase = "post",  Value = "97.9", Unit = "%",    Target = "≥ 98%",  Status = "warn", Trend = "[98,98,99,97,98,98,99,98,97,98,98,98]" },
            new Indicator { IndicatorId = "KPI-08", Name = "Amended reports rate",            Phase = "post",  Value = "1.4",  Unit = "%",    Target = "≤ 2%",   Status = "good", Trend = "[3,2,2,2,2,2,1,1,2,1,1,1]" },
            new Indicator { IndicatorId = "KPI-09", Name = "Referrer satisfaction score",     Phase = "post",  Value = "4.6",  Unit = "/ 5",  Target = "≥ 4.5",  Status = "good", Trend = "[4.1,4.2,4.3,4.3,4.4,4.4,4.5,4.5,4.6,4.6,4.6,4.6]" },
            new Indicator { IndicatorId = "KPI-10", Name = "Equipment verification on time",  Phase = "study", Value = "96.8", Unit = "%",    Target = "≥ 95%",  Status = "good", Trend = "[92,93,94,95,95,96,96,97,97,97,97,97]" },
            new Indicator { IndicatorId = "KPI-11", Name = "EQA pass rate",                   Phase = "study", Value = "90.0", Unit = "%",    Target = "≥ 90%",  Status = "warn", Trend = "[95,95,100,90,95,95,90,95,95,90,90,90]" },
            new Indicator { IndicatorId = "KPI-12", Name = "CAPA effectiveness",              Phase = "post",  Value = "94.0", Unit = "%",    Target = "≥ 90%",  Status = "good", Trend = "[85,87,88,89,90,91,92,93,93,94,94,94]" }
        );

        db.Clauses.AddRange(
            new Clause { ClauseId = "4.1.1",  Title = "Scope of accreditation",            Section = "4.1",  Status = "compliant",     Evidence = 3, LastReviewed = "Jan 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "4.1.5",  Title = "Conflict of interest",              Section = "4.1",  Status = "compliant",     Evidence = 2, LastReviewed = "Jan 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.1.6",  Title = "Confidentiality",                   Section = "4.1",  Status = "compliant",     Evidence = 4, LastReviewed = "Nov 2025", Owner = "K. Patel" },
            new Clause { ClauseId = "4.2.1",  Title = "Quality policy",                    Section = "4.2",  Status = "compliant",     Evidence = 2, LastReviewed = "Jan 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "4.3.1",  Title = "Document control",                  Section = "4.3",  Status = "compliant",     Evidence = 5, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.5.2",  Title = "Subcontractor register",            Section = "4.5",  Status = "nonconformant", Evidence = 0, LastReviewed = "Mar 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.8.1",  Title = "Complaint handling",                Section = "4.8",  Status = "compliant",     Evidence = 3, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.13.1", Title = "Record retention",                  Section = "4.13", Status = "compliant",     Evidence = 4, LastReviewed = "Nov 2025", Owner = "K. Patel" },
            new Clause { ClauseId = "4.14.3", Title = "Auditor independence",               Section = "4.14", Status = "compliant",     Evidence = 4, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.15.2", Title = "Management review inputs",           Section = "4.15", Status = "compliant",     Evidence = 6, LastReviewed = "Feb 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.1.4",  Title = "BLS recertification",               Section = "5.1",  Status = "nonconformant", Evidence = 1, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.2",  Title = "Equipment acceptance testing",      Section = "5.3",  Status = "compliant",     Evidence = 5, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.4",  Title = "Equipment verification programme",  Section = "5.3",  Status = "nonconformant", Evidence = 2, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.5",  Title = "Equipment decontamination",         Section = "5.3",  Status = "review",        Evidence = 2, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.6",  Title = "Adverse incident reporting",        Section = "5.3",  Status = "compliant",     Evidence = 3, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.5.2",  Title = "Pre-study bio-signal verification", Section = "5.5",  Status = "compliant",     Evidence = 6, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.5.3",  Title = "PSG recording protocols",           Section = "5.5",  Status = "compliant",     Evidence = 7, LastReviewed = "Mar 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.6.6",  Title = "Inter-observer concordance",        Section = "5.6",  Status = "compliant",     Evidence = 4, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.6.8",  Title = "External proficiency testing (EQA)",Section = "5.6",  Status = "review",        Evidence = 3, LastReviewed = "Mar 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.8.1",  Title = "10 business-day reporting SLA",     Section = "5.8",  Status = "compliant",     Evidence = 5, LastReviewed = "Apr 2026", Owner = "Dr. R. Okafor" }
        );

        db.ComplianceSections.AddRange(
            new ComplianceSection { Section = "4.1",  Title = "Organisation & management",    Total = 8,  Ok = 8,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.2",  Title = "Quality management system",    Total = 5,  Ok = 5,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.3",  Title = "Document control",             Total = 6,  Ok = 5,  Nc = 1, Na = 0, Status = "review"        },
            new ComplianceSection { Section = "4.4",  Title = "Service agreements",           Total = 4,  Ok = 4,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.5",  Title = "Subcontracting",               Total = 3,  Ok = 2,  Nc = 1, Na = 0, Status = "nonconformant" },
            new ComplianceSection { Section = "4.6",  Title = "External services & supplies", Total = 4,  Ok = 4,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.7",  Title = "Advisory services",            Total = 2,  Ok = 2,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.8",  Title = "Complaint resolution",         Total = 4,  Ok = 4,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.9",  Title = "Nonconformance control",       Total = 5,  Ok = 5,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.10", Title = "Corrective action",            Total = 4,  Ok = 4,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.11", Title = "Preventive action",            Total = 3,  Ok = 3,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.12", Title = "Continual improvement",        Total = 3,  Ok = 3,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.13", Title = "Records & audit trail",        Total = 6,  Ok = 6,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.14", Title = "Internal audits",              Total = 5,  Ok = 5,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "4.15", Title = "Management review",            Total = 5,  Ok = 5,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "5.1",  Title = "Staff & training",             Total = 10, Ok = 8,  Nc = 2, Na = 0, Status = "nonconformant" },
            new ComplianceSection { Section = "5.2",  Title = "Accommodation & facilities",   Total = 6,  Ok = 6,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "5.3",  Title = "Equipment management",         Total = 12, Ok = 9,  Nc = 2, Na = 1, Status = "nonconformant" },
            new ComplianceSection { Section = "5.4",  Title = "Pre-analytical processes",     Total = 5,  Ok = 5,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "5.5",  Title = "Study & recording processes",  Total = 14, Ok = 13, Nc = 1, Na = 0, Status = "review"        },
            new ComplianceSection { Section = "5.6",  Title = "Analytical quality assurance", Total = 9,  Ok = 7,  Nc = 1, Na = 1, Status = "review"        },
            new ComplianceSection { Section = "5.7",  Title = "Post-analytical processes",    Total = 6,  Ok = 6,  Nc = 0, Na = 0, Status = "compliant"     },
            new ComplianceSection { Section = "5.8",  Title = "Reporting & result release",   Total = 10, Ok = 10, Nc = 0, Na = 0, Status = "compliant"     }
        );

        db.Tasks.AddRange(
            // T-001: references HSAT-NOX-014 which is verified as "bad" in equipment
            new NexusTask { TaskId = "T-001", Title = "Verify HSAT-NOX-014 — overdue since 02 Jan 2026",   Clause = "5.3.4", Due = "today",     Priority = "critical" },
            // T-002: references the NC raised in clause 4.5.2
            new NexusTask { TaskId = "T-002", Title = "Complete subcontractor register (SIS Pathology)",    Clause = "4.5.2", Due = "in 3 days", Priority = "high"     },
            // T-003: references the NC raised in clause 5.1.4
            new NexusTask { TaskId = "T-003", Title = "Book BLS recertification for 4 lapsed staff",        Clause = "5.1.4", Due = "in 7 days", Priority = "high"     },
            // T-004: references PSG-2026-0440 which has Due=0 (SLA due today)
            new NexusTask { TaskId = "T-004", Title = "Sign off PSG-2026-0440 — T. Nguyen (SLA due today)", Clause = "5.8.1", Due = "today",     Priority = "high"     },
            // T-005: references SOP-EQP-012 which has status "Draft" with overdue review
            new NexusTask { TaskId = "T-005", Title = "Revise SOP-EQP-012 — peer review rejected 05 May",  Clause = "4.3.1", Due = "overdue",   Priority = "high"     },
            // T-006: routine management review preparation
            new NexusTask { TaskId = "T-006", Title = "Assemble Q2 2026 management review pack",            Clause = "4.15.2", Due = "in 1 day", Priority = "medium"   }
        );

        var now = DateTime.Now;
        db.Activity.AddRange(
            new ActivityEntry { Who = "K. Patel",   Action = "updated self-assessment",  Target = "cl. 5.3.5 to 'under review'",        Kind = "edit",   Module = "accreditation", Detail = "Previous status: compliant. Evidence count: 2.",                          Ts = now.AddHours(-0.5).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddHours(-0.5).ToString("dd MMM yyyy, HH:mm") },
            new ActivityEntry { Who = "M. Chen",    Action = "linked evidence to",        Target = "cl. 5.3.4 — verification log added",  Kind = "link",   Module = "accreditation", Detail = "Evidence item added: calibration log. Total evidence: 3.",               Ts = now.AddHours(-1  ).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddHours(-1  ).ToString("dd MMM yyyy, HH:mm") },
            new ActivityEntry { Who = "Dr. F. Liu", Action = "signed final report",       Target = "PSG-2026-0437 — A. Park",             Kind = "sign",   Module = "studies",       Detail = "Report finalised. Turnaround: 7 business days.",                         Ts = now.AddHours(-2  ).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddHours(-2  ).ToString("dd MMM yyyy, HH:mm") },
            new ActivityEntry { Who = "System",     Action = "raised NC",                 Target = "HSAT-NOX-014 — verification overdue", Kind = "alert",  Module = "equipment",     Detail = "No verification record found after 2026-01-02. NC-2026-0111 created.",   Ts = now.AddHours(-3  ).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddHours(-3  ).ToString("dd MMM yyyy, HH:mm") },
            new ActivityEntry { Who = "A. Singh",   Action = "submitted scoring for",     Target = "PSG-2026-0438 — D. Mitchell",         Kind = "edit",   Module = "studies",       Detail = "Epoch count: 1,132. Ready for physician review.",                        Ts = now.AddHours(-4  ).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddHours(-4  ).ToString("dd MMM yyyy, HH:mm") },
            new ActivityEntry { Who = "K. Patel",   Action = "uploaded audit report",     Target = "AUD-2026-Q1 internal audit findings",  Kind = "upload", Module = "audits",        Detail = "3 findings logged: 1 major (cl. 5.3.4), 1 minor, 1 observation.",       Ts = now.AddDays( -1  ).ToString("yyyy-MM-ddTHH:mm"), Time = now.AddDays( -1  ).ToString("dd MMM yyyy, HH:mm") }
        );

        db.SaveChanges();
    }

    public static void SeedRooms(NexusDbContext db)
    {
        if (db.Rooms.Any()) return;
        db.Rooms.AddRange(
            new SiteRoom { SiteId = "RML", RoomId = "rml-1", Name = "Room 1",     Type = "psg",       SortOrder = 1 },
            new SiteRoom { SiteId = "RML", RoomId = "rml-2", Name = "Room 2",     Type = "psg",       SortOrder = 2 },
            new SiteRoom { SiteId = "RML", RoomId = "rml-3", Name = "Room 3",     Type = "titration", SortOrder = 3 },
            new SiteRoom { SiteId = "RML", RoomId = "rml-4", Name = "Consult A",  Type = "consult",   SortOrder = 4 },
            new SiteRoom { SiteId = "EPL", RoomId = "epl-1", Name = "Room 1",     Type = "psg",       SortOrder = 1 },
            new SiteRoom { SiteId = "EPL", RoomId = "epl-2", Name = "Consult",    Type = "consult",   SortOrder = 2 }
        );
        db.SaveChanges();
    }

    public static void SeedAppointments(NexusDbContext db)
    {
        if (db.Appointments.Any()) return;

        // Anchor to start of current week (Monday)
        var today = DateTime.Today;
        var monday = today.AddDays(-(int)today.DayOfWeek == 0 ? 6 : (int)today.DayOfWeek - 1);

        var appts = new List<Appointment>
        {
            // Mon night — PSG Room 1
            new Appointment { SiteId = "RML", Type = "psg", PatientName = "T. Nguyen",
                Start = monday.AddDays(0).AddHours(21).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(1).AddHours(7 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-1", EquipmentId = "PSG-COMP-001",
                Physician = "Dr. R. Okafor", Technician = "M. Chen", Status = "confirmed" },

            // Mon night — PSG Room 2
            new Appointment { SiteId = "RML", Type = "psg", PatientName = "R. Kim",
                Start = monday.AddDays(0).AddHours(21).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(1).AddHours(7 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-2", EquipmentId = "PSG-COMP-002",
                Physician = "Dr. R. Okafor", Technician = "A. Singh", Status = "confirmed" },

            // Tue morning — HSAT setup
            new Appointment { SiteId = "HSN", Type = "hsat", PatientName = "P. Brown",
                Start = monday.AddDays(1).AddHours(9).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(1).AddHours(9).AddMinutes(30).ToString("yyyy-MM-ddTHH:mm"),
                EquipmentId = "HSAT-NOX-012",
                Physician = "Dr. R. Okafor", Technician = "M. Chen", Status = "scheduled",
                Notes = "Patient address: 14 River St, Northside. Deliver and set up device." },

            // Tue afternoon — Consultation
            new Appointment { SiteId = "RML", Type = "consult", PatientName = "A. Patel",
                Start = monday.AddDays(1).AddHours(14).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(1).AddHours(15).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-4",
                Physician = "Dr. R. Okafor", Status = "scheduled" },

            // Tue night — Titration
            new Appointment { SiteId = "RML", Type = "titration", PatientName = "S. Chen",
                Start = monday.AddDays(1).AddHours(21).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(2).AddHours(6 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-3", EquipmentId = "CPAP-RES-004",
                Physician = "Dr. R. Okafor", Technician = "M. Chen", Status = "confirmed" },

            // Wed night — PSG Room 1
            new Appointment { SiteId = "RML", Type = "psg", PatientName = "D. Mitchell",
                Start = monday.AddDays(2).AddHours(21).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(3).AddHours(7 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-1", EquipmentId = "PSG-COMP-001",
                Physician = "Dr. R. Okafor", Technician = "A. Singh", Status = "scheduled" },

            // Wed morning — HSAT retrieval
            new Appointment { SiteId = "HSN", Type = "hsat", PatientName = "M. Torres",
                Start = monday.AddDays(2).AddHours(8).AddMinutes(30).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(2).AddHours(9).ToString("yyyy-MM-ddTHH:mm"),
                EquipmentId = "HSAT-NOX-013",
                Technician = "M. Chen", Status = "scheduled",
                Notes = "Retrieve device from patient. Download and check data quality." },

            // Thu — Paediatric PSG at Eastside
            new Appointment { SiteId = "EPL", Type = "psg", PatientName = "L. Wang",
                Start = monday.AddDays(3).AddHours(19).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(4).AddHours(7 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "epl-1", EquipmentId = "PSG-EMB-001",
                Physician = "Dr. L. Hartono", Technician = "M. Chen", Status = "confirmed" },

            // Thu morning — Consultation at Eastside
            new Appointment { SiteId = "EPL", Type = "consult", PatientName = "B. Gupta",
                Start = monday.AddDays(3).AddHours(10).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(3).AddHours(11).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "epl-2",
                Physician = "Dr. L. Hartono", Status = "scheduled" },

            // Fri night — PSG Room 1
            new Appointment { SiteId = "RML", Type = "psg", PatientName = "J. Harrison",
                Start = monday.AddDays(4).AddHours(21).ToString("yyyy-MM-ddTHH:mm"),
                End   = monday.AddDays(5).AddHours(7 ).ToString("yyyy-MM-ddTHH:mm"),
                RoomId = "rml-1", EquipmentId = "PSG-COMP-001",
                Physician = "Dr. R. Okafor", Technician = "A. Singh", Status = "scheduled" },
        };

        foreach (var a in appts)
        {
            a.CreatedBy = "System";
            a.CreatedAt = DateTime.Now.AddDays(-3).ToString("yyyy-MM-ddTHH:mm");
        }

        db.Appointments.AddRange(appts);
        db.SaveChanges();
    }

    public static void SeedStandardIfNeeded(NexusDbContext db, string standardId, string jsonPath)
    {
        if (db.Clauses.Any(c => c.Standard == standardId)) return;
        if (!File.Exists(jsonPath)) return;

        var json    = File.ReadAllText(jsonPath);
        var opts    = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var config  = JsonSerializer.Deserialize<StandardConfig>(json, opts)!;

        var sectionMap = config.Sections.ToDictionary(s => s.Id, s => s.Title);

        foreach (var c in config.Clauses)
        {
            db.Clauses.Add(new NexusApi.Models.Clause
            {
                ClauseId     = c.ClauseId,
                Title        = c.Title,
                Section      = c.Section,
                Category     = c.Category,
                Standard     = standardId,
                Status       = "review",
                Evidence     = 0,
                LastReviewed = "",
                Owner        = "",
            });
        }

        foreach (var s in config.Sections)
        {
            var total = config.Clauses.Count(c => c.Section == s.Id);
            db.ComplianceSections.Add(new NexusApi.Models.ComplianceSection
            {
                Section  = s.Id,
                Title    = s.Title,
                Standard = standardId,
                Total    = total,
                Ok       = 0,
                Nc       = 0,
                Na       = 0,
                Status   = "review",
            });
        }

        db.SaveChanges();
    }

    public static void SeedFormSurveyJson(NexusDbContext db)
    {
        var forms = new Dictionary<string, string>
        {
            ["FRM-001"] = """
{
  "title": "Referral & Patient Intake",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "patient",
      "title": "A \u2013 Patient identification",
      "elements": [
        {
          "type": "text",
          "name": "surname",
          "title": "Surname",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "given_names",
          "title": "Given names",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "sex",
          "title": "Sex",
          "choices": [
            "Male",
            "Female",
            "Other/Prefer not to say"
          ]
        },
        {
          "type": "text",
          "name": "medicare",
          "title": "Medicare number"
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN / Service number"
        },
        {
          "type": "text",
          "name": "address",
          "title": "Address"
        },
        {
          "type": "text",
          "name": "phone",
          "title": "Phone (preferred)"
        },
        {
          "type": "text",
          "name": "email",
          "title": "Email"
        },
        {
          "type": "text",
          "name": "nok",
          "title": "Next of kin"
        }
      ]
    },
    {
      "name": "referrer",
      "title": "B \u2013 Referrer",
      "elements": [
        {
          "type": "text",
          "name": "ref_doctor",
          "title": "Referring doctor",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "provider_no",
          "title": "Provider number"
        },
        {
          "type": "text",
          "name": "practice",
          "title": "Practice"
        },
        {
          "type": "text",
          "name": "ref_date",
          "title": "Referral date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "receipt_date",
          "title": "Receipt date",
          "inputType": "date"
        },
        {
          "type": "dropdown",
          "name": "ref_method",
          "title": "Referral method",
          "choices": [
            "Fax",
            "Email",
            "EMR",
            "Web",
            "Other"
          ]
        }
      ]
    },
    {
      "name": "clinical",
      "title": "C \u2013 Clinical details",
      "elements": [
        {
          "type": "text",
          "name": "diagnosis",
          "title": "Suspected diagnosis",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "symptoms",
          "title": "Presenting symptoms",
          "rows": 3
        },
        {
          "type": "text",
          "name": "ess",
          "title": "ESS score",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "bmi",
          "title": "BMI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "neck",
          "title": "Neck circumference (cm)",
          "inputType": "number"
        },
        {
          "type": "comment",
          "name": "comorbidities",
          "title": "Comorbidities",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "medications",
          "title": "Medications",
          "rows": 3
        },
        {
          "type": "radiogroup",
          "name": "safety_occupation",
          "title": "Safety-critical occupation?",
          "choices": [
            "Yes",
            "No"
          ]
        },
        {
          "type": "text",
          "name": "occupation_detail",
          "title": "If yes, specify",
          "visibleIf": "{safety_occupation} = 'Yes'"
        }
      ]
    },
    {
      "name": "study",
      "title": "D \u2013 Study requested",
      "elements": [
        {
          "type": "checkbox",
          "name": "study_types",
          "title": "Study type(s) requested",
          "choices": [
            "Attended PSG",
            "HSAT Type 2",
            "HSAT Type 3",
            "HSAT Type 4",
            "CPAP titration",
            "Split-night",
            "MSLT",
            "MWT",
            "Paediatric",
            "NIV titration"
          ],
          "isRequired": true
        }
      ]
    },
    {
      "name": "triage",
      "title": "E \u2013 Triage (sleep physician)",
      "elements": [
        {
          "type": "radiogroup",
          "name": "category",
          "title": "Triage category",
          "choices": [
            "1 \u2013 Urgent (\u22644 weeks)",
            "2 \u2013 Routine",
            "3 \u2013 Deferred"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "deviation",
          "title": "Deviation from referral (if any)"
        },
        {
          "type": "text",
          "name": "physician_name",
          "title": "Physician name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "physician_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-002"] = """
{
  "title": "Three-Identifier Patient Check",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "patient",
      "title": "Patient details",
      "elements": [
        {
          "type": "text",
          "name": "full_name",
          "title": "Full name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN / Service number",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "address",
          "title": "Address (optional 4th identifier)"
        }
      ]
    },
    {
      "name": "checks",
      "title": "Interaction events",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "events",
          "title": "Interaction events",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "event",
              "title": "Interaction point",
              "choices": [
                "Arrival / check-in",
                "Pre-study setup",
                "Post-study",
                "Discharge",
                "Other"
              ]
            },
            {
              "type": "text",
              "name": "event_date",
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "event_time",
              "title": "Time",
              "inputType": "time"
            },
            {
              "type": "text",
              "name": "verified_by",
              "title": "Verified by"
            },
            {
              "type": "boolean",
              "name": "id1_confirmed",
              "title": "Name confirmed",
              "defaultValue": false
            },
            {
              "type": "boolean",
              "name": "id2_confirmed",
              "title": "DOB confirmed",
              "defaultValue": false
            },
            {
              "type": "boolean",
              "name": "id3_confirmed",
              "title": "MRN confirmed",
              "defaultValue": false
            }
          ]
        }
      ]
    }
  ]
}
""",
            ["FRM-003"] = """
{
  "title": "Patient Consent for Sleep Study",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "patient",
      "title": "Patient details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        }
      ]
    },
    {
      "name": "consent",
      "title": "Consent declarations",
      "elements": [
        {
          "type": "boolean",
          "name": "consent_study",
          "title": "I consent to undergoing the requested sleep study",
          "defaultValue": false,
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "consent_data",
          "title": "I consent to secure storage and authorised use of my data and recordings",
          "defaultValue": false,
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "consent_sharing",
          "title": "I consent to results being shared with my referring doctor",
          "defaultValue": false,
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "consent_subcontract",
          "title": "I understand parts of my study may be performed by a subcontractor",
          "defaultValue": false,
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "consent_withdrawal",
          "title": "I understand I may withdraw consent at any time",
          "defaultValue": false,
          "isRequired": true
        }
      ]
    },
    {
      "name": "signature",
      "title": "Signature",
      "elements": [
        {
          "type": "text",
          "name": "patient_signature",
          "title": "Patient (or parent/guardian) signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "patient_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "witness_name",
          "title": "Witness (staff) name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "witness_date",
          "title": "Witness date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-004"] = """
{
  "title": "Equipment Register Entry",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "id",
      "title": "Section 1 \u2013 Identification",
      "elements": [
        {
          "type": "text",
          "name": "equipment_id",
          "title": "Equipment ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "description",
          "title": "Description",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "manufacturer",
          "title": "Manufacturer"
        },
        {
          "type": "text",
          "name": "model",
          "title": "Model"
        },
        {
          "type": "text",
          "name": "serial",
          "title": "Serial number"
        },
        {
          "type": "text",
          "name": "artg",
          "title": "ARTG number"
        },
        {
          "type": "text",
          "name": "supplier",
          "title": "Supplier / contact"
        },
        {
          "type": "text",
          "name": "date_in_service",
          "title": "Date in service",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "location",
          "title": "Location"
        },
        {
          "type": "text",
          "name": "condition_received",
          "title": "Condition received"
        }
      ]
    },
    {
      "name": "docs",
      "title": "Section 2 \u2013 Documentation",
      "elements": [
        {
          "type": "boolean",
          "name": "manuals_filed",
          "title": "Manuals filed",
          "defaultValue": false
        },
        {
          "type": "text",
          "name": "acceptance_test",
          "title": "Acceptance test report / FRM-005 baseline reference"
        },
        {
          "type": "text",
          "name": "pm_schedule",
          "title": "Preventive maintenance schedule"
        }
      ]
    },
    {
      "name": "log",
      "title": "Section 3 \u2013 Verification & maintenance log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "verifications",
          "title": "Verification / maintenance log",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "v_date",
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "v_activity",
              "title": "Activity"
            },
            {
              "type": "text",
              "name": "v_result",
              "title": "Result / value"
            },
            {
              "type": "text",
              "name": "v_by",
              "title": "Performed by"
            },
            {
              "type": "text",
              "name": "v_action",
              "title": "Action / NC"
            }
          ]
        }
      ]
    },
    {
      "name": "repairs",
      "title": "Section 4 \u2013 Damage / malfunction / repair",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "repairs",
          "title": "Damage / malfunction / repair log",
          "addPanelText": "Add incident",
          "minPanelCount": 0,
          "templateElements": [
            {
              "type": "text",
              "name": "r_date",
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "comment",
              "name": "r_desc",
              "title": "Description",
              "rows": 3
            },
            {
              "type": "text",
              "name": "r_action",
              "title": "Action"
            },
            {
              "type": "text",
              "name": "r_reverif",
              "title": "Re-verification"
            }
          ]
        }
      ]
    },
    {
      "name": "decommission",
      "title": "Section 5 \u2013 Decommissioning",
      "elements": [
        {
          "type": "text",
          "name": "decomm_date",
          "title": "Date decommissioned",
          "inputType": "date"
        },
        {
          "type": "comment",
          "name": "decomm_reason",
          "title": "Reason",
          "rows": 3
        },
        {
          "type": "boolean",
          "name": "decontam_done",
          "title": "Decontamination completed",
          "defaultValue": false
        }
      ]
    }
  ]
}
""",
            ["FRM-005"] = """
{
  "title": "Equipment Verification Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Header",
      "elements": [
        {
          "type": "text",
          "name": "equipment_id",
          "title": "Equipment ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "verif_date",
          "title": "Verification date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "performed_by",
          "title": "Performed by",
          "isRequired": true
        }
      ]
    },
    {
      "name": "checks",
      "title": "Channel checks",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "checks",
          "title": "Channel checks",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "channel",
              "title": "Channel / parameter",
              "choices": [
                "EEG gain (50 \u00b5V square wave)",
                "EOG gain",
                "Chin EMG gain",
                "EEG filter response",
                "SpO2 \u2013 95%",
                "SpO2 \u2013 85%",
                "SpO2 \u2013 75%",
                "PAP pressure 0 cmH2O",
                "PAP pressure 4 cmH2O",
                "PAP pressure 10 cmH2O",
                "PAP pressure 20 cmH2O",
                "Sound level (annual)",
                "Position sensor",
                "Microphone",
                "Video sync"
              ]
            },
            {
              "type": "text",
              "name": "method",
              "title": "Method"
            },
            {
              "type": "text",
              "name": "expected",
              "title": "Expected value"
            },
            {
              "type": "text",
              "name": "measured",
              "title": "Measured value"
            },
            {
              "type": "radiogroup",
              "name": "result",
              "title": "Result",
              "choices": [
                "Pass",
                "Fail"
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "outcome",
      "title": "Outcome",
      "elements": [
        {
          "type": "radiogroup",
          "name": "overall",
          "title": "Overall outcome",
          "choices": [
            "All within spec \u2013 equipment cleared",
            "Out of spec \u2013 NC raised"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "nc_ref",
          "title": "NC reference (if out of spec)"
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "next_due",
          "title": "Next verification due",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-006"] = """
{
  "title": "Equipment Adverse Incident Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "incident",
      "title": "Section 1 \u2013 Incident",
      "elements": [
        {
          "type": "text",
          "name": "incident_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "incident_time",
          "title": "Time",
          "inputType": "time"
        },
        {
          "type": "text",
          "name": "location",
          "title": "Location",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "equipment_id",
          "title": "Equipment ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "reported_by",
          "title": "Reported by",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "description",
          "title": "Description of incident",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "impact",
      "title": "Section 2 \u2013 Patient impact",
      "elements": [
        {
          "type": "radiogroup",
          "name": "harm_level",
          "title": "Harm level",
          "choices": [
            "No harm / Near miss",
            "Minor harm",
            "Moderate harm",
            "Major harm"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Patient study ID(s) involved"
        }
      ]
    },
    {
      "name": "action",
      "title": "Section 3 \u2013 Immediate action",
      "elements": [
        {
          "type": "boolean",
          "name": "isolated",
          "title": "Equipment isolated",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "labelled",
          "title": "Labelled 'Do Not Use'",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "spare_deployed",
          "title": "Spare deployed",
          "defaultValue": false
        }
      ]
    },
    {
      "name": "investigation",
      "title": "Section 4 \u2013 Investigation",
      "elements": [
        {
          "type": "comment",
          "name": "root_cause",
          "title": "Root cause",
          "rows": 3
        },
        {
          "type": "boolean",
          "name": "prev_studies_assessed",
          "title": "Effect on previous studies assessed",
          "defaultValue": false
        },
        {
          "type": "radiogroup",
          "name": "reports_recalled",
          "title": "Reports recalled",
          "choices": [
            "Yes",
            "N/A"
          ]
        }
      ]
    },
    {
      "name": "external",
      "title": "Section 5 \u2013 External reporting",
      "elements": [
        {
          "type": "boolean",
          "name": "manufacturer_notified",
          "title": "Manufacturer notified",
          "defaultValue": false
        },
        {
          "type": "text",
          "name": "manufacturer_date",
          "title": "Manufacturer notification date",
          "inputType": "date"
        },
        {
          "type": "radiogroup",
          "name": "tga_reported",
          "title": "TGA report submitted",
          "choices": [
            "Yes",
            "Not required"
          ]
        },
        {
          "type": "text",
          "name": "tga_ref",
          "title": "TGA reference number"
        }
      ]
    },
    {
      "name": "closure",
      "title": "Section 6 \u2013 Closure",
      "elements": [
        {
          "type": "text",
          "name": "capa_id",
          "title": "Linked CAPA ID"
        },
        {
          "type": "text",
          "name": "md_signature",
          "title": "Medical Director signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "close_date",
          "title": "Date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-007"] = """
{
  "title": "Nonconformance Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "id",
      "title": "Section 1 \u2013 NC identification",
      "elements": [
        {
          "type": "text",
          "name": "nc_id",
          "title": "NC ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "date_raised",
          "title": "Date raised",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "raised_by",
          "title": "Raised by",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "source",
          "title": "Source",
          "choices": [
            "Internal audit",
            "Complaint",
            "Quality control",
            "Equipment failure",
            "Proficiency testing",
            "Other"
          ]
        },
        {
          "type": "comment",
          "name": "description",
          "title": "Description",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "significance",
      "title": "Section 2 \u2013 Clinical significance",
      "elements": [
        {
          "type": "radiogroup",
          "name": "patient_impact",
          "title": "Patient impact",
          "choices": [
            "None",
            "Potential patient impact",
            "Actual patient impact"
          ],
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "clinician_informed",
          "title": "Referring clinician informed",
          "choices": [
            "Yes",
            "N/A"
          ]
        },
        {
          "type": "radiogroup",
          "name": "study_halted",
          "title": "Study halted / report withheld",
          "choices": [
            "Yes",
            "N/A"
          ]
        }
      ]
    },
    {
      "name": "action",
      "title": "Section 3 \u2013 Immediate action",
      "elements": [
        {
          "type": "comment",
          "name": "immediate_action",
          "title": "Immediate action taken",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "recall",
      "title": "Section 4 \u2013 Recall (if applicable)",
      "elements": [
        {
          "type": "boolean",
          "name": "reports_recalled",
          "title": "Reports recalled",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "patients_notified",
          "title": "Patients notified",
          "defaultValue": false
        },
        {
          "type": "text",
          "name": "recall_details",
          "title": "Details"
        }
      ]
    },
    {
      "name": "auth",
      "title": "Section 5 \u2013 Authorisation to resume",
      "elements": [
        {
          "type": "text",
          "name": "authorised_by",
          "title": "Authorised by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "auth_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "capa",
      "title": "Section 6 \u2013 CAPA link",
      "elements": [
        {
          "type": "text",
          "name": "capa_id",
          "title": "CAPA ID"
        },
        {
          "type": "text",
          "name": "closed_date",
          "title": "Closed date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-008"] = """
{
  "title": "CAPA Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "id",
      "title": "Section 1 \u2013 CAPA identification",
      "elements": [
        {
          "type": "text",
          "name": "capa_id",
          "title": "CAPA ID",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "capa_type",
          "title": "Type",
          "choices": [
            "Corrective",
            "Preventive"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "source",
          "title": "Source NC / risk",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "owner",
          "title": "Owner",
          "isRequired": true
        }
      ]
    },
    {
      "name": "rca",
      "title": "Section 2 \u2013 Root cause analysis (5-Whys)",
      "elements": [
        {
          "type": "comment",
          "name": "why1",
          "title": "Why 1",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "why2",
          "title": "Why 2",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "why3",
          "title": "Why 3",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "why4",
          "title": "Why 4",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "why5",
          "title": "Why 5 / Root cause",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "plan",
      "title": "Section 3 \u2013 Action plan",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "actions",
          "title": "Actions",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "comment",
              "name": "action",
              "title": "Action",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "text",
              "name": "action_owner",
              "title": "Owner"
            },
            {
              "type": "text",
              "name": "action_due",
              "title": "Due",
              "inputType": "date"
            },
            {
              "type": "dropdown",
              "name": "action_status",
              "title": "Status",
              "choices": [
                "Open",
                "In progress",
                "Complete"
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "review",
      "title": "Section 4 \u2013 Effectiveness review",
      "elements": [
        {
          "type": "text",
          "name": "review_date",
          "title": "Review date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "outcome",
          "title": "Outcome",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "closed",
          "title": "Closed",
          "defaultValue": false
        }
      ]
    }
  ]
}
""",
            ["FRM-009"] = """
{
  "title": "Internal Audit Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "details",
      "title": "Section 1 \u2013 Audit details",
      "elements": [
        {
          "type": "text",
          "name": "audit_id",
          "title": "Audit ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "audit_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "scope",
          "title": "Scope",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "criteria",
          "title": "Criteria"
        },
        {
          "type": "text",
          "name": "auditors",
          "title": "Auditor(s)",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "auditees",
          "title": "Auditee(s)",
          "isRequired": true
        }
      ]
    },
    {
      "name": "findings",
      "title": "Section 2 \u2013 Findings",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "findings",
          "title": "Findings",
          "addPanelText": "Add finding",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "clause",
              "title": "Clause / requirement"
            },
            {
              "type": "dropdown",
              "name": "finding_type",
              "title": "Finding type",
              "choices": [
                "Conformant",
                "Observation",
                "Minor NC",
                "Major NC"
              ]
            },
            {
              "type": "comment",
              "name": "evidence",
              "title": "Evidence / notes",
              "rows": 2
            }
          ]
        }
      ]
    },
    {
      "name": "summary",
      "title": "Section 3 \u2013 Summary",
      "elements": [
        {
          "type": "comment",
          "name": "summary",
          "title": "Summary and recommendations",
          "rows": 5,
          "isRequired": true
        }
      ]
    },
    {
      "name": "signoff",
      "title": "Section 4 \u2013 Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "auditor_sig",
          "title": "Auditor signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "auditee_ack",
          "title": "Auditee acknowledgement",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signoff_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-010"] = """
{
  "title": "Management Review Minutes",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "meeting",
      "title": "Meeting details",
      "elements": [
        {
          "type": "text",
          "name": "meeting_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "chair",
          "title": "Chair",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "attendees",
          "title": "Attendees",
          "isRequired": true
        }
      ]
    },
    {
      "name": "items",
      "title": "Standing items",
      "elements": [
        {
          "type": "comment",
          "name": "item_0",
          "title": "Referral review & suitability",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_1",
          "title": "Referrer & patient feedback",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_2",
          "title": "Staff suggestions",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_3",
          "title": "Internal audits",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_4",
          "title": "Risk management",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_5",
          "title": "Quality indicators",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_6",
          "title": "External assessments",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_7",
          "title": "Proficiency testing",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_8",
          "title": "Complaints",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_9",
          "title": "Supplier / subcontractor performance",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_10",
          "title": "Nonconformances",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_11",
          "title": "CAPA status",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_12",
          "title": "Previous review follow-up",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_13",
          "title": "Changes (volume / scope / staff / premises)",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "item_14",
          "title": "Improvement recommendations & resource needs",
          "rows": 2
        }
      ]
    },
    {
      "name": "actions",
      "title": "Actions",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "actions",
          "title": "Action items",
          "addPanelText": "Add action",
          "minPanelCount": 0,
          "templateElements": [
            {
              "type": "comment",
              "name": "action",
              "title": "Action",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "text",
              "name": "action_owner",
              "title": "Owner"
            },
            {
              "type": "text",
              "name": "action_due",
              "title": "Due date",
              "inputType": "date"
            }
          ]
        }
      ]
    },
    {
      "name": "close",
      "title": "Close",
      "elements": [
        {
          "type": "text",
          "name": "next_review",
          "title": "Next review date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "chair_sig",
          "title": "Chair signature",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-011"] = """
{
  "title": "Complaint Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "receipt",
      "title": "Section 1 \u2013 Receipt",
      "elements": [
        {
          "type": "text",
          "name": "complaint_id",
          "title": "Complaint ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "received_date",
          "title": "Received date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "channel",
          "title": "Channel",
          "choices": [
            "Phone",
            "Email",
            "Letter",
            "In person",
            "Online",
            "Other"
          ]
        },
        {
          "type": "text",
          "name": "received_by",
          "title": "Received by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "complainant",
          "title": "Complainant",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "contact",
          "title": "Contact details"
        }
      ]
    },
    {
      "name": "triage",
      "title": "Section 2 \u2013 Triage",
      "elements": [
        {
          "type": "radiogroup",
          "name": "severity",
          "title": "Severity",
          "choices": [
            "Minor",
            "Significant",
            "Major",
            "Sentinel"
          ],
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "ack_sent",
          "title": "Acknowledgement sent",
          "defaultValue": false
        },
        {
          "type": "text",
          "name": "ack_date",
          "title": "Acknowledgement date",
          "inputType": "date"
        }
      ]
    },
    {
      "name": "summary",
      "title": "Section 3 \u2013 Complaint summary",
      "elements": [
        {
          "type": "comment",
          "name": "summary",
          "title": "Summary",
          "rows": 4,
          "isRequired": true
        }
      ]
    },
    {
      "name": "investigation",
      "title": "Section 4 \u2013 Investigation & response",
      "elements": [
        {
          "type": "text",
          "name": "investigator",
          "title": "Investigator",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "findings",
          "title": "Findings",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "text",
          "name": "response_date",
          "title": "Response date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "linked_capa",
          "title": "Linked CAPA"
        }
      ]
    },
    {
      "name": "closure",
      "title": "Section 5 \u2013 Closure",
      "elements": [
        {
          "type": "boolean",
          "name": "closed",
          "title": "Closed",
          "defaultValue": false
        },
        {
          "type": "text",
          "name": "close_date",
          "title": "Close date",
          "inputType": "date"
        },
        {
          "type": "boolean",
          "name": "escalation_provided",
          "title": "Escalation pathway provided",
          "defaultValue": false
        }
      ]
    }
  ]
}
""",
            ["FRM-012"] = """
{
  "title": "Patient Feedback Survey",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "ratings",
      "title": "Your experience",
      "elements": [
        {
          "type": "matrix",
          "name": "ratings",
          "title": "Please rate your experience (1=Strongly disagree, 5=Strongly agree)",
          "rows": [
            "Booking was easy and clear",
            "Staff were courteous and professional",
            "I understood the procedure before it began",
            "The environment was clean and comfortable",
            "My privacy was respected",
            "My results were explained clearly",
            "I would recommend this service"
          ],
          "columns": [
            "1 \u2013 Strongly disagree",
            "2",
            "3",
            "4",
            "5 \u2013 Strongly agree"
          ],
          "isAllRowRequired": true
        }
      ]
    },
    {
      "name": "open",
      "title": "Comments",
      "elements": [
        {
          "type": "comment",
          "name": "what_went_well",
          "title": "What did we do well?",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "improvements",
          "title": "What could we improve?",
          "rows": 3
        },
        {
          "type": "text",
          "name": "name",
          "title": "Name (optional)"
        },
        {
          "type": "text",
          "name": "survey_date",
          "title": "Date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-013"] = """
{
  "title": "Referrer Feedback Survey",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "ratings",
      "title": "Service ratings",
      "elements": [
        {
          "type": "matrix",
          "name": "ratings",
          "title": "Please rate the service (1=Strongly disagree, 5=Strongly agree)",
          "rows": [
            "Referral process is straightforward",
            "Reports are timely (within 10 business days)",
            "Reports are clear and clinically useful",
            "Urgent cases are managed appropriately",
            "Service communicates well",
            "I am confident in the diagnostic quality"
          ],
          "columns": [
            "1 \u2013 Strongly disagree",
            "2",
            "3",
            "4",
            "5 \u2013 Strongly agree"
          ],
          "isAllRowRequired": true
        }
      ]
    },
    {
      "name": "open",
      "title": "Comments",
      "elements": [
        {
          "type": "comment",
          "name": "comments",
          "title": "Comments",
          "rows": 3
        },
        {
          "type": "text",
          "name": "practice",
          "title": "Practice / referrer (optional)"
        },
        {
          "type": "text",
          "name": "survey_date",
          "title": "Date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-014"] = """
{
  "title": "Training & Competency Record",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "staff",
      "title": "Staff details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "role",
          "title": "Role",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "start_date",
          "title": "Start date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "employee_id",
          "title": "Employee ID"
        }
      ]
    },
    {
      "name": "quals",
      "title": "Qualifications",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "qualifications",
          "title": "Qualifications",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "qual_name",
              "title": "Qualification",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "institution_year",
              "title": "Institution / Year"
            },
            {
              "type": "dropdown",
              "name": "evidence",
              "title": "Evidence on file",
              "choices": [
                "Yes",
                "No",
                "Pending"
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "comps",
      "title": "Mandatory competencies",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "competencies",
          "title": "Mandatory competency assessments",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "comp_name",
              "title": "Competency",
              "choices": [
                "BLS (annual)",
                "Paediatric BLS (if applicable)",
                "Patient identification (3-ID)",
                "Biocalibration & study setup",
                "CPAP titration (if applicable)",
                "Scoring \u2013 adult",
                "Scoring \u2013 paediatric (if applicable)",
                "Infection control",
                "Emergency response"
              ]
            },
            {
              "type": "text",
              "name": "initial_date",
              "title": "Initial assessment date",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "last_reassess",
              "title": "Last reassessment",
              "inputType": "date"
            },
            {
              "type": "radiogroup",
              "name": "outcome",
              "title": "Outcome",
              "choices": [
                "Competent",
                "Needs reassessment",
                "Not applicable"
              ]
            },
            {
              "type": "text",
              "name": "assessor",
              "title": "Assessor"
            }
          ]
        }
      ]
    },
    {
      "name": "cpd",
      "title": "CPD log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "cpd",
          "title": "CPD log",
          "addPanelText": "Add CPD entry",
          "minPanelCount": 0,
          "templateElements": [
            {
              "type": "text",
              "name": "cpd_date",
              "title": "Date",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "cpd_activity",
              "title": "Activity"
            },
            {
              "type": "text",
              "name": "cpd_hours",
              "title": "Hours",
              "inputType": "number"
            },
            {
              "type": "dropdown",
              "name": "cpd_evidence",
              "title": "Evidence",
              "choices": [
                "Certificate on file",
                "Attendance record",
                "Other"
              ]
            }
          ]
        }
      ]
    },
    {
      "name": "appraisal",
      "title": "Appraisal",
      "elements": [
        {
          "type": "text",
          "name": "last_appraisal",
          "title": "Most recent appraisal date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "next_appraisal",
          "title": "Next due",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-015"] = """
{
  "title": "Conflict of Interest Declaration",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "staff",
      "title": "Staff details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Full name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "role",
          "title": "Role / position",
          "isRequired": true
        }
      ]
    },
    {
      "name": "interests",
      "title": "Interests",
      "elements": [
        {
          "type": "boolean",
          "name": "no_conflicts",
          "title": "I have no conflicts of interest to declare",
          "defaultValue": false
        },
        {
          "type": "paneldynamic",
          "name": "interests",
          "title": "Declared interests",
          "addPanelText": "Add interest",
          "minPanelCount": 0,
          "templateElements": [
            {
              "type": "comment",
              "name": "interest",
              "title": "Nature of interest",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "dropdown",
              "name": "interest_type",
              "title": "Type",
              "choices": [
                "Financial",
                "Personal relationship",
                "Professional / employment",
                "Other"
              ]
            },
            {
              "type": "text",
              "name": "value",
              "title": "Value / extent"
            },
            {
              "type": "comment",
              "name": "management",
              "title": "Management / mitigation plan",
              "rows": 2,
              "isRequired": true
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Signature",
      "elements": [
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "qm_review",
          "title": "Quality Manager review"
        },
        {
          "type": "text",
          "name": "qm_date",
          "title": "QM review date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-016"] = """
{
  "title": "Job Description Template",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "position",
      "title": "Section 1 \u2013 Position",
      "elements": [
        {
          "type": "text",
          "name": "title",
          "title": "Position title",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "reports_to",
          "title": "Reports to",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "hours",
          "title": "Hours / FTE"
        }
      ]
    },
    {
      "name": "purpose",
      "title": "Section 2 \u2013 Purpose",
      "elements": [
        {
          "type": "comment",
          "name": "purpose",
          "title": "Purpose of the role",
          "rows": 4,
          "isRequired": true
        }
      ]
    },
    {
      "name": "responsibilities",
      "title": "Section 3 \u2013 Key responsibilities",
      "elements": [
        {
          "type": "comment",
          "name": "responsibilities",
          "title": "Key responsibilities (one per line)",
          "rows": 6,
          "isRequired": true
        }
      ]
    },
    {
      "name": "qualifications",
      "title": "Section 4 \u2013 Qualifications",
      "elements": [
        {
          "type": "comment",
          "name": "qualifications",
          "title": "Required qualifications and experience",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "competencies",
          "title": "Required competencies",
          "rows": 4
        }
      ]
    },
    {
      "name": "accountability",
      "title": "Section 5 \u2013 Accountability",
      "elements": [
        {
          "type": "text",
          "name": "deputises",
          "title": "Deputises for"
        },
        {
          "type": "text",
          "name": "authority_limits",
          "title": "QMS authority limits"
        }
      ]
    },
    {
      "name": "endorsement",
      "title": "Section 6 \u2013 Endorsement",
      "elements": [
        {
          "type": "text",
          "name": "incumbent_sig",
          "title": "Incumbent signature"
        },
        {
          "type": "text",
          "name": "incumbent_date",
          "title": "Date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "md_sig",
          "title": "Medical Director signature"
        },
        {
          "type": "text",
          "name": "md_date",
          "title": "MD date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-017"] = """
{
  "title": "Provisional CPAP Prescription",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        }
      ]
    },
    {
      "name": "study",
      "title": "Study reference",
      "elements": [
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "technologist",
          "title": "Technologist",
          "isRequired": true
        }
      ]
    },
    {
      "name": "prescription",
      "title": "Provisional prescription",
      "elements": [
        {
          "type": "checkbox",
          "name": "mode",
          "title": "Mode",
          "choices": [
            "CPAP",
            "APAP",
            "Bi-level S",
            "ST",
            "AVAPS"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "cpap_pressure",
          "title": "CPAP pressure (cmH2O)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ipap",
          "title": "IPAP (cmH2O)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "epap",
          "title": "EPAP (cmH2O)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "backup_rate",
          "title": "Backup rate (if NIV)"
        },
        {
          "type": "radiogroup",
          "name": "humidifier",
          "title": "Humidifier",
          "choices": [
            "Yes",
            "No"
          ]
        },
        {
          "type": "text",
          "name": "interface",
          "title": "Interface / mask type"
        },
        {
          "type": "comment",
          "name": "notes",
          "title": "Notes / leak / comfort observations",
          "rows": 3
        }
      ]
    },
    {
      "name": "auth",
      "title": "Authorisation",
      "elements": [
        {
          "type": "text",
          "name": "issuing_tech",
          "title": "Issuing technologist",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "issue_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "reviewing_physician",
          "title": "Reviewing physician"
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Review date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-018"] = """
{
  "title": "Subcontractor Evaluation",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "details",
      "title": "Subcontractor details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Subcontractor name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "scope",
          "title": "Scope of service",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "accreditation",
          "title": "Accreditation status"
        },
        {
          "type": "text",
          "name": "expiry",
          "title": "Accreditation expiry / renewal",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "contract_ref",
          "title": "Contract reference"
        },
        {
          "type": "text",
          "name": "owner",
          "title": "Service owner (this organisation)"
        }
      ]
    },
    {
      "name": "compliance",
      "title": "Evidence of compliance",
      "elements": [
        {
          "type": "boolean",
          "name": "cert_on_file",
          "title": "NATA / ASA accreditation certificate on file",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "pt_evidence",
          "title": "Proficiency-testing evidence available",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "qa_demonstrated",
          "title": "QA programme demonstrated",
          "defaultValue": false
        },
        {
          "type": "boolean",
          "name": "insurance",
          "title": "Insurance / indemnity verified",
          "defaultValue": false
        }
      ]
    },
    {
      "name": "performance",
      "title": "Performance review",
      "elements": [
        {
          "type": "matrix",
          "name": "performance",
          "title": "Performance ratings",
          "rows": [
            "Quality of work",
            "Turnaround time",
            "Communication",
            "NC / complaint history"
          ],
          "columns": [
            "1 \u2013 Poor",
            "2",
            "3 \u2013 Acceptable",
            "4",
            "5 \u2013 Excellent"
          ]
        },
        {
          "type": "comment",
          "name": "performance_notes",
          "title": "Performance notes",
          "rows": 3
        }
      ]
    },
    {
      "name": "decision",
      "title": "Decision",
      "elements": [
        {
          "type": "radiogroup",
          "name": "decision",
          "title": "Decision",
          "choices": [
            "Continue",
            "Continue with conditions",
            "Terminate"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "conditions",
          "title": "Conditions (if applicable)"
        },
        {
          "type": "text",
          "name": "signed",
          "title": "Signed",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-019"] = """
{
  "title": "Quality Indicator Tracking",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "definition",
      "title": "Indicator definition",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Indicator name",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "phase",
          "title": "Process phase",
          "choices": [
            "Pre-study",
            "Study",
            "Post-study"
          ]
        },
        {
          "type": "comment",
          "name": "objective",
          "title": "Objective",
          "rows": 2,
          "isRequired": true
        },
        {
          "type": "text",
          "name": "methodology",
          "title": "Measurement methodology",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "target",
          "title": "Target"
        },
        {
          "type": "text",
          "name": "threshold",
          "title": "Threshold / action level"
        },
        {
          "type": "text",
          "name": "period",
          "title": "Measurement period"
        },
        {
          "type": "text",
          "name": "owner",
          "title": "Owner",
          "isRequired": true
        }
      ]
    },
    {
      "name": "measurements",
      "title": "Measurements",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "measurements",
          "title": "Measurement log",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "meas_period",
              "title": "Period",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "numerator",
              "title": "Numerator",
              "inputType": "number"
            },
            {
              "type": "text",
              "name": "denominator",
              "title": "Denominator",
              "inputType": "number"
            },
            {
              "type": "text",
              "name": "result",
              "title": "Result / %"
            },
            {
              "type": "comment",
              "name": "action",
              "title": "Action if target missed",
              "rows": 2
            }
          ]
        }
      ]
    },
    {
      "name": "review",
      "title": "Annual review",
      "elements": [
        {
          "type": "text",
          "name": "reviewed_by",
          "title": "Reviewed by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "decision",
          "title": "Decision / outcome",
          "rows": 2,
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-020"] = """
{
  "title": "Proficiency Testing Result Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "log",
      "title": "PT result log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "results",
          "title": "Results",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "pt_date",
              "title": "Date",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "staff",
              "title": "Staff member",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "programme",
              "title": "PT programme",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "round",
              "title": "Round"
            },
            {
              "type": "text",
              "name": "result",
              "title": "Score / result"
            },
            {
              "type": "radiogroup",
              "name": "pass_fail",
              "title": "Pass / Fail",
              "choices": [
                "Pass",
                "Fail"
              ],
              "isRequired": true
            },
            {
              "type": "text",
              "name": "capa_id",
              "title": "CAPA ID (if fail)"
            }
          ]
        }
      ]
    },
    {
      "name": "review",
      "title": "Annual review",
      "elements": [
        {
          "type": "text",
          "name": "qm_name",
          "title": "Quality Manager",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-021"] = """
{
  "title": "Adult Polysomnography Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "study",
      "title": "Study identification",
      "elements": [
        {
          "type": "text",
          "name": "service",
          "title": "Service"
        },
        {
          "type": "text",
          "name": "site",
          "title": "Site"
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "report_date",
          "title": "Report date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "status",
          "title": "Report status",
          "choices": [
            "Preliminary",
            "Final",
            "Amended"
          ],
          "isRequired": true
        }
      ]
    },
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "sex",
          "title": "Sex",
          "choices": [
            "Male",
            "Female",
            "Other"
          ]
        }
      ]
    },
    {
      "name": "clinical",
      "title": "Clinical context",
      "elements": [
        {
          "type": "text",
          "name": "referring_doctor",
          "title": "Referring doctor",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "indication",
          "title": "Indication",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "results",
      "title": "Study results",
      "elements": [
        {
          "type": "text",
          "name": "trt",
          "title": "Total recording time (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "tst",
          "title": "Total sleep time (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "efficiency",
          "title": "Sleep efficiency (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "sleep_latency",
          "title": "Sleep latency (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "rem_latency",
          "title": "REM latency (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "n1_pct",
          "title": "N1 (% TST)"
        },
        {
          "type": "text",
          "name": "n2_pct",
          "title": "N2 (% TST)"
        },
        {
          "type": "text",
          "name": "n3_pct",
          "title": "N3 (% TST)"
        },
        {
          "type": "text",
          "name": "rem_pct",
          "title": "REM (% TST)"
        },
        {
          "type": "text",
          "name": "waso",
          "title": "WASO (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ahi_total",
          "title": "AHI \u2013 total",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ahi_supine",
          "title": "AHI \u2013 supine",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ahi_nonsupine",
          "title": "AHI \u2013 non-supine",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "odi3",
          "title": "ODI 3%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "odi4",
          "title": "ODI 4%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_mean",
          "title": "Mean SpO2 (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_nadir",
          "title": "SpO2 nadir (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_below90",
          "title": "% TST SpO2 <90%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "plmi",
          "title": "PLMI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "mean_hr",
          "title": "Mean HR (bpm)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "arrhythmia",
          "title": "Arrhythmia"
        }
      ]
    },
    {
      "name": "interpretation",
      "title": "Interpretation",
      "elements": [
        {
          "type": "comment",
          "name": "observations",
          "title": "Technical & clinical observations",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "interpretation",
          "title": "Interpretation",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "recommendations",
          "title": "Recommendations",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "physician",
      "title": "Reporting physician",
      "elements": [
        {
          "type": "text",
          "name": "physician",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-022"] = """
{
  "title": "Paediatric Polysomnography Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "study",
      "title": "Study identification",
      "elements": [
        {
          "type": "text",
          "name": "service",
          "title": "Service"
        },
        {
          "type": "text",
          "name": "site",
          "title": "Site"
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "report_date",
          "title": "Report date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "status",
          "title": "Report status",
          "choices": [
            "Preliminary",
            "Final",
            "Amended"
          ],
          "isRequired": true
        }
      ]
    },
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "age",
          "title": "Age"
        },
        {
          "type": "dropdown",
          "name": "sex",
          "title": "Sex",
          "choices": [
            "Male",
            "Female",
            "Other"
          ]
        },
        {
          "type": "text",
          "name": "weight_height",
          "title": "Weight / Height"
        }
      ]
    },
    {
      "name": "clinical",
      "title": "Clinical context",
      "elements": [
        {
          "type": "text",
          "name": "referring_doctor",
          "title": "Referring paediatrician",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "indication",
          "title": "Indication",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "results",
      "title": "Study results (paediatric)",
      "elements": [
        {
          "type": "text",
          "name": "tst",
          "title": "TST (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "efficiency",
          "title": "Sleep efficiency (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "n1_pct",
          "title": "N1 (% TST)"
        },
        {
          "type": "text",
          "name": "n2_pct",
          "title": "N2 (% TST)"
        },
        {
          "type": "text",
          "name": "n3_pct",
          "title": "N3 (% TST)"
        },
        {
          "type": "text",
          "name": "rem_pct",
          "title": "REM (% TST)"
        },
        {
          "type": "text",
          "name": "oahi",
          "title": "Obstructive AHI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "mixed_central",
          "title": "Mixed / central AHI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "rdi",
          "title": "RDI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_nadir",
          "title": "SpO2 nadir (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_below90",
          "title": "% TST SpO2 <90%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "tcco2_peak",
          "title": "TcCO2 peak (mmHg)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "tcco2_pct",
          "title": "% TST TcCO2 >50 mmHg",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "arousal_index",
          "title": "Arousal index",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "plmi",
          "title": "PLMI",
          "inputType": "number"
        }
      ]
    },
    {
      "name": "interpretation",
      "title": "Interpretation",
      "elements": [
        {
          "type": "comment",
          "name": "observations",
          "title": "Technical & clinical observations",
          "rows": 3
        },
        {
          "type": "comment",
          "name": "interpretation",
          "title": "Interpretation",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "recommendations",
          "title": "Recommendations",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "physician",
      "title": "Paediatric sleep physician",
      "elements": [
        {
          "type": "text",
          "name": "physician",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-023"] = """
{
  "title": "CPAP / PAP Titration Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "study",
      "title": "Identification",
      "elements": [
        {
          "type": "text",
          "name": "service",
          "title": "Service"
        },
        {
          "type": "text",
          "name": "site",
          "title": "Site"
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "status",
          "title": "Status",
          "choices": [
            "Preliminary",
            "Final",
            "Amended"
          ],
          "isRequired": true
        }
      ]
    },
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "DOB",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        }
      ]
    },
    {
      "name": "protocol",
      "title": "Titration protocol",
      "elements": [
        {
          "type": "comment",
          "name": "preceding_study",
          "title": "Indication / preceding diagnostic study",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "checkbox",
          "name": "mode",
          "title": "Mode",
          "choices": [
            "CPAP",
            "APAP",
            "Bi-level",
            "Split-night"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "interface",
          "title": "Interface"
        },
        {
          "type": "text",
          "name": "start_pressure",
          "title": "Starting pressure (cmH2O)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "range_trialled",
          "title": "Range trialled"
        },
        {
          "type": "text",
          "name": "optimal_pressure",
          "title": "Optimal pressure (cmH2O)",
          "inputType": "number"
        }
      ]
    },
    {
      "name": "results",
      "title": "Results",
      "elements": [
        {
          "type": "text",
          "name": "ahi_untreated",
          "title": "AHI \u2013 untreated",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ahi_treated",
          "title": "AHI \u2013 on therapy",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_nadir_untreated",
          "title": "SpO2 nadir \u2013 untreated (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_nadir_treated",
          "title": "SpO2 nadir \u2013 on therapy (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_below90_untreated",
          "title": "% TST SpO2 <90% \u2013 untreated",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_below90_treated",
          "title": "% TST SpO2 <90% \u2013 on therapy",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "arousal_untreated",
          "title": "Arousal index \u2013 untreated",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "arousal_treated",
          "title": "Arousal index \u2013 on therapy",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "leak",
          "title": "Mask leak (L/min)",
          "inputType": "number"
        },
        {
          "type": "comment",
          "name": "recommendation",
          "title": "Recommendation",
          "rows": 4,
          "isRequired": true
        }
      ]
    },
    {
      "name": "physician",
      "title": "Reporting physician",
      "elements": [
        {
          "type": "text",
          "name": "physician",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-024"] = """
{
  "title": "MSLT / MWT Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "study",
      "title": "Identification",
      "elements": [
        {
          "type": "text",
          "name": "service",
          "title": "Service"
        },
        {
          "type": "text",
          "name": "site",
          "title": "Site"
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "study_type",
          "title": "Study type",
          "choices": [
            "MSLT \u2013 5 naps",
            "MWT \u2013 4 trials"
          ],
          "isRequired": true
        }
      ]
    },
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "DOB",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        }
      ]
    },
    {
      "name": "psg",
      "title": "Preceding overnight PSG (MSLT)",
      "elements": [
        {
          "type": "text",
          "name": "psg_tst",
          "title": "TST (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "psg_ahi",
          "title": "AHI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "psg_stages",
          "title": "Sleep stage summary"
        }
      ]
    },
    {
      "name": "trials",
      "title": "Trial results",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "trials",
          "title": "Trials",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "trial_no",
              "title": "Trial #",
              "choices": [
                "1",
                "2",
                "3",
                "4",
                "5"
              ]
            },
            {
              "type": "text",
              "name": "start_time",
              "title": "Start time",
              "inputType": "time"
            },
            {
              "type": "text",
              "name": "sleep_latency",
              "title": "Sleep latency (min)",
              "inputType": "number"
            },
            {
              "type": "text",
              "name": "rem_latency",
              "title": "REM latency"
            },
            {
              "type": "text",
              "name": "stages",
              "title": "Stages reached"
            }
          ]
        }
      ]
    },
    {
      "name": "summary",
      "title": "Summary & interpretation",
      "elements": [
        {
          "type": "text",
          "name": "mean_latency",
          "title": "Mean sleep latency (min)",
          "inputType": "number",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "soremp",
          "title": "Sleep-onset REM periods (SOREMPs)",
          "inputType": "number"
        },
        {
          "type": "comment",
          "name": "interpretation",
          "title": "Interpretation",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "text",
          "name": "physician",
          "title": "Reporting physician",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-025"] = """
{
  "title": "Home / Ambulatory Sleep Study Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "study",
      "title": "Identification",
      "elements": [
        {
          "type": "text",
          "name": "service",
          "title": "Service"
        },
        {
          "type": "text",
          "name": "site",
          "title": "Site"
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_date",
          "title": "Study date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "patient",
      "title": "Patient",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "DOB",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mrn",
          "title": "MRN",
          "isRequired": true
        }
      ]
    },
    {
      "name": "device",
      "title": "Device & technical",
      "elements": [
        {
          "type": "checkbox",
          "name": "device_type",
          "title": "Device type",
          "choices": [
            "Type 2",
            "Type 3",
            "Type 4"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "device_model",
          "title": "Model / serial"
        },
        {
          "type": "text",
          "name": "recording_time",
          "title": "Total recording time (min)",
          "inputType": "number"
        },
        {
          "type": "radiogroup",
          "name": "technically_adequate",
          "title": "Technically adequate",
          "choices": [
            "Yes",
            "No"
          ],
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "technical_notes",
          "title": "Technical notes (if not adequate)",
          "rows": 3
        }
      ]
    },
    {
      "name": "results",
      "title": "Results",
      "elements": [
        {
          "type": "text",
          "name": "monitoring_time",
          "title": "Estimated TST / monitoring time (min)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "ahi",
          "title": "AHI / REI",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "odi3",
          "title": "ODI 3%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "odi4",
          "title": "ODI 4%",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_mean",
          "title": "Mean SpO2 (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "spo2_nadir",
          "title": "SpO2 nadir (%)",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "snore_index",
          "title": "Snore index",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "position_summary",
          "title": "Body position summary"
        },
        {
          "type": "comment",
          "name": "interpretation",
          "title": "Interpretation & recommendation",
          "rows": 4,
          "isRequired": true
        }
      ]
    },
    {
      "name": "physician",
      "title": "Reporting physician",
      "elements": [
        {
          "type": "text",
          "name": "physician",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "signature",
          "title": "Signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-026"] = """
{
  "title": "Amended Report Cover",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "amendment",
      "title": "Amendment notice",
      "elements": [
        {
          "type": "text",
          "name": "original_date",
          "title": "Original report date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_id",
          "title": "Study ID",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "reason",
          "title": "Reason for amendment",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "change_summary",
          "title": "Summary of change",
          "rows": 3,
          "isRequired": true
        }
      ]
    },
    {
      "name": "auth",
      "title": "Authorisation",
      "elements": [
        {
          "type": "text",
          "name": "amended_by",
          "title": "Amended by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "role",
          "title": "Role",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "change_date",
          "title": "Date of change",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "boolean",
          "name": "original_retained",
          "title": "Original report retained",
          "defaultValue": false
        }
      ]
    }
  ]
}
""",
            ["FRM-027"] = """
{
  "title": "Document Change Request",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "request",
      "title": "Request",
      "elements": [
        {
          "type": "text",
          "name": "doc_id",
          "title": "Document ID",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "current_revision",
          "title": "Current revision",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "requested_by",
          "title": "Requested by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "request_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "reason",
          "title": "Reason for change",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "proposed_change",
          "title": "Summary of proposed change",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "impact",
          "title": "Impact assessment (related documents / training)",
          "rows": 2
        }
      ]
    },
    {
      "name": "approval",
      "title": "Review & approval",
      "elements": [
        {
          "type": "text",
          "name": "qm",
          "title": "Quality Manager",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "qm_date",
          "title": "QM date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "authoriser",
          "title": "Authoriser",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "auth_date",
          "title": "Authoriser date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "new_revision",
          "title": "New revision number assigned"
        },
        {
          "type": "text",
          "name": "effective_date",
          "title": "Effective date",
          "inputType": "date"
        }
      ]
    }
  ]
}
""",
            ["FRM-028"] = """
{
  "title": "Staff Suggestion / Improvement Idea",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "suggestion",
      "title": "Suggestion",
      "elements": [
        {
          "type": "text",
          "name": "submitted_by",
          "title": "Submitted by (optional)"
        },
        {
          "type": "text",
          "name": "sub_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "suggestion",
          "title": "Suggestion",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "benefit",
          "title": "Expected benefit / outcome",
          "rows": 3
        }
      ]
    },
    {
      "name": "triage",
      "title": "Quality Manager triage",
      "elements": [
        {
          "type": "radiogroup",
          "name": "decision",
          "title": "Decision",
          "choices": [
            "Accept",
            "Trial",
            "Refer to management review",
            "Decline"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "decline_reason",
          "title": "Decline reason"
        },
        {
          "type": "text",
          "name": "action_owner",
          "title": "Owner"
        },
        {
          "type": "text",
          "name": "target_date",
          "title": "Target date",
          "inputType": "date"
        },
        {
          "type": "comment",
          "name": "outcome",
          "title": "Outcome",
          "rows": 3
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-001"] = """
{
  "title": "Bomb Threat Form",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "call",
      "title": "Call information",
      "elements": [
        {
          "type": "text",
          "name": "threat_date",
          "title": "Date of call",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "call_time",
          "title": "Time of call",
          "inputType": "time",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "hung_up_time",
          "title": "Time caller hung up",
          "inputType": "time"
        },
        {
          "type": "text",
          "name": "phone_received",
          "title": "Phone number where call received"
        },
        {
          "type": "radiogroup",
          "name": "caller_sex",
          "title": "Caller sex",
          "choices": [
            "Female",
            "Male",
            "Unknown"
          ]
        },
        {
          "type": "text",
          "name": "estimated_age",
          "title": "Estimated age"
        },
        {
          "type": "comment",
          "name": "voice_description",
          "title": "Caller's voice description",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "background_sounds",
          "title": "Background sounds / noise level",
          "rows": 2
        }
      ]
    },
    {
      "name": "threat",
      "title": "Threat details",
      "elements": [
        {
          "type": "text",
          "name": "bomb_location",
          "title": "Where is bomb located?",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "when_explode",
          "title": "When will it go off?"
        },
        {
          "type": "text",
          "name": "what_look",
          "title": "What does it look like?"
        },
        {
          "type": "text",
          "name": "bomb_type",
          "title": "What kind of bomb?"
        },
        {
          "type": "text",
          "name": "detonation",
          "title": "What will make it explode?"
        },
        {
          "type": "radiogroup",
          "name": "placed_bomb",
          "title": "Did caller place the bomb?",
          "choices": [
            "Yes",
            "No",
            "Unclear"
          ]
        },
        {
          "type": "text",
          "name": "why",
          "title": "Why?"
        },
        {
          "type": "text",
          "name": "caller_name",
          "title": "Caller's name"
        },
        {
          "type": "text",
          "name": "caller_location",
          "title": "Caller's location / address"
        },
        {
          "type": "comment",
          "name": "exact_words",
          "title": "Exact words of threat",
          "rows": 4,
          "isRequired": true
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-002"] = """
{
  "title": "Cardiopulmonary Emergency Drill Form",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Drill details",
      "elements": [
        {
          "type": "text",
          "name": "drill_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "drill_time",
          "title": "Time",
          "inputType": "time",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "location",
          "title": "Location",
          "isRequired": true
        },
        {
          "type": "dropdown",
          "name": "drill_type",
          "title": "Drill type",
          "choices": [
            "Quarterly drill",
            "Annual drill",
            "Other"
          ]
        },
        {
          "type": "comment",
          "name": "performance_notes",
          "title": "Performance evaluation notes",
          "rows": 3
        }
      ]
    },
    {
      "name": "checklist",
      "title": "Drill checklist",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "tasks",
          "title": "Drill task log",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "task",
              "title": "Task",
              "choices": [
                "Time drill began",
                "Time 1st sleep tech arrives at the sleep room",
                "Patient checked for responsiveness",
                "Time sleep tech calls for help or 911",
                "Patient checked for breathing",
                "Tech places hands for chest compressions",
                "Clothes moved out of way",
                "Time CPR started",
                "Chest compressions done correctly",
                "Time Tech #2 arrives",
                "Tech #1 commands Tech #2 to get AED",
                "Time AED arrived",
                "AED turned on immediately",
                "AED pads applied immediately",
                "Sleep tech used AED correctly",
                "Time emergency personnel arrive",
                "Team communicated throughout drill",
                "Time drill ends"
              ]
            },
            {
              "type": "text",
              "name": "task_time",
              "title": "Time (if applicable)",
              "inputType": "time"
            },
            {
              "type": "radiogroup",
              "name": "completed",
              "title": "Completed correctly",
              "choices": [
                "Yes",
                "No",
                "N/A"
              ]
            },
            {
              "type": "text",
              "name": "initials",
              "title": "Initials of tech"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-003"] = """
{
  "title": "CE Log \u2013 Inservice Sign-In Sheet",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "session",
      "title": "Session details",
      "elements": [
        {
          "type": "text",
          "name": "session_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "start_time",
          "title": "Start time",
          "inputType": "time",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "finish_time",
          "title": "Finish time",
          "inputType": "time",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "cec_earned",
          "title": "Number of CECs earned",
          "inputType": "number",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "topic",
          "title": "Topic",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "objectives",
          "title": "Objective(s)",
          "rows": 2
        },
        {
          "type": "text",
          "name": "presenter",
          "title": "Presenter name and title",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "director",
          "title": "Director"
        }
      ]
    },
    {
      "name": "attendance",
      "title": "Attendance",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "attendees",
          "title": "Attendance list",
          "addPanelText": "Add attendee",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "att_name",
              "title": "Name",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "att_signature",
              "title": "Signature"
            },
            {
              "type": "text",
              "name": "att_credentials",
              "title": "Credentials"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-004"] = """
{
  "title": "CEC Log \u2013 Technical Staff",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "staff",
      "title": "Staff details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Employee name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "hire_date",
          "title": "Date of hire",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "title",
          "title": "Title"
        },
        {
          "type": "text",
          "name": "total_credits",
          "title": "Total credits earned for the year(s)",
          "inputType": "number"
        }
      ]
    },
    {
      "name": "log",
      "title": "CEC log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "cec",
          "title": "CEC log",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "ce_date",
              "title": "Date of CE session",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "provider",
              "title": "Continuing education provider",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "topic",
              "title": "Topic",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "credits",
              "title": "Number of CECs earned",
              "inputType": "number",
              "isRequired": true
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-005"] = """
{
  "title": "CME Log \u2013 Professional Staff",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "staff",
      "title": "Staff details",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Professional staff member name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "total_credits",
          "title": "Total CME credits earned for the year(s)",
          "inputType": "number"
        }
      ]
    },
    {
      "name": "log",
      "title": "CME log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "cme",
          "title": "CME log",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "cme_date",
              "title": "Date of CME session",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "provider",
              "title": "Continuing education provider",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "topic",
              "title": "Topic",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "credits",
              "title": "AMA PRA Category 1 CME credits (Sleep Medicine)",
              "inputType": "number",
              "isRequired": true
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-006"] = """
{
  "title": "Direct Referral Form",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "patient",
      "title": "Patient information",
      "elements": [
        {
          "type": "text",
          "name": "name",
          "title": "Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "dob",
          "title": "Date of birth",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "home_phone",
          "title": "Home phone"
        },
        {
          "type": "text",
          "name": "cell_phone",
          "title": "Cell phone"
        },
        {
          "type": "text",
          "name": "work_phone",
          "title": "Work phone"
        },
        {
          "type": "radiogroup",
          "name": "gender",
          "title": "Gender",
          "choices": [
            "Male",
            "Female",
            "Other"
          ]
        },
        {
          "type": "text",
          "name": "age",
          "title": "Age",
          "inputType": "number"
        },
        {
          "type": "text",
          "name": "height",
          "title": "Height"
        },
        {
          "type": "text",
          "name": "weight",
          "title": "Weight"
        },
        {
          "type": "text",
          "name": "sleep_from",
          "title": "Sleeping hours from",
          "inputType": "time"
        },
        {
          "type": "text",
          "name": "sleep_to",
          "title": "Sleeping hours to",
          "inputType": "time"
        },
        {
          "type": "checkbox",
          "name": "shift",
          "title": "Shift",
          "choices": [
            "Night",
            "Day",
            "Evening"
          ]
        },
        {
          "type": "text",
          "name": "occupation",
          "title": "Occupation"
        }
      ]
    },
    {
      "name": "physician",
      "title": "Physician information",
      "elements": [
        {
          "type": "text",
          "name": "ordering_physician",
          "title": "Ordering physician",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "ordering_phone",
          "title": "Phone"
        },
        {
          "type": "text",
          "name": "ordering_fax",
          "title": "Fax"
        },
        {
          "type": "text",
          "name": "pcp",
          "title": "Primary care physician"
        },
        {
          "type": "text",
          "name": "pcp_phone",
          "title": "PCP phone"
        },
        {
          "type": "text",
          "name": "pcp_fax",
          "title": "PCP fax"
        }
      ]
    },
    {
      "name": "history",
      "title": "History & physical",
      "elements": [
        {
          "type": "comment",
          "name": "sleep_history",
          "title": "History of sleep problem",
          "rows": 3,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "medical_conditions",
          "title": "Medical conditions",
          "rows": 2
        },
        {
          "type": "comment",
          "name": "social_family_history",
          "title": "Social history & family history",
          "rows": 2
        },
        {
          "type": "text",
          "name": "heent",
          "title": "HEENT"
        },
        {
          "type": "text",
          "name": "nasopharynx",
          "title": "Nasopharynx"
        },
        {
          "type": "text",
          "name": "oropharynx",
          "title": "Oropharynx"
        },
        {
          "type": "text",
          "name": "jaw",
          "title": "Jaw / mouth"
        },
        {
          "type": "text",
          "name": "tongue",
          "title": "Tongue"
        },
        {
          "type": "text",
          "name": "dentition",
          "title": "Dentition / mucosa"
        },
        {
          "type": "text",
          "name": "neck",
          "title": "Neck"
        },
        {
          "type": "text",
          "name": "heart_lungs",
          "title": "Heart / lungs"
        },
        {
          "type": "text",
          "name": "neuro",
          "title": "Neurologic exam"
        }
      ]
    },
    {
      "name": "study",
      "title": "Study type & diagnosis",
      "elements": [
        {
          "type": "checkbox",
          "name": "study_types",
          "title": "Study type(s)",
          "choices": [
            "PSG",
            "MSLT/MWT",
            "CPAP/BiPAP titration",
            "Seizure protocol",
            "Split-night if indicated",
            "Other"
          ],
          "isRequired": true
        },
        {
          "type": "checkbox",
          "name": "diagnosis",
          "title": "Diagnosis",
          "choices": [
            "Obstructive sleep apnea",
            "Narcolepsy",
            "Seizures",
            "PLMD/restless legs",
            "Hypersomnia",
            "ALS",
            "Sleepwalking/RBD",
            "Shift work",
            "Insomnia"
          ]
        },
        {
          "type": "checkbox",
          "name": "special_needs",
          "title": "Special needs",
          "choices": [
            "Oxygen",
            "Assistance moving",
            "Wheelchair",
            "Difficulty communicating",
            "Medications",
            "Other"
          ]
        }
      ]
    },
    {
      "name": "symptoms",
      "title": "Sleep symptoms & medical conditions",
      "elements": [
        {
          "type": "checkbox",
          "name": "sleep_symptoms",
          "title": "Sleep symptoms",
          "choices": [
            "Excessive daytime sleepiness",
            "Morning headaches",
            "Snoring",
            "Witnessed apneas",
            "Claustrophobia",
            "Frequent awakenings",
            "Shift work",
            "Cataplexy",
            "Nocturia",
            "Sleep paralysis",
            "Insomnia",
            "Sleep walking"
          ]
        },
        {
          "type": "checkbox",
          "name": "med_conditions",
          "title": "Medical conditions",
          "choices": [
            "Cardiac arrhythmias",
            "CHF",
            "ALS",
            "Stroke / weakness",
            "Seizures",
            "GERD",
            "Diabetes",
            "Asthma / COPD",
            "Chronic pain",
            "Fibromyalgia"
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Ordering physician sign-off",
      "elements": [
        {
          "type": "text",
          "name": "physician_sig",
          "title": "Ordering physician signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "approval_by",
          "title": "Approval by"
        },
        {
          "type": "text",
          "name": "approval_date",
          "title": "Approval date",
          "inputType": "date"
        },
        {
          "type": "comment",
          "name": "notes",
          "title": "Notes to ordering physician",
          "rows": 2
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-007"] = """
{
  "title": "DME Equipment Maintenance Failure Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Log details",
      "elements": [
        {
          "type": "text",
          "name": "reviewer_sig",
          "title": "Reviewer signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date of review",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "log",
      "title": "Maintenance / failure log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "entries",
          "title": "Log entries",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "entry_date",
              "title": "Date",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "equipment",
              "title": "Equipment type / #",
              "isRequired": true
            },
            {
              "type": "comment",
              "name": "problem",
              "title": "Description of problem",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "text",
              "name": "removed_date",
              "title": "Removed from service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "replaced",
              "title": "Replaced by"
            },
            {
              "type": "text",
              "name": "returned_date",
              "title": "Returned to service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "tech_initials",
              "title": "Initials of tech"
            },
            {
              "type": "text",
              "name": "notes",
              "title": "Notes / comments"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-008"] = """
{
  "title": "Fax Request Form",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "fax",
      "title": "Fax details",
      "elements": [
        {
          "type": "text",
          "name": "fax_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "to_name",
          "title": "To \u2013 Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "re",
          "title": "Re"
        },
        {
          "type": "text",
          "name": "to_fax",
          "title": "To \u2013 Fax #",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "from_name",
          "title": "From \u2013 Name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "contact",
          "title": "Contact name"
        },
        {
          "type": "text",
          "name": "from_phone",
          "title": "Phone"
        },
        {
          "type": "text",
          "name": "from_fax",
          "title": "From \u2013 Fax #"
        },
        {
          "type": "comment",
          "name": "info_requested",
          "title": "Information requested",
          "rows": 3
        }
      ]
    },
    {
      "name": "checklist",
      "title": "Information requested",
      "elements": [
        {
          "type": "checkbox",
          "name": "request_items",
          "title": "Items requested",
          "choices": [
            "Patient demographic information",
            "Ordering physician information",
            "Sleeping hours",
            "History of sleep problem",
            "Medical conditions",
            "PMH, SH, FMH, PSH",
            "Detailed physical examination",
            "Diagnosis",
            "Type of study requested",
            "Special patient needs",
            "Readable information",
            "Precertification for the study"
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-009"] = """
{
  "title": "HSAT Equipment Maintenance Failure Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Log details",
      "elements": [
        {
          "type": "text",
          "name": "reviewer_sig",
          "title": "Reviewer signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date of review",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "log",
      "title": "HSAT maintenance / failure log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "entries",
          "title": "Log entries",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "entry_date",
              "title": "Date",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "unit_no",
              "title": "HSAT unit #",
              "isRequired": true
            },
            {
              "type": "comment",
              "name": "problem",
              "title": "Description of problem",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "text",
              "name": "removed_date",
              "title": "Removed from service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "replaced",
              "title": "Replaced by"
            },
            {
              "type": "text",
              "name": "returned_date",
              "title": "Returned to service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "tech_initials",
              "title": "Initials of tech"
            },
            {
              "type": "text",
              "name": "notes",
              "title": "Notes / comments"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-010"] = """
{
  "title": "In-Lab Equipment Maintenance Failure Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Log details",
      "elements": [
        {
          "type": "text",
          "name": "reviewer_sig",
          "title": "Reviewer signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date of review",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "log",
      "title": "In-lab maintenance / failure log",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "entries",
          "title": "Log entries",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "entry_date",
              "title": "Date",
              "inputType": "date",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "equipment_type",
              "title": "Equipment type",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "serial_id",
              "title": "Serial / ID #"
            },
            {
              "type": "comment",
              "name": "problem",
              "title": "Description of problem",
              "rows": 2,
              "isRequired": true
            },
            {
              "type": "text",
              "name": "removed_date",
              "title": "Removed from service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "replaced",
              "title": "Replaced by"
            },
            {
              "type": "text",
              "name": "returned_date",
              "title": "Returned to service",
              "inputType": "date"
            },
            {
              "type": "text",
              "name": "tech_initials",
              "title": "Initials of tech"
            },
            {
              "type": "text",
              "name": "notes",
              "title": "Notes / comments"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-011"] = """
{
  "title": "Monthly Visual Inspection Log",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Log details",
      "elements": [
        {
          "type": "text",
          "name": "month_year",
          "title": "Month / Year",
          "isRequired": true
        }
      ]
    },
    {
      "name": "inspection",
      "title": "Inspection log",
      "elements": [
        {
          "type": "matrix",
          "name": "inspection",
          "title": "Room inspection (enter tech initials or N/A)",
          "rows": [
            "Room 1",
            "Room 2",
            "Room 3",
            "Room 4",
            "Room 5",
            "Room 6",
            "Control Room"
          ],
          "columns": [
            "PAP",
            "Video Monitor",
            "Oximeter",
            "O2",
            "PSG",
            "Intercom",
            "Recording System",
            "Repairs Needed",
            "Outcome"
          ]
        },
        {
          "type": "comment",
          "name": "notes",
          "title": "Additional notes",
          "rows": 2
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-012"] = """
{
  "title": "Patient Safety Risk Analysis Checklist",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Review details",
      "elements": [
        {
          "type": "dropdown",
          "name": "review_frequency",
          "title": "Review frequency",
          "choices": [
            "Quarterly",
            "Semi-annual",
            "Annual",
            "5-year review"
          ]
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Date of inspection",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "plan",
          "title": "Plan (corrective actions identified)",
          "rows": 3
        },
        {
          "type": "text",
          "name": "td_signature",
          "title": "Technical Director / Designee signature",
          "isRequired": true
        }
      ]
    },
    {
      "name": "external",
      "title": "External elements",
      "elements": [
        {
          "type": "matrix",
          "name": "external",
          "title": "External safety elements",
          "rows": [
            "Sidewalks level / no repair needed",
            "Parking lots well lit",
            "Entry signs clearly marked and lit",
            "Security system in place",
            "Entrance doors kept locked"
          ],
          "columns": [
            "Low",
            "Medium",
            "High",
            "Comments"
          ]
        }
      ]
    },
    {
      "name": "fire",
      "title": "Fire protection",
      "elements": [
        {
          "type": "matrix",
          "name": "fire",
          "title": "Fire protection elements",
          "rows": [
            "Exits unobstructed",
            "Exit doors unlockable in emergency",
            "Exits / routes marked with emergency lighting",
            "Fire and smoke detection systems tested",
            "Backup detection inspected monthly",
            "Automatic sprinkler system in place",
            "Fire extinguisher locations easily found",
            "Staff trained on extinguishers",
            "Flammable materials stored securely",
            "Fire inspection by local fire department conducted"
          ],
          "columns": [
            "Low",
            "Medium",
            "High",
            "Comments"
          ]
        }
      ]
    },
    {
      "name": "general",
      "title": "General maintenance / safety",
      "elements": [
        {
          "type": "matrix",
          "name": "general",
          "title": "General maintenance and safety elements",
          "rows": [
            "Sleep rooms / offices clean to prevent injury / falls",
            "Floors and stairs clean / dry / not slippery",
            "Equipment cleaning areas separate from dirty equipment and food handling",
            "Storage areas free from pest hazards",
            "Facility free from infestations",
            "Floors free from loose boards / rugs / holes / cords",
            "Personal items of patients maintained to prevent theft",
            "Cellular phones available and in working order",
            "Extension cords out of aisles and secured",
            "Shower / bathroom floors well maintained / non-slippery",
            "Adequate clearance in halls and aisles",
            "Cameras in place for video monitoring",
            "Electrical outlets covered when not in use (paediatric)",
            "Uneven surfaces easily identifiable"
          ],
          "columns": [
            "Low",
            "Medium",
            "High",
            "Comments"
          ]
        }
      ]
    },
    {
      "name": "infection",
      "title": "Infection control",
      "elements": [
        {
          "type": "matrix",
          "name": "infection",
          "title": "Infection control elements",
          "rows": [
            "Hazardous materials in locked / labelled cabinet",
            "SDS maintained for easy access",
            "Hazardous materials stored below eye level",
            "Oxygen equipment stored properly",
            "Biohazard waste containers in locked area",
            "PPE accessible (masks, gloves, gowns, handwashing)",
            "Equipment cleaned per manufacturer recommendations"
          ],
          "columns": [
            "Low",
            "Medium",
            "High",
            "Comments"
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-013"] = """
{
  "title": "QA Sample Report",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "header",
      "title": "Report details",
      "elements": [
        {
          "type": "text",
          "name": "facility",
          "title": "Facility name",
          "isRequired": true
        },
        {
          "type": "radiogroup",
          "name": "quarter",
          "title": "Quarter",
          "choices": [
            "1st",
            "2nd",
            "3rd",
            "4th"
          ],
          "isRequired": true
        },
        {
          "type": "text",
          "name": "year",
          "title": "Year",
          "inputType": "number",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "network_director",
          "title": "Reviewed / approved by \u2013 Network Director",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "report_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    },
    {
      "name": "process",
      "title": "Process & outcome measures",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "measures",
          "title": "Quality indicators",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "text",
              "name": "indicator_name",
              "title": "Quality indicator",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "threshold",
              "title": "Minimum threshold (%)",
              "inputType": "number",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "goal",
              "title": "Final goal (%)",
              "inputType": "number",
              "isRequired": true
            },
            {
              "type": "text",
              "name": "results",
              "title": "Results / outcome",
              "isRequired": true
            },
            {
              "type": "comment",
              "name": "action_plan",
              "title": "Action plan (if goal not met)",
              "rows": 2
            }
          ]
        }
      ]
    },
    {
      "name": "inter_scorer",
      "title": "Inter-scorer reliability",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "inter_scorer",
          "title": "Inter-scorer reliability",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "category",
              "title": "Category",
              "choices": [
                "Staging",
                "Respiratory events",
                "Leg movements",
                "Arousals"
              ]
            },
            {
              "type": "text",
              "name": "scorer1_pct",
              "title": "Scorer 1 (%)",
              "inputType": "number"
            },
            {
              "type": "text",
              "name": "scorer2_pct",
              "title": "Scorer 2 (%)",
              "inputType": "number"
            },
            {
              "type": "comment",
              "name": "notes",
              "title": "Notes",
              "rows": 1
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-014"] = """
{
  "title": "Significant Adverse Event Form",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "event",
      "title": "Event details",
      "elements": [
        {
          "type": "text",
          "name": "report_date",
          "title": "Date of report",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "event_date",
          "title": "Date of event",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "event_time",
          "title": "Time of event",
          "inputType": "time"
        },
        {
          "type": "text",
          "name": "patient_id",
          "title": "Patient ID number",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "study_type",
          "title": "Study or test type conducted",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "employees",
          "title": "Employee(s) involved",
          "isRequired": true
        }
      ]
    },
    {
      "name": "narrative",
      "title": "Narrative",
      "elements": [
        {
          "type": "comment",
          "name": "narrative",
          "title": "Narrative description (what / where / how)",
          "rows": 5,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "contributing_factors",
          "title": "Contributing factors (why it happened)",
          "rows": 4
        },
        {
          "type": "comment",
          "name": "immediate_actions",
          "title": "Assessment / immediate actions taken",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "comment",
          "name": "root_cause",
          "title": "Root cause analysis \u2013 initial findings",
          "rows": 4
        }
      ]
    },
    {
      "name": "signatures",
      "title": "Signatures & corrective action",
      "elements": [
        {
          "type": "text",
          "name": "completing_individual",
          "title": "Completing individual signature",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "investigating_manager",
          "title": "Investigating individual / manager signature"
        },
        {
          "type": "text",
          "name": "inv_date",
          "title": "Date",
          "inputType": "date"
        },
        {
          "type": "comment",
          "name": "corrective_plan",
          "title": "Corrective plan of action / recommendation",
          "rows": 4,
          "isRequired": true
        },
        {
          "type": "text",
          "name": "mgmt_signature",
          "title": "Management signature"
        },
        {
          "type": "text",
          "name": "mgmt_date",
          "title": "Management date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "site_director",
          "title": "Site Director signature"
        },
        {
          "type": "text",
          "name": "site_date",
          "title": "Site Director date",
          "inputType": "date"
        },
        {
          "type": "text",
          "name": "network_director",
          "title": "Network Director signature"
        },
        {
          "type": "text",
          "name": "network_date",
          "title": "Network Director date",
          "inputType": "date"
        }
      ]
    },
    {
      "name": "sign",
      "title": "Prepared by",
      "elements": [
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
            ["FRM-AASM-015"] = """
{
  "title": "Sub-contract Review Sheet",
  "showQuestionNumbers": "off",
  "widthMode": "responsive",
  "completeText": "Submit",
  "pages": [
    {
      "name": "review",
      "title": "Sub-contract compliance review",
      "elements": [
        {
          "type": "paneldynamic",
          "name": "items",
          "title": "Review items",
          "addPanelText": "Add row",
          "minPanelCount": 1,
          "templateElements": [
            {
              "type": "dropdown",
              "name": "content_item",
              "title": "Content item",
              "choices": [
                "Description of services provided (incl. equipment, AASM Scoring Manual, technical responsibilities, on-call support, emergency response, maintenance, scoring)",
                "Expectation of subcontractor responsibilities",
                "Expectation of sleep service responsibilities",
                "Patient is full responsibility of the clinic",
                "Staff qualifications \u2013 registration and/or licensure requirements",
                "Description of appropriate technical staff training",
                "Adherence to all applicable AASM HSAT standards, policies, procedures",
                "Assessment of subcontractor performance on annual basis",
                "Medical record maintenance by subcontractor with access for review / audit",
                "Provision for compliance with applicable HIPAA policies"
              ],
              "isRequired": true
            },
            {
              "type": "radiogroup",
              "name": "compliant",
              "title": "Compliant",
              "choices": [
                "Yes",
                "No",
                "N/A"
              ],
              "isRequired": true
            },
            {
              "type": "text",
              "name": "standard_ref",
              "title": "Applicable standard / comments"
            }
          ]
        }
      ]
    },
    {
      "name": "sign",
      "title": "Sign-off",
      "elements": [
        {
          "type": "text",
          "name": "subcontractor",
          "title": "Subcontractor name",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "contract_ref",
          "title": "Contract reference"
        },
        {
          "type": "text",
          "name": "review_date",
          "title": "Review date",
          "inputType": "date",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "reviewed_by",
          "title": "Reviewed by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "prepared_by",
          "title": "Prepared by",
          "isRequired": true
        },
        {
          "type": "text",
          "name": "sign_date",
          "title": "Date",
          "inputType": "date",
          "isRequired": true
        }
      ]
    }
  ]
}
""",
        };

        bool changed = false;
        foreach (var (docId, json) in forms)
        {
            var doc = db.Documents.FirstOrDefault(d => d.DocId == docId);
            if (doc != null && string.IsNullOrEmpty(doc.SurveyJson))
            {
                doc.SurveyJson = json;
                changed = true;
            }
        }
        if (changed) db.SaveChanges();
    }

        private record StandardConfig(
        string Id, string Name, string Version, string Jurisdiction,
        List<StandardSection> Sections, List<StandardClause> Clauses);
    private record StandardSection(string Id, string Title);
    private record StandardClause(string ClauseId, string Title, string Section, string? Category);
}
