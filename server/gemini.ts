import { GoogleGenAI, Type } from '@google/genai';
import { TREATMENT_RULES } from './rules.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GeminiEligibilityResult {
  branch: 'PA' | 'NonPA';
  reasoning: string;
  documentTitle: string;
  fullDocument: string;
}

export async function evaluateEligibilityWithGemini(params: {
  procedure: string;
  monthsWaited: number;
  conditionNotes: string;
  doctorName: string;
  clinicName?: string;
  requestTravelCost?: boolean;
  travelCompanion?: boolean;
}): Promise<GeminiEligibilityResult> {
  // Deterministic classification lookup from rules table
  const rule = TREATMENT_RULES.find(
    (r) => r.procedure.toLowerCase() === params.procedure.toLowerCase()
  ) || {
    procedure: params.procedure,
    requiresPA: true, // Default per spec for other specialist surgery
    category: 'inpatient' as const,
    reason: 'Requires inpatient admission or specialised equipment',
    domesticAverageWaitMonths: 18,
    isPlaceholderDefault: true,
  };

  const determinedBranch: 'PA' | 'NonPA' = rule.requiresPA ? 'PA' : 'NonPA';

  const systemInstruction = `You are the legal & procedural reasoning engine for CuraLink, a patient rights navigator for Hungarian public hospital waitlist patients exercising their cross-border healthcare rights under EU Regulation 883/2004 (S2 pre-authorisation) and Directive 2011/24/EU (cross-border healthcare).
CRITICAL RULES:
1. The classification of whether Prior Authorisation (PA) is required is DETERMINISTIC and must strictly follow the provided rule: This procedure '${params.procedure}' has requiresPA = ${rule.requiresPA}. Therefore the branch MUST be "${determinedBranch}". You are FORBIDDEN from altering this branch classification.
2. In 'reasoning': Write a plain-language summary UNDER 60 words. You MUST explicitly state that this is a demo suggestion based on self-reported details, not verified fact, and does NOT constitute formal legal or medical advice.
3. In 'fullDocument': Write a formal, Hungarian-language official document/letter (120 to 180 words) addressed to NEAK (Nemzeti Egészségbiztosítási Alapkezelő, Nemzetközi és Európai Integrációs Főosztály).
   - NEVER use real personal identifiers: use placeholders '[Patient name on file]' and '[TAJ number on file]'.
   - For PA branch: Draft the formal 'Kérelem külföldi egészségügyi ellátásra' (S2 application) referencing excessive domestic wait time, clinical progression, chosen foreign clinic, and include dedicated clauses for patient travel cost reimbursement and companion travel cost reimbursement if requested (${params.requestTravelCost ? 'YES requested' : 'no'}), noting travel cost is discretionary ('méltányosság').
   - For Non-PA branch: Draft the 'Utólagos Költségtérítési Kérelem és Mellékletjegyzék' (Directive reimbursement claim cover sheet) requiring foreign invoice, certified translation, proof of payment, discharge summary, and prescriptions.
4. Output MUST strictly match the requested JSON schema.`;

  const userPrompt = `Evaluate case and draft official filing:
- Procedure: ${params.procedure}
- Requires Prior Authorisation: ${rule.requiresPA ? 'YES (Inpatient/specialised)' : 'NO (Outpatient day surgery)'}
- Mandated Branch: ${determinedBranch}
- Months waited domestically: ${params.monthsWaited} months
- Treating doctor: ${params.doctorName}
- Condition clinical notes: ${params.conditionNotes}
- Target Clinic: ${params.clinicName || 'Recognised EU healthcare provider'}
- Travel Cost Requested: ${params.requestTravelCost ? 'Yes (discretionary méltányosság)' : 'No'}
- Travel Companion Requested: ${params.travelCompanion ? 'Yes' : 'No'}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            branch: {
              type: Type.STRING,
              description: 'Strictly "PA" or "NonPA"',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Plain language reasoning under 60 words including demo disclaimer',
            },
            documentTitle: {
              type: Type.STRING,
              description: 'Official title of the drafted NEAK document',
            },
            fullDocument: {
              type: Type.STRING,
              description: 'Formal letter 120-180 words with placeholders',
            },
          },
          required: ['branch', 'reasoning', 'documentTitle', 'fullDocument'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    // Ensure deterministic branch is enforced
    parsed.branch = determinedBranch;
    return parsed as GeminiEligibilityResult;
  } catch (error) {
    console.error('Gemini API call failed or timed out, using fallback rules engine:', error);
    // Reliable high-fidelity fallback matching exact legal requirements
    return getFallbackEligibility(params, rule, determinedBranch);
  }
}

function getFallbackEligibility(
  params: {
    procedure: string;
    monthsWaited: number;
    conditionNotes: string;
    clinicName?: string;
    requestTravelCost?: boolean;
    travelCompanion?: boolean;
  },
  rule: { requiresPA: boolean; reason: string },
  branch: 'PA' | 'NonPA'
): GeminiEligibilityResult {
  if (branch === 'PA') {
    return {
      branch: 'PA',
      reasoning: `DEMO SUGGESTION (Self-reported intake, not legal/medical counsel): ${params.procedure} involves inpatient care and requires Prior Authorisation. A documented wait of ${params.monthsWaited} months exceeds medically justifiable timelines, establishing prima facie grounds for an S2 pre-approval under EU Regulation 883/2004.`,
      documentTitle: 'Kérelem külföldi egészségügyi ellátásra (NEAK S2 Prior Authorisation Request)',
      fullDocument: `Tisztelt Nemzeti Egészségbiztosítási Alapkezelő!
Nemzetközi és Európai Integrációs Főosztály

Alulírott [Patient name on file] (TAJ: [TAJ number on file]), kérelmezem a külföldi tervezett gyógykezelés (${params.procedure}) engedélyezését S2 nyomtatvány kiállításával a(z) ${params.clinicName || 'partneregészségügyi intézmény'} keretében.

A hazai ellátási várólistán eltöltött idő jelenleg ${params.monthsWaited} hónap, ami a kezelőorvosi leletek alapján orvosilag indokolatlan késedelmet jelent, és a beteg állapotának progresszív romlásával fenyeget a 883/2004/EK rendelet 20. cikke szerint.

${params.requestTravelCost ? 'Kérelmezem továbbá a beteg ' + (params.travelCompanion ? 'és kísérője ' : '') + 'utazási költségeinek méltányossági alapon történő megtérítését a csatolt szakorvosi javaslat figyelembevételével.' : ''}

Mellékelten benyújtom az EESZT várólista-kivonatot és a kezelőorvosi dokumentációt.

Kelt: Budapest, ${new Date().getFullYear()}`,
    };
  } else {
    return {
      branch: 'NonPA',
      reasoning: `DEMO SUGGESTION (Self-reported intake, not legal/medical counsel): ${params.procedure} is an outpatient day-procedure not requiring Prior Authorisation under Directive 2011/24/EU. Patient may receive care abroad and submit for domestic tariff reimbursement post-treatment.`,
      documentTitle: 'Utólagos Költségtérítési Kérelem és Mellékletjegyzék (Directive 2011/24/EU Cover Sheet)',
      fullDocument: `Tisztelt Nemzeti Egészségbiztosítási Alapkezelő!
Nemzetközi és Európai Integrációs Főosztály

Alulírott [Patient name on file] (TAJ: [TAJ number on file]), a 2011/24/EU irányelv és a 340/2013. (IX. 25.) Korm. rendelet alapján benyújtom utólagos költségtérítési kérelmemet a külföldön elvégzett ${params.procedure} kapcsán.

A beavatkozás járóbeteg-ellátásban történt, éjszakai bentfekvést nem igényelt, így előzetes engedélyhez nem kötött.

Benyújtott mellékletek:
1. Eredeti számla és hiteles fordítás
2. Pénzügyi kiegyenlítés banki bizonylata
3. Részletes orvosi ambuláns lap és zárójelentés
4. Vonatkozó receptek és gyógyszerrendelések

Kelt: Budapest, ${new Date().getFullYear()}`,
    };
  }
}
