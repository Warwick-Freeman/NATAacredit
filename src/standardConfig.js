const CONFIGS = {
  asa: {
    bodyName:        'NATA',
    standardName:    'ASA Standard for Sleep Disorders Services',
    standardVersion: 'March 2019',
    standardShort:   'ASA Standard',
    certLabel:       'NATA cert no.',
    assessmentLabel: 'NATA assessment',
    reportBrand:     'Nexus 360 · NATA Accreditation',
    reportTitle:     'NATA Evidence Pack',
    publisher:       'Published by NATA · © National Association of Testing Authorities, Australia · Internal use only',
    drawerAttrib:    'Reproduced for internal reference from the ASA Standard for Sleep Disorders Services (NATA / RCPA / AASM–ANZ · March 2019 edition). Not for redistribution.',
    implNote:        'Refer to the current edition of the ASA Standard for detailed implementation guidance, normative references, and informative notes. Assessors will request evidence of documented procedures and records demonstrating compliance.',
    defaultReqText:  'Reference clause text from ASA Standard for Sleep Disorders Services (March 2019). Click "Open in standard" to read the full normative text and notes.',
  },
  aasm: {
    bodyName:        'AASM',
    standardName:    'AASM Standards for Accreditation',
    standardVersion: 'June 2026',
    standardShort:   'AASM Standards',
    certLabel:       'Accreditation no.',
    assessmentLabel: 'AASM assessment',
    reportBrand:     'Nexus 360 · AASM Accreditation',
    reportTitle:     'AASM Evidence Pack',
    publisher:       'Published by AASM · © American Academy of Sleep Medicine · Internal use only',
    drawerAttrib:    'Reproduced for internal reference from the AASM Standards for Accreditation (June 2026 edition). Not for redistribution.',
    implNote:        'Refer to the current AASM Standards for Accreditation for detailed requirements. Assessors will request evidence of documented policies, procedures, and records demonstrating compliance with each standard.',
    defaultReqText:  'Reference text from AASM Standards for Accreditation (June 2026). Click "Open in standard" to read the full normative text.',
  },
};

export function getStdCfg(standard) {
  return CONFIGS[standard] ?? CONFIGS.asa;
}
