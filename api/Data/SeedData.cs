using NexusApi.Models;

namespace NexusApi.Data;

public static class SeedData
{
    public static void Seed(NexusDbContext db)
    {
        if (db.Studies.Any()) return;

        db.Studies.AddRange(
            new Study { StudyId = "PSG-2026-0441", Patient = "Anon · DOB 1974", PatientInitials = "R.K.", Type = "Adult attended PSG", SiteCode = "RML", Scorer = "M. Chen", Physician = "Dr. R. Okafor", Status = "Awaiting sign-off", Contact = "02 May", Due = 1, Sla = "warn" },
            new Study { StudyId = "PSG-2026-0440", Patient = "Anon · DOB 1989", PatientInitials = "T.N.", Type = "Adult attended PSG", SiteCode = "RML", Scorer = "A. Singh", Physician = "Dr. R. Okafor", Status = "Awaiting sign-off", Contact = "01 May", Due = 0, Sla = "bad" },
            new Study { StudyId = "PSG-2026-0439", Patient = "Anon · DOB 2012", PatientInitials = "L.W.", Type = "Paediatric attended PSG", SiteCode = "EPL", Scorer = "M. Chen", Physician = "Dr. L. Hartono", Status = "Scoring", Contact = "30 Apr", Due = 3, Sla = "good" },
            new Study { StudyId = "HSAT-2026-0218", Patient = "Anon · DOB 1968", PatientInitials = "P.B.", Type = "Type 3 HSAT", SiteCode = "HSN", Scorer = "J. Owusu", Physician = "Dr. F. Liu", Status = "Scoring", Contact = "29 Apr", Due = 4, Sla = "good" },
            new Study { StudyId = "PSG-2026-0438", Patient = "Anon · DOB 1955", PatientInitials = "D.M.", Type = "Split-night PSG/CPAP", SiteCode = "RML", Scorer = "A. Singh", Physician = "Dr. R. Okafor", Status = "Preliminary", Contact = "28 Apr", Due = 5, Sla = "good" },
            new Study { StudyId = "MSLT-2026-0031", Patient = "Anon · DOB 1998", PatientInitials = "S.C.", Type = "MSLT", SiteCode = "RML", Scorer = "M. Chen", Physician = "Dr. R. Okafor", Status = "Awaiting sign-off", Contact = "27 Apr", Due = 2, Sla = "warn" },
            new Study { StudyId = "PSG-2026-0437", Patient = "Anon · DOB 1971", PatientInitials = "A.P.", Type = "Adult attended PSG", SiteCode = "EPL", Scorer = "J. Owusu", Physician = "Dr. F. Liu", Status = "Final", Contact = "22 Apr", Due = 0, Sla = "good", SignedDays = 7 },
            new Study { StudyId = "HSAT-2026-0217", Patient = "Anon · DOB 1983", PatientInitials = "M.T.", Type = "Type 2 HSAT", SiteCode = "HSN", Scorer = "A. Singh", Physician = "Dr. F. Liu", Status = "Final", Contact = "20 Apr", Due = 0, Sla = "good", SignedDays = 9 }
        );

        db.Equipment.AddRange(
            new Equipment { AssetId = "PSG-COMP-001", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier", Site = "Riverside Main", Serial = "GRL-4421-A", Artg = "394821", LastVerify = "01 Mar 2026", NextVerify = "01 Jun 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "PSG-COMP-002", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier", Site = "Riverside Main", Serial = "GRL-4421-B", Artg = "394821", LastVerify = "12 Mar 2026", NextVerify = "12 Jun 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "PSG-COMP-003", Name = "Compumedics Grael PSG Amplifier", Type = "PSG Amplifier", Site = "Eastside Paed.", Serial = "GRL-5103-A", Artg = "394821", LastVerify = "20 Feb 2026", NextVerify = "20 May 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "OXI-NON-007", Name = "Nonin WristOx2 3150", Type = "Oximeter", Site = "Home Service N.", Serial = "NWO-88231", Artg = "271044", LastVerify = "14 Apr 2026", NextVerify = "14 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "HSAT-NOX-012", Name = "Nox T3 Sleep Monitor", Type = "HSAT Device", Site = "Home Service N.", Serial = "T3-19204", Artg = "212388", LastVerify = "10 Apr 2026", NextVerify = "10 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "HSAT-NOX-013", Name = "Nox T3 Sleep Monitor", Type = "HSAT Device", Site = "Home Service N.", Serial = "T3-19205", Artg = "212388", LastVerify = "10 Apr 2026", NextVerify = "10 Jul 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "HSAT-NOX-014", Name = "Nox T3 Sleep Monitor", Type = "HSAT Device", Site = "Home Service N.", Serial = "T3-19381", Artg = "212388", LastVerify = "02 Jan 2026", NextVerify = "Overdue 14d", VerifyStatus = "bad" },
            new Equipment { AssetId = "CAL-MKS-001", Name = "MKS Instruments Cal Gas", Type = "Calibration Gas", Site = "Riverside Main", Serial = "CAL-20240211", Artg = "—", LastVerify = "11 Feb 2026", NextVerify = "11 Aug 2026", VerifyStatus = "good" },
            new Equipment { AssetId = "PSG-EMB-001", Name = "Embla N7000 Amplifier", Type = "PSG Amplifier", Site = "Eastside Paed.", Serial = "EMB-N7-3301", Artg = "263711", LastVerify = "28 Feb 2026", NextVerify = "28 May 2026", VerifyStatus = "warn" },
            new Equipment { AssetId = "CPAP-RES-004", Name = "ResMed AirSense 11 AutoSet", Type = "CPAP Titration Device", Site = "Riverside Main", Serial = "AS11-4400221", Artg = "341022", LastVerify = "05 Apr 2026", NextVerify = "05 Jul 2026", VerifyStatus = "good" }
        );

        db.Indicators.AddRange(
            new Indicator { IndicatorId = "KPI-01", Name = "Referral-to-study wait", Phase = "pre", Value = "8.4", Unit = "days", Target = "≤ 14d", Status = "good", Trend = "[12,11,10,10,9,9,9,8,8,8,8,8]" },
            new Indicator { IndicatorId = "KPI-02", Name = "Incomplete referrals", Phase = "pre", Value = "3.2", Unit = "%", Target = "≤ 5%", Status = "good", Trend = "[8,7,6,5,5,4,4,3,4,3,3,3]" },
            new Indicator { IndicatorId = "KPI-03", Name = "Pre-study cancellation rate", Phase = "pre", Value = "6.1", Unit = "%", Target = "≤ 8%", Status = "good", Trend = "[9,8,7,7,6,7,6,5,6,6,6,6]" },
            new Indicator { IndicatorId = "KPI-04", Name = "Study technical failure rate", Phase = "study", Value = "1.8", Unit = "%", Target = "≤ 2%", Status = "good", Trend = "[3,3,2,3,2,2,2,2,2,1,2,2]" },
            new Indicator { IndicatorId = "KPI-05", Name = "EEG impedance compliance", Phase = "study", Value = "97.3", Unit = "%", Target = "≥ 95%", Status = "good", Trend = "[91,93,94,95,95,96,96,97,97,97,97,97]" },
            new Indicator { IndicatorId = "KPI-06", Name = "Inter-scorer κ (mean)", Phase = "study", Value = "0.82", Unit = "", Target = "≥ 0.75", Status = "good", Trend = "[0.74,0.76,0.77,0.78,0.79,0.80,0.80,0.81,0.82,0.82,0.82,0.82]" },
            new Indicator { IndicatorId = "KPI-07", Name = "Report turnaround (10d SLA)", Phase = "post", Value = "97.9", Unit = "%", Target = "≥ 98%", Status = "warn", Trend = "[98,98,99,97,98,98,99,98,97,98,98,98]" },
            new Indicator { IndicatorId = "KPI-08", Name = "Amended reports rate", Phase = "post", Value = "1.4", Unit = "%", Target = "≤ 2%", Status = "good", Trend = "[3,2,2,2,2,2,1,1,2,1,1,1]" },
            new Indicator { IndicatorId = "KPI-09", Name = "Referrer satisfaction score", Phase = "post", Value = "4.6", Unit = "/ 5", Target = "≥ 4.5", Status = "good", Trend = "[4.1,4.2,4.3,4.3,4.4,4.4,4.5,4.5,4.6,4.6,4.6,4.6]" },
            new Indicator { IndicatorId = "KPI-10", Name = "Equipment verification on time", Phase = "study", Value = "96.8", Unit = "%", Target = "≥ 95%", Status = "good", Trend = "[92,93,94,95,95,96,96,97,97,97,97,97]" },
            new Indicator { IndicatorId = "KPI-11", Name = "EQA pass rate", Phase = "study", Value = "90.0", Unit = "%", Target = "≥ 90%", Status = "warn", Trend = "[95,95,100,90,95,95,90,95,95,90,90,90]" },
            new Indicator { IndicatorId = "KPI-12", Name = "CAPA effectiveness", Phase = "post", Value = "94.0", Unit = "%", Target = "≥ 90%", Status = "good", Trend = "[85,87,88,89,90,91,92,93,93,94,94,94]" }
        );

        db.Clauses.AddRange(
            new Clause { ClauseId = "4.1.1", Title = "Scope of accreditation", Section = "4.1", Status = "compliant", Evidence = 3, LastReviewed = "Jan 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "4.1.5", Title = "Conflict of interest", Section = "4.1", Status = "compliant", Evidence = 2, LastReviewed = "Jan 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.1.6", Title = "Confidentiality", Section = "4.1", Status = "compliant", Evidence = 4, LastReviewed = "Nov 2025", Owner = "K. Patel" },
            new Clause { ClauseId = "4.2.1", Title = "Quality policy", Section = "4.2", Status = "compliant", Evidence = 2, LastReviewed = "Jan 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "4.3.1", Title = "Document control", Section = "4.3", Status = "compliant", Evidence = 5, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.5.2", Title = "Subcontractor register", Section = "4.5", Status = "nonconformant", Evidence = 0, LastReviewed = "Mar 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.8.1", Title = "Complaint handling", Section = "4.8", Status = "compliant", Evidence = 3, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.13.1", Title = "Record retention", Section = "4.13", Status = "compliant", Evidence = 4, LastReviewed = "Nov 2025", Owner = "K. Patel" },
            new Clause { ClauseId = "4.14.3", Title = "Auditor independence", Section = "4.14", Status = "compliant", Evidence = 4, LastReviewed = "Feb 2026", Owner = "K. Patel" },
            new Clause { ClauseId = "4.15.2", Title = "Management review inputs", Section = "4.15", Status = "compliant", Evidence = 6, LastReviewed = "Feb 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.1.4", Title = "BLS recertification", Section = "5.1", Status = "nonconformant", Evidence = 1, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.2", Title = "Equipment acceptance testing", Section = "5.3", Status = "compliant", Evidence = 5, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.4", Title = "Equipment verification programme", Section = "5.3", Status = "nonconformant", Evidence = 2, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.5", Title = "Equipment decontamination", Section = "5.3", Status = "review", Evidence = 2, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.3.6", Title = "Adverse incident reporting", Section = "5.3", Status = "compliant", Evidence = 3, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.5.2", Title = "Pre-study bio-signal verification", Section = "5.5", Status = "compliant", Evidence = 6, LastReviewed = "Apr 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.5.3", Title = "PSG recording protocols", Section = "5.5", Status = "compliant", Evidence = 7, LastReviewed = "Mar 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.6.6", Title = "Inter-observer concordance", Section = "5.6", Status = "compliant", Evidence = 4, LastReviewed = "Mar 2026", Owner = "M. Chen" },
            new Clause { ClauseId = "5.6.8", Title = "External proficiency testing (EQA)", Section = "5.6", Status = "review", Evidence = 3, LastReviewed = "Mar 2026", Owner = "Dr. R. Okafor" },
            new Clause { ClauseId = "5.8.1", Title = "10 business-day reporting SLA", Section = "5.8", Status = "compliant", Evidence = 5, LastReviewed = "Apr 2026", Owner = "Dr. R. Okafor" }
        );

        db.ComplianceSections.AddRange(
            new ComplianceSection { Section = "4.1", Title = "Organisation & management", Total = 8, Ok = 8, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.2", Title = "Quality management system", Total = 5, Ok = 5, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.3", Title = "Document control", Total = 6, Ok = 5, Nc = 1, Na = 0, Status = "review" },
            new ComplianceSection { Section = "4.4", Title = "Service agreements", Total = 4, Ok = 4, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.5", Title = "Subcontracting", Total = 3, Ok = 2, Nc = 1, Na = 0, Status = "nonconformant" },
            new ComplianceSection { Section = "4.6", Title = "External services & supplies", Total = 4, Ok = 4, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.7", Title = "Advisory services", Total = 2, Ok = 2, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.8", Title = "Complaint resolution", Total = 4, Ok = 4, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.9", Title = "Nonconformance control", Total = 5, Ok = 5, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.10", Title = "Corrective action", Total = 4, Ok = 4, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.11", Title = "Preventive action", Total = 3, Ok = 3, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.12", Title = "Continual improvement", Total = 3, Ok = 3, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.13", Title = "Records & audit trail", Total = 6, Ok = 6, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.14", Title = "Internal audits", Total = 5, Ok = 5, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "4.15", Title = "Management review", Total = 5, Ok = 5, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "5.1", Title = "Staff & training", Total = 10, Ok = 8, Nc = 2, Na = 0, Status = "nonconformant" },
            new ComplianceSection { Section = "5.2", Title = "Accommodation & facilities", Total = 6, Ok = 6, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "5.3", Title = "Equipment management", Total = 12, Ok = 9, Nc = 2, Na = 1, Status = "nonconformant" },
            new ComplianceSection { Section = "5.4", Title = "Pre-analytical processes", Total = 5, Ok = 5, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "5.5", Title = "Study & recording processes", Total = 14, Ok = 13, Nc = 1, Na = 0, Status = "review" },
            new ComplianceSection { Section = "5.6", Title = "Analytical quality assurance", Total = 9, Ok = 7, Nc = 1, Na = 1, Status = "review" },
            new ComplianceSection { Section = "5.7", Title = "Post-analytical processes", Total = 6, Ok = 6, Nc = 0, Na = 0, Status = "compliant" },
            new ComplianceSection { Section = "5.8", Title = "Reporting & result release", Total = 10, Ok = 10, Nc = 0, Na = 0, Status = "compliant" }
        );

        db.Tasks.AddRange(
            new NexusTask { TaskId = "T-001", Title = "Verify HSAT-NOX-014 — recall check", Clause = "5.3.4", Due = "today", Priority = "critical" },
            new NexusTask { TaskId = "T-002", Title = "Complete subcontractor register (SIS Labs)", Clause = "4.5.2", Due = "in 3 days", Priority = "high" },
            new NexusTask { TaskId = "T-003", Title = "Book BLS recert for 4 lapsed staff", Clause = "5.1.4", Due = "in 7 days", Priority = "high" },
            new NexusTask { TaskId = "T-004", Title = "Sign off PSG-2026-0440 (SLA due today)", Clause = "5.8.1", Due = "today", Priority = "high" },
            new NexusTask { TaskId = "T-005", Title = "Review SOP-EQP-012 (overdue 8d)", Clause = "4.3.1", Due = "overdue", Priority = "high" },
            new NexusTask { TaskId = "T-006", Title = "Assemble Q2 management review pack", Clause = "4.15.2", Due = "in 1 day", Priority = "medium" }
        );

        db.Activity.AddRange(
            new ActivityEntry { Who = "K. Patel", Action = "updated self-assessment", Target = "cl. 5.3.5 to 'review'", Time = "2 min ago", Kind = "edit" },
            new ActivityEntry { Who = "M. Chen", Action = "linked evidence to", Target = "cl. 5.3.4", Time = "18 min ago", Kind = "link" },
            new ActivityEntry { Who = "Dr. R. Okafor", Action = "signed final report", Target = "PSG-2026-0437", Time = "1 h ago", Kind = "sign" },
            new ActivityEntry { Who = "System", Action = "raised NC", Target = "HSAT-NOX-014 verification overdue", Time = "2 h ago", Kind = "alert" },
            new ActivityEntry { Who = "A. Singh", Action = "submitted scoring for", Target = "PSG-2026-0438", Time = "3 h ago", Kind = "submit" },
            new ActivityEntry { Who = "K. Patel", Action = "uploaded audit report", Target = "AUD-2026-Q1 findings", Time = "yesterday", Kind = "upload" }
        );

        db.SaveChanges();
    }
}
