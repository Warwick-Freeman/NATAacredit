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
}

public class NexusTask
{
    public int Id { get; set; }
    public string TaskId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Clause { get; set; } = "";
    public string Due { get; set; } = "";
    public string Priority { get; set; } = "";
}

public class ActivityEntry
{
    public int Id { get; set; }
    public string Who { get; set; } = "";
    public string Action { get; set; } = "";
    public string Target { get; set; } = "";
    public string Time { get; set; } = "";
    public string Kind { get; set; } = "";
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
}
