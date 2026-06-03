// workbookSchemas.js
// Workbook definitions for interactive quality measure reporting forms.
// Each workbook maps to a WorkbookSchedule.WorkbookId in the backend.

export const WORKBOOK_SCHEMAS = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Adult OSA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'adult-osa',
    title: 'Adult OSA Measure Reporting',
    condition: 'Adult OSA',
    intro: {
      instructions:
        'Please pull charts from the previous reporting year for patients with a diagnosis of ' +
        'obstructive sleep apnea (OSA). For each measure below, review your patient population and ' +
        'document the number of patients in the denominator, any exceptions, and the number who meet ' +
        'the numerator criteria. Enter your totals in the fields provided. If a measure does not apply ' +
        'to your practice, select "Not Applicable" and provide a brief reason. All fields marked with ' +
        'an asterisk (*) are required before submission.',
      fields: [
        {
          id: 'experience',
          label: 'Have you ever reported Adult OSA quality measures? If yes, which measures?',
          type: 'textarea',
        },
        {
          id: 'clinicalSetting',
          label: 'Please describe your clinical setting (academic, small/large health system, clinic, etc.)',
          type: 'textarea',
        },
      ],
    },
    measures: [
      {
        id: 'pm1',
        type: 'Process',
        number: '1',
        title:
          'Proportion of patients aged 18 years and older with a diagnosis of obstructive sleep apnea (OSA) that have documentation of assessment of OSA symptoms and/or the use of a validated instrument at the initial evaluation',
        denominator:
          'All patients aged 18 years and older with a diagnosis of obstructive sleep apnea (ICD-10: G47.33) seen for an initial evaluation during the reporting period. Applicable encounter codes: 99202–99205, 99211–99215, 99241–99245; telehealth equivalents are included.',
        exceptions:
          'Patient declines to respond or is unable to respond to OSA symptom assessment. Patient was previously evaluated and diagnosed by another provider and presents only for ongoing management.',
        numerator:
          'Documentation of assessment of OSA symptoms and/or the use of a validated instrument at the initial evaluation, including but not limited to snoring, witnessed apneas, daytime sleepiness, fatigue, or nocturia.',
      },
      {
        id: 'pm2',
        type: 'Process',
        number: '2',
        title:
          'Proportion of patients aged 18 years and older with a new diagnosis of OSA who have AHI, RDI, or REI documented within 2 months after initial evaluation',
        denominator:
          'All patients aged 18 years and older with an initial diagnosis of OSA (ICD-10: G47.30, G47.33) seen during the reporting period. Applicable encounter codes: 99202–99205, 99211–99215, 99241–99245.',
        exceptions:
          'Medical, neurological, or psychiatric disease that prohibits performance of a sleep study. Performing a sleep study would pose a greater risk to the patient than the benefit obtained. Patient was previously diagnosed by another provider. Patient declines testing. Test was ordered but not completed. Insurance or financial reasons preclude testing.',
        numerator:
          'AHI (apnea-hypopnea index), RDI (respiratory disturbance index), or REI (respiratory event index) documented in the medical record within 2 months after the date of the initial evaluation.',
      },
      {
        id: 'pm3',
        type: 'Process',
        number: '3',
        title:
          'Proportion of patients aged 18 years and older with a new diagnosis of moderate-to-severe or symptomatic mild OSA who were prescribed evidence-based therapy after initial diagnosis',
        denominator:
          'All patients aged 18 years and older with a new diagnosis of moderate-to-severe OSA or symptomatic mild OSA (ICD-10: G47.33) during the reporting period.',
        exceptions:
          'Patient declines treatment. Patient does not return for follow-up after diagnosis. Insurance does not cover prescribed therapy.',
        numerator:
          'Patient was prescribed at least one evidence-based treatment modality after initial diagnosis, including: positive airway pressure (PAP) therapy, oral appliance therapy, positional therapy, upper airway surgery, or hypoglossal nerve stimulation.',
      },
      {
        id: 'pm4',
        type: 'Process',
        number: '4',
        title:
          'Proportion of patients aged 18 years and older with OSA prescribed evidence-based therapy whose adherence was assessed at least annually using objective or self-reported data',
        denominator:
          'All patients aged 18 years and older with a diagnosis of OSA who are prescribed evidence-based therapy and have been on therapy for at least 12 months.',
        exceptions:
          'Patient declines adherence assessment. Insurance will not cover the assessment method. Patient is unable to access or afford the required technology. Patient does not return for annual follow-up. Patient has a terminal illness with life expectancy less than 6 months.',
        numerator:
          'Adherence assessed via objective informatics system (e.g., PAP download, compliance data) or, when objective data are unavailable, via subjective self-reporting by the patient, documented at least once in the 12-month reporting period.',
      },
      {
        id: 'pm5',
        type: 'Process',
        number: '5',
        title:
          'Proportion of patients aged 18 years and older diagnosed with OSA and receiving evidence-based therapy who had sleepiness and/or a validated instrument assessed at least annually',
        denominator:
          'All patients aged 18 years and older diagnosed with OSA who are receiving evidence-based therapy and have been on therapy for at least 12 months.',
        exceptions:
          'Patient does not return for annual follow-up. Patient declines or is unable to complete sleepiness assessment. Patient has a terminal illness with life expectancy less than 6 months. Patient declines therapy. Patient is unable to access or afford therapy.',
        numerator:
          'Assessment of sleepiness and/or administration of a validated sleepiness instrument (e.g., Epworth Sleepiness Scale) documented in the medical record at least once in the 12-month reporting period.',
      },
      {
        id: 'pm6',
        type: 'Process',
        number: '6',
        title:
          'Proportion of patients aged 18 years and older with OSA who were questioned about drowsy driving at the initial evaluation and at least annually thereafter',
        denominator:
          'All patients aged 18 years and older with a diagnosis of OSA (ICD-10: G47.33) seen for a new patient encounter during the reporting period. Applicable encounter codes: 99202–99205.',
        exceptions:
          'Patient does not drive. Patient declines to answer drowsy driving questions. Patient does not return for annual follow-up.',
        numerator:
          'Documentation that the patient was questioned about drowsy driving, including motor vehicle accidents, near-miss incidents, and sleepiness or drowsiness while driving, at the initial evaluation and at least once annually thereafter.',
      },
      {
        id: 'pm8',
        type: 'Process',
        number: '8',
        title:
          'Proportion of overweight or obese patients aged 18 years and older with OSA (BMI ≥25) who had weight documented and received weight management education',
        denominator:
          'All patients aged 18 years and older with a diagnosis of OSA and a BMI ≥25 (ICD-10: E66.9, E66.01, E66.3) seen during the reporting period.',
        exceptions:
          'Patient has a terminal illness with life expectancy less than 6 months. Patient is currently enrolled in a formal weight management program. Patient is pregnant.',
        numerator:
          'Current weight is documented; and the provider discusses the patient\'s weight status or refers to a weight management specialist. Discussion or referral is documented at the initial evaluation and at least once annually thereafter.',
      },
      {
        id: 'pm10',
        type: 'Process',
        number: '10',
        title:
          'Proportion of patients aged 18 years and older with OSA whose visit blood pressure was ≥130/80 mmHg and who received blood pressure counseling',
        denominator:
          'All patients aged 18 years and older with a diagnosis of OSA whose blood pressure was recorded as ≥130/80 mmHg at the current visit.',
        exceptions:
          'Blood pressure discussion was performed with the patient by another provider within the preceding 24 hours.',
        numerator:
          'Provider documents a discussion with the patient that untreated sleep apnea worsens high blood pressure and that both conditions together significantly increase cardiovascular risk.',
      },
      {
        id: 'screening',
        type: 'Screening',
        number: null,
        title:
          'Screening for Adult OSA by Primary Care Providers',
        denominator:
          'All patients aged 18 years and older identified by a primary care provider as being at high risk for obstructive sleep apnea during the reporting period.',
        exceptions:
          'Patient has an unstable medical, neurological, or psychiatric condition that precludes screening. Patient is currently being treated for OSA by another provider. Patient declines screening.',
        numerator:
          'Documentation of screening for OSA symptoms OR administration of a validated screening instrument (Berlin Questionnaire, STOP, or STOP-BANG) with interpretation of results AND documentation of an evidence-based action plan (e.g., referral to sleep specialist, diagnostic testing ordered).',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Insomnia
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'insomnia',
    title: 'Insomnia Measure Reporting',
    condition: 'Insomnia',
    intro: {
      instructions:
        'Please pull charts from the previous reporting year for patients with a diagnosis of insomnia. ' +
        'For each measure below, review your patient population and document the number of patients in ' +
        'the denominator, any exceptions, and the number who meet the numerator criteria. Enter your ' +
        'totals in the fields provided. If a measure does not apply to your practice, select ' +
        '"Not Applicable" and provide a brief reason. All fields marked with an asterisk (*) are ' +
        'required before submission.',
      fields: [
        {
          id: 'experience',
          label: 'Have you ever reported Insomnia quality measures? If yes, which measures?',
          type: 'textarea',
        },
        {
          id: 'clinicalSetting',
          label: 'Please describe your clinical setting (academic, small/large health system, clinic, etc.)',
          type: 'textarea',
        },
      ],
    },
    measures: [
      {
        id: 'pm1',
        type: 'Process',
        number: '1',
        title:
          'Proportion of patients aged 7 years and older with a diagnosis of insomnia who had sleep quality assessed at each visit where insomnia was addressed',
        denominator:
          'All patients aged 7 years and older with a diagnosis of insomnia (ICD-10: F51.x, G47.x, Z73.x) seen at a visit where insomnia was addressed during the reporting period. Applicable encounter codes: 90791, 90792, 90832–90834, 90836–90838, 99202–99215.',
        exceptions:
          'Patient has an unstable medical or psychiatric condition precluding assessment. Patient or caregiver declines assessment. Patient does not return for follow-up.',
        numerator:
          'Documentation of sleep quality assessment including patient- or caregiver-reported overall sleep quality AND at least one of the following: reported sleep latency or wake-after-sleep-onset time; review of sleep diary or actigraphy data; administration of a validated questionnaire such as the Insomnia Severity Index (ISI) or Pittsburgh Sleep Quality Index (PSQI).',
      },
      {
        id: 'om1',
        type: 'Outcome',
        number: '1',
        title:
          'Proportion of patients aged 7 years and older with insomnia receiving evidence-based treatment who demonstrated improvement in sleep satisfaction or quality',
        denominator:
          'All patients aged 7 years and older with a diagnosis of insomnia who received at least one course of evidence-based treatment during the reporting period.',
        exceptions:
          'Patient has an unstable medical or psychiatric condition. Patient recently began treatment for a significant comorbid condition that may affect sleep. Patient or caregiver declines outcome assessment. Patient does not return for follow-up. Payer does not cover the treatment or assessment.',
        numerator:
          'Post-treatment assessment using the same method as PM1 demonstrating improvement in patient- or caregiver-reported sleep quality or satisfaction compared with pre-treatment baseline.',
      },
      {
        id: 'pm2',
        type: 'Process',
        number: '2',
        title:
          'Proportion of patients aged 7 years and older with a diagnosis of insomnia who were offered evidence-based insomnia treatment',
        denominator:
          'All patients aged 7 years and older with a diagnosis of insomnia seen during the reporting period.',
        exceptions:
          'Patient has an unstable medical or psychiatric condition. Patient recently began treatment for a significant comorbid condition. Payer does not cover evidence-based treatment.',
        numerator:
          'Documentation that the patient was offered at least one evidence-based treatment, including: Cognitive Behavioral Therapy for Insomnia (CBT-I) or specific CBT-I components (stimulus control, sleep restriction, relaxation therapy, cognitive therapy, sleep hygiene); FDA-approved insomnia medications; or medications to address comorbid conditions contributing to insomnia.',
      },
      {
        id: 'om2',
        type: 'Outcome',
        number: '2',
        title:
          'Proportion of patients aged 7 years and older with insomnia receiving evidence-based treatment who demonstrated improvement in at least one domain of daytime functioning',
        denominator:
          'All patients aged 7 years and older with a diagnosis of insomnia who received at least one course of evidence-based treatment during the reporting period.',
        exceptions:
          'Patient has an unstable medical or psychiatric condition. Patient recently began treatment for a significant comorbid condition. Patient or caregiver declines outcome assessment. Patient does not return for follow-up. Payer does not cover the treatment or assessment.',
        numerator:
          'Post-treatment assessment demonstrating improvement in at least one domain of daytime functioning compared with pre-treatment baseline, including: fatigue or sleepiness, energy level, social or occupational functioning, mood, or cognitive functioning.',
      },
      {
        id: 'pm3',
        type: 'Process',
        number: '3',
        title:
          'Proportion of patients aged 7 years and older with a diagnosis of insomnia who had daytime functioning assessed at each visit where insomnia was addressed',
        denominator:
          'All patients aged 7 years and older with a diagnosis of insomnia seen at a visit where insomnia was addressed during the reporting period.',
        exceptions:
          'Patient has an unstable medical or psychiatric condition. Patient or caregiver declines assessment. Patient does not return for follow-up. Patient is unable to engage in the assessment.',
        numerator:
          'Documentation of daytime functioning assessment including patient-reported status in at least one of the following domains: fatigue or sleepiness, energy level, social or occupational functioning, mood, or cognitive functioning; OR administration of a validated questionnaire such as PHQ-9, GAD-7, Epworth Sleepiness Scale, or Sheehan Disability Scale.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Narcolepsy
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'narcolepsy',
    title: 'Narcolepsy Measure Reporting',
    condition: 'Narcolepsy',
    intro: {
      instructions:
        'Please pull charts from the previous reporting year for patients with a diagnosis of narcolepsy. ' +
        'For each measure below, review your patient population and document the number of patients in ' +
        'the denominator, any exceptions, and the number who meet the numerator criteria. Enter your ' +
        'totals in the fields provided. If a measure does not apply to your practice, select ' +
        '"Not Applicable" and provide a brief reason. All fields marked with an asterisk (*) are ' +
        'required before submission.',
      fields: [
        {
          id: 'experience',
          label: 'Have you ever reported Narcolepsy quality measures? If yes, which measures?',
          type: 'textarea',
        },
        {
          id: 'clinicalSetting',
          label: 'Please describe your clinical setting (academic, small/large health system, clinic, etc.)',
          type: 'textarea',
        },
      ],
    },
    measures: [
      {
        id: 'om1',
        type: 'Outcome',
        number: '1',
        title:
          'Proportion of patients diagnosed with narcolepsy who received evidence-based treatment and demonstrated improvement in narcolepsy symptoms',
        denominator:
          'All patients diagnosed with narcolepsy who received at least one evidence-based treatment during the reporting period.',
        exceptions:
          'Treatment is contraindicated for the patient. Patient declines treatment. Patient is unable to tolerate prescribed treatment.',
        numerator:
          'Documentation of improvement in excessive daytime sleepiness or other narcolepsy symptoms (cataplexy, sleep paralysis, hypnagogic hallucinations) after initiation or adjustment of evidence-based treatment.',
      },
      {
        id: 'pm1',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with narcolepsy who had sleepiness assessed with a validated measure at each visit',
        denominator:
          'All patients diagnosed with narcolepsy seen at any clinical visit during the reporting period.',
        exceptions:
          'Patient declines to complete sleepiness assessment. Patient is unable to complete the assessment.',
        numerator:
          'Documentation that sleepiness was measured at every clinical visit using a validated instrument such as the Epworth Sleepiness Scale (ESS) or equivalent validated tool.',
      },
      {
        id: 'pm2',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients with a new diagnosis of narcolepsy who received counseling regarding sleep hygiene and safety',
        denominator:
          'All patients who received a new diagnosis of narcolepsy during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that counseling regarding sleep hygiene and safety considerations was provided at the time of new diagnosis, including discussion of driving safety and hazardous occupational activities.',
      },
      {
        id: 'pm3',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients newly diagnosed with narcolepsy who had driving safety documented at the time of diagnosis',
        denominator:
          'All patients who received a new diagnosis of narcolepsy during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that driving safety was explicitly discussed with the patient and recorded in the medical record at the time of new diagnosis.',
      },
      {
        id: 'pm4',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients newly diagnosed with narcolepsy who had objective sleep testing (PSG/MSLT) performed to confirm diagnosis',
        denominator:
          'All patients who received a new diagnosis of narcolepsy during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of objective sleep testing including polysomnography (PSG) and/or Multiple Sleep Latency Test (MSLT) performed to confirm the diagnosis of narcolepsy.',
      },
      {
        id: 'pm5',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients newly diagnosed with narcolepsy who had evidence-based treatment initiated',
        denominator:
          'All patients who received a new diagnosis of narcolepsy during the reporting period.',
        exceptions:
          'Treatment is contraindicated for the patient. Patient declines treatment. Insurance does not cover prescribed treatment.',
        numerator:
          'Documentation that evidence-based treatment was initiated, including stimulant medications (modafinil, armodafinil, amphetamine-based agents), sodium oxybate, antidepressants for cataplexy, or other approved pharmacologic or non-pharmacologic treatments.',
      },
      {
        id: 'pm6',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with narcolepsy with a prescription who had medication management and monitoring documented',
        denominator:
          'All patients diagnosed with narcolepsy who have an active narcolepsy-related prescription during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of prescription management including review of medication efficacy, side effects, tolerability, and any adjustments made during the reporting period.',
      },
      {
        id: 'pm7',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with narcolepsy who received age-appropriate counseling about narcolepsy',
        denominator:
          'All patients diagnosed with narcolepsy seen during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of age-appropriate counseling about narcolepsy, its impact on daily life, management strategies, and available support resources.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Pediatric OSA
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'pediatric-osa',
    title: 'Pediatric OSA Measure Reporting',
    condition: 'Pediatric OSA',
    intro: {
      instructions:
        'Please pull charts from the previous reporting year for pediatric patients (under 18 years of age) ' +
        'with snoring or a diagnosis of obstructive sleep apnea. For each measure below, review your ' +
        'patient population and document the number of patients in the denominator, any exceptions, and ' +
        'the number who meet the numerator criteria. Enter your totals in the fields provided. If a ' +
        'measure does not apply to your practice, select "Not Applicable" and provide a brief reason. ' +
        'All fields marked with an asterisk (*) are required before submission.',
      fields: [
        {
          id: 'experience',
          label: 'Have you ever reported Pediatric OSA quality measures? If yes, which measures?',
          type: 'textarea',
        },
        {
          id: 'clinicalSetting',
          label: 'Please describe your clinical setting (academic, small/large health system, clinic, etc.)',
          type: 'textarea',
        },
      ],
    },
    measures: [
      {
        id: 'pm1',
        type: 'Process',
        number: '1',
        title:
          'Proportion of patients under 18 years of age diagnosed with OSA who received treatment and had treatment response assessed after treatment initiation',
        denominator:
          'All patients under 18 years of age diagnosed with obstructive sleep apnea who received treatment during the reporting period.',
        exceptions:
          'Patient or family declines treatment response assessment. Patient does not return for follow-up after treatment initiation.',
        numerator:
          'Documentation of a formal treatment response assessment after initiation of OSA treatment, including evaluation of symptoms, objective data where applicable, and clinical status.',
      },
      {
        id: 'pm2',
        type: 'Process',
        number: '2',
        title:
          'Proportion of patients under 18 years of age with snoring who were screened for OSA signs and symptoms',
        denominator:
          'All patients under 18 years of age presenting with a complaint of snoring during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of screening for OSA signs and symptoms in the snoring child, including witnessed apneas, labored breathing, enuresis, behavioral or neurocognitive concerns, and other associated features.',
      },
      {
        id: 'pm3',
        type: 'Process',
        number: '3',
        title:
          'Proportion of patients under 18 years of age with snoring and at least one OSA risk factor who were referred for or had objective testing performed',
        denominator:
          'All patients under 18 years of age with snoring and at least one identified OSA risk factor during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of referral to a sleep specialist or performance of objective OSA testing (polysomnography or equivalent) for the snoring child with risk factors.',
      },
      {
        id: 'pm4',
        type: 'Process',
        number: '4',
        title:
          'Proportion of patients under 18 years of age with a complex medical condition placing them at high risk for OSA who presented with signs or symptoms and were evaluated for OSA',
        denominator:
          'All patients under 18 years of age with a complex medical condition associated with high OSA risk who presented with signs or symptoms of OSA during the reporting period.',
        exceptions:
          'Patient or family declines evaluation. Patient is unable to complete objective testing due to medical complexity.',
        numerator:
          'Documentation that objective OSA evaluation was performed or ordered for the high-risk pediatric patient presenting with signs or symptoms.',
      },
      {
        id: 'pm5',
        type: 'Process',
        number: '5',
        title:
          'Proportion of patients under 18 years of age diagnosed with OSA who had OSA signs and symptoms re-assessed after treatment initiation',
        denominator:
          'All patients under 18 years of age diagnosed with OSA who initiated treatment during the reporting period.',
        exceptions:
          'Patient or family declines re-assessment. Patient does not return for follow-up after treatment initiation.',
        numerator:
          'Documentation of re-assessment of OSA signs and symptoms after treatment initiation, including snoring, witnessed apneas, daytime symptoms, and behavioral or neurocognitive status.',
      },
      {
        id: 'pm6',
        type: 'Process',
        number: '6',
        title:
          'Proportion of patients under 18 years of age diagnosed with OSA who were prescribed evidence-based therapy',
        denominator:
          'All patients under 18 years of age diagnosed with obstructive sleep apnea during the reporting period.',
        exceptions:
          'Patient or family declines prescribed therapy.',
        numerator:
          'Documentation that at least one evidence-based therapy was prescribed, including adenotonsillectomy, positive airway pressure (PAP) therapy, weight management intervention, positional therapy, or other age-appropriate evidence-based treatments.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Restless Legs Syndrome
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'restless-legs',
    title: 'Restless Legs Syndrome Measure Reporting',
    condition: 'Restless Legs Syndrome',
    intro: {
      instructions:
        'Please pull charts from the previous reporting year for patients with a diagnosis of restless legs ' +
        'syndrome (RLS). For each measure below, review your patient population and document the number of ' +
        'patients in the denominator, any exceptions, and the number who meet the numerator criteria. Enter ' +
        'your totals in the fields provided. If a measure does not apply to your practice, select ' +
        '"Not Applicable" and provide a brief reason. All fields marked with an asterisk (*) are required ' +
        'before submission.',
      fields: [
        {
          id: 'experience',
          label: 'Have you ever reported Restless Legs Syndrome quality measures? If yes, which measures?',
          type: 'textarea',
        },
        {
          id: 'clinicalSetting',
          label: 'Please describe your clinical setting (academic, small/large health system, clinic, etc.)',
          type: 'textarea',
        },
      ],
    },
    measures: [
      {
        id: 'pm1',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with RLS whose diagnosis was made according to accepted diagnostic criteria',
        denominator:
          'All patients diagnosed with restless legs syndrome seen during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that the RLS diagnosis was made according to the International Restless Legs Syndrome Study Group (IRLSSG) 5 essential diagnostic criteria: urge to move the legs, worsening at rest, relief with movement, worsening in the evening or night, and not attributable to another condition.',
      },
      {
        id: 'pm2',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients with clinically significant RLS who had iron studies measured',
        denominator:
          'All patients with a diagnosis of clinically significant RLS seen during the reporting period.',
        exceptions:
          'Iron studies were completed within a clinically acceptable timeframe and results are current. Patient declines iron studies.',
        numerator:
          'Documentation that iron studies were obtained, including serum ferritin, serum iron, and total iron-binding capacity (TIBC).',
      },
      {
        id: 'om',
        type: 'Outcome',
        number: null,
        title:
          'Proportion of patients diagnosed with RLS who were prescribed a new medication and demonstrated a decrease in symptom frequency or severity',
        denominator:
          'All patients diagnosed with RLS who were prescribed a new RLS medication during the reporting period.',
        exceptions:
          'Medication is not tolerable or causes unacceptable side effects. Patient declines follow-up assessment. Payer does not cover follow-up assessment or the medication.',
        numerator:
          'Documentation of a decrease in RLS symptom frequency or severity after initiation of the new medication, assessed by clinical evaluation, patient report, or validated instrument.',
      },
      {
        id: 'pm3',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with RLS who had symptom severity assessed at each visit',
        denominator:
          'All patients diagnosed with RLS seen at any clinical visit during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that RLS symptom severity was assessed at every clinical visit using a validated tool such as the International RLS (IRLS) rating scale or an equivalent validated severity measure.',
      },
      {
        id: 'pm4',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients with clinically significant RLS who were offered evidence-based treatment',
        denominator:
          'All patients with a diagnosis of clinically significant RLS seen during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that at least one evidence-based treatment was offered, including iron supplementation (if iron deficient), dopaminergic agents, alpha-2-delta calcium channel ligands (gabapentin, pregabalin), or other approved pharmacologic or non-pharmacologic treatments.',
      },
      {
        id: 'pm5',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients diagnosed with RLS who received counseling regarding RLS triggers and aggravating factors',
        denominator:
          'All patients diagnosed with restless legs syndrome seen during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation that counseling was provided about known RLS triggers and aggravating factors, including caffeine, alcohol, medications that worsen RLS (antihistamines, dopamine antagonists, SSRIs/SNRIs), and the importance of sleep hygiene.',
      },
      {
        id: 'pm6',
        type: 'Process',
        number: null,
        title:
          'Proportion of patients with RLS receiving treatment who had treatment adherence and response monitored',
        denominator:
          'All patients diagnosed with RLS who are receiving treatment during the reporting period.',
        exceptions:
          'No exceptions documented.',
        numerator:
          'Documentation of monitoring for treatment response and adherence, including assessment of symptom improvement, side effects, medication compliance, and any treatment adjustments made.',
      },
    ],
  },
];

/**
 * Find a workbook schema by its id.
 * Returns the matching workbook object, or undefined if not found.
 *
 * @param {string} id - The workbook id (e.g. 'adult-osa')
 * @returns {object|undefined}
 */
export function getWorkbookSchema(id) {
  return WORKBOOK_SCHEMAS.find((w) => w.id === id);
}

export default WORKBOOK_SCHEMAS;
