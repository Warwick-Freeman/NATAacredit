using System.ComponentModel.DataAnnotations.Schema;

namespace NexusApi.Models;

public class Study
{
    public int Id { get; set; }
    public string StudyId { get; set; } = "";
    public string Patient { get; set; } = "";
    public string PatientInitials { get; set; } = "";
    public string Type { get; set; } = "";
    public string SiteCode { get; set; } = "";
    public string Scorer { get; set; } = "";
    public string Physician { get; set; } = "";
    public string Status { get; set; } = "";
    public string Contact { get; set; } = "";
    public int Due { get; set; }
    public string Sla { get; set; } = "";
    public int? SignedDays { get; set; }
}

public class Equipment
{
    public int Id { get; set; }
    public string AssetId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Site { get; set; } = "";
    public string Serial { get; set; } = "";
    public string Artg { get; set; } = "";
    public string LastVerify { get; set; } = "";
    public string NextVerify { get; set; } = "";
    public string VerifyStatus { get; set; } = "";
}

public class Indicator
{
    public int Id { get; set; }
    public string IndicatorId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Phase { get; set; } = "";
    public string Value { get; set; } = "";
    public string Unit { get; set; } = "";
    public string Target { get; set; } = "";
    public string Status { get; set; } = "";
    public string Trend { get; set; } = "[]";
}

public class Clause
{
    public int Id { get; set; }
    public string ClauseId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Section { get; set; } = "";
    public string Status { get; set; } = "";
    public int Evidence { get; set; }
    public string LastReviewed { get; set; } = "";
    public string Owner { get; set; } = "";
    public string Standard { get; set; } = "asa";
    public string? Category { get; set; }
}

public class ComplianceSection
{
    public int Id { get; set; }
    public string Section { get; set; } = "";
    public string Title { get; set; } = "";
    public int Total { get; set; }
    public int Ok { get; set; }
    public int Nc { get; set; }
    public int Na { get; set; }
    public string Status { get; set; } = "";
    public string Standard { get; set; } = "asa";
}

public class IsrAssessment
{
    public int Id { get; set; }
    public string AssessmentRef { get; set; } = "";   // e.g. ISR-2026-Q2-001
    public string Quarter { get; set; } = "";         // e.g. Q2 2026
    public string Scorer { get; set; } = "";
    public string Reviewer { get; set; } = "";
    public string ReviewerRole { get; set; } = "";    // "Network Director" | "Medical Staff"
    public string AttestationBy { get; set; } = "";   // ND name when reviewer is medical staff
    public string AttestationDate { get; set; } = "";
    public string StudyIds { get; set; } = "[]";      // JSON: array of 3 PSG study IDs
    public string Results { get; set; } = "{{}}";     // JSON: concordance per parameter
    public string Thresholds { get; set; } = "{{}}";  // JSON: lab-defined minimum per parameter
    public string ProdigiSessionData { get; set; } = "{{}}"; // JSON: Prodigi API response data
    public string Status { get; set; } = "pending";   // pending | in-progress | complete | signed
    public string SignedBy { get; set; } = "";
    public string SignedAt { get; set; } = "";
    public string Notes { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public class FormRecord
{
    public int Id { get; set; }
    public string FormId { get; set; } = "";
    public string RecordRef { get; set; } = "";
    public string FormTitle { get; set; } = "";
    public string CompletedBy { get; set; } = "";
    public string CompletedAt { get; set; } = "";
    public string Period { get; set; } = "";
    public string Notes { get; set; } = "";
    public string FormData { get; set; } = "{{}}";
    public string SnapshotHtml { get; set; } = "";
}

public class WorkbookCompletion
{
    public int Id { get; set; }
    public string WorkbookId { get; set; } = "";
    public string Period { get; set; } = "";
    public string StartedAt { get; set; } = "";
    public string CompletedAt { get; set; } = "";
    public string CompletedBy { get; set; } = "";
    public string FormData { get; set; } = "{}";
    public string Status { get; set; } = "in-progress";
}

public class WorkbookSchedule
{
    public int Id { get; set; }
    public string WorkbookId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Condition { get; set; } = "";
    public string FileName { get; set; } = "";
    public string Frequency { get; set; } = "quarterly";
    public string LastCompleted { get; set; } = "";
    public string NextDue { get; set; } = "";
    public string AssignedTo { get; set; } = "";
    public string Notes { get; set; } = "";
}

public class SiteConfig
{
    [System.ComponentModel.DataAnnotations.Key]
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}

public class NexusTask
{
    public int Id { get; set; }
    public string TaskId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Clause { get; set; } = "";
    public string Due { get; set; } = "";
    public string Priority { get; set; } = "";
    public string AssignedTo { get; set; } = "";
}

public class ActivityEntry
{
    public int Id { get; set; }
    public string Who { get; set; } = "";
    public string Action { get; set; } = "";
    public string Target { get; set; } = "";
    public string Time { get; set; } = "";
    public string Kind { get; set; } = "";
    public string Ts { get; set; } = "";
    public string Module { get; set; } = "";
    public string Detail { get; set; } = "";
}

[Table("Users")]
public class AppUser
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
    public bool Mfa { get; set; }
    public string Auth { get; set; } = "Local";
    public string LastSeen { get; set; } = "—";
    // JSON array of full site names. Empty array = unrestricted (sees all sites).
    public string Sites { get; set; } = "[]";
}

public class Appointment
{
    public int Id { get; set; }
    public string SiteId { get; set; } = "";
    public string Type { get; set; } = "psg"; // psg | titration | hsat | consult
    public string PatientName { get; set; } = "";
    public string PatientId { get; set; } = "";
    public string Start { get; set; } = "";   // ISO "2026-05-17T21:00"
    public string End { get; set; } = "";     // ISO "2026-05-18T07:00"
    public string RoomId { get; set; } = "";
    public string EquipmentId { get; set; } = "";
    public string Physician { get; set; } = "";
    public string Technician { get; set; } = "";
    public string Notes { get; set; } = "";
    public string Status { get; set; } = "scheduled"; // scheduled | confirmed | completed | cancelled
    public string CreatedBy { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public class SiteRoom
{
    public int Id { get; set; }
    public string SiteId { get; set; } = "";
    public string RoomId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Type { get; set; } = "general"; // psg | titration | consult | general
    public int SortOrder { get; set; } = 0;
}

public class Document
{
    public int Id { get; set; }
    public string DocId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Version { get; set; } = "1.0";
    public string Status { get; set; } = "Draft";
    public string Folder { get; set; } = "sops";
    public string Owner { get; set; } = "";
    public string Clauses { get; set; } = "";
    public string ReviewDue { get; set; } = "—";
    public string Updated { get; set; } = "";
    public string? FileType { get; set; }
    public string? FileName { get; set; }
    public string? StoredFileName { get; set; }
    public string Workflow { get; set; } = "[]";
    public string ContentText { get; set; } = "";
    public string? RevisionOf { get; set; }
}
