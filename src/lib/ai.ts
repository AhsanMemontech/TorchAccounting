// AI Service Layer for Uncouple App
// Handles intelligent form processing, legal analysis, and document generation

import type { NextApiRequest } from 'next';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface AIFormData {
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    socialSecurityNumber: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  spouseInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    socialSecurityNumber: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  marriageInfo: {
    marriageDate: string
    marriageLocation: string
    separationDate?: string
    groundsForDivorce: string
  }
  childrenInfo: {
    hasChildren: boolean
    children: Array<{
      name: string
      dateOfBirth: string
      relationship: string
    }>
  }
  financialInfo: {
    assets: Array<{
      type: string
      description: string
      value: number
    }>
    liabilities: Array<{
      type: string
      description: string
      amount: number
    }>
  }
}

export interface AIAnalysisResult {
  eligibility: {
    isEligible: boolean
    score: number
    criteria: Record<string, boolean>
    recommendations: string[]
    warnings: string[]
  }
  formOptimization: {
    suggestedImprovements: string[]
    missingInformation: string[]
    complianceIssues: string[]
  }
  legalGuidance: {
    nextSteps: string[]
    timeline: string
    estimatedCosts: {
      courtFees: number
      serviceFees: number
      total: number
    }
  }
}

export interface GeneratedDocument {
  id: string
  name: string
  type: 'summons' | 'complaint' | 'affidavit' | 'financial-disclosure' | 'settlement' | 'judgment'
  content: string
  metadata: {
    generatedAt: string
    version: string
    compliance: string[]
  }
}

class AIService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_AI_API_KEY || ''
    this.baseUrl = process.env.NEXT_PUBLIC_AI_BASE_URL || 'https://api.openai.com/v1'
  }

  // Analyze user data and determine eligibility
  async analyzeEligibility(formData: AIFormData): Promise<AIAnalysisResult> {
    try {
      const analysis = await this.performAnalysis(formData)
      return analysis
    } catch (error) {
      console.error('AI Analysis failed:', error)
      return this.getFallbackAnalysis(formData)
    }
  }

  // Generate intelligent form content
  async generateFormContent(formData: AIFormData, formType: string): Promise<GeneratedDocument> {
    try {
      const content = await this.generateDocument(formData, formType)
      return content
    } catch (error) {
      console.error('Form generation failed:', error)
      return this.getFallbackDocument(formData, formType)
    }
  }

  // Validate form data and provide suggestions
  async validateFormData(formData: AIFormData): Promise<{
    isValid: boolean
    errors: string[]
    suggestions: string[]
  }> {
    const errors: string[] = []
    const suggestions: string[] = []

    // Validate personal information
    if (!formData.personalInfo.firstName || !formData.personalInfo.lastName) {
      errors.push('Full name is required')
    }

    if (!formData.personalInfo.socialSecurityNumber) {
      errors.push('Social Security Number is required')
    } else if (!this.isValidSSN(formData.personalInfo.socialSecurityNumber)) {
      errors.push('Invalid Social Security Number format')
    }

    // Validate marriage information
    if (!formData.marriageInfo.marriageDate) {
      errors.push('Marriage date is required')
    }

    // Validate residency
    if (formData.personalInfo.address.state !== 'NY') {
      errors.push('At least one spouse must be a New York resident')
    }

    // Provide suggestions
    if (!formData.marriageInfo.separationDate) {
      suggestions.push('Consider adding separation date if applicable')
    }

    if (formData.childrenInfo.hasChildren && formData.childrenInfo.children.length === 0) {
      suggestions.push('Please add information about your children')
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    }
  }

  // Optimize form content for better acceptance
  async optimizeFormContent(document: GeneratedDocument): Promise<GeneratedDocument> {
    try {
      const optimized = await this.performOptimization(document)
      return optimized
    } catch (error) {
      console.error('Form optimization failed:', error)
      return document
    }
  }

  // Get personalized legal guidance
  async getLegalGuidance(formData: AIFormData): Promise<{
    recommendations: string[]
    timeline: string
    nextSteps: string[]
    risks: string[]
  }> {
    const recommendations: string[] = []
    const risks: string[] = []

    // Analyze marriage duration
    const marriageDate = new Date(formData.marriageInfo.marriageDate)
    const yearsMarried = (Date.now() - marriageDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

    if (yearsMarried < 1) {
      risks.push('Marriage duration may not meet minimum requirements')
      recommendations.push('Consider waiting until marriage is at least 1 year old')
    }

    // Analyze children situation
    if (formData.childrenInfo.hasChildren) {
      recommendations.push('Consider consulting with a family law attorney for custody arrangements')
      recommendations.push('Ensure child support calculations are accurate')
    }

    // Analyze financial complexity
    if (formData.financialInfo.assets.length > 5 || formData.financialInfo.liabilities.length > 3) {
      recommendations.push('Consider consulting with a financial advisor for complex asset division')
    }

    return {
      recommendations,
      timeline: '3-6 months',
      nextSteps: [
        'Review all generated forms',
        'Gather required supporting documents',
        'File forms with appropriate court',
        'Serve papers to spouse',
        'Attend court hearing'
      ],
      risks
    }
  }

  // Private helper methods
  private async performAnalysis(formData: AIFormData): Promise<AIAnalysisResult> {
    // Simulate AI analysis - in production, this would call an AI API
    const eligibility = {
      isEligible: true,
      score: 85,
      criteria: {
        residency: formData.personalInfo.address.state === 'NY',
        marriageDuration: true,
        noContestedIssues: true
      },
      recommendations: [
        'Ensure all financial information is complete',
        'Consider mediation for any disagreements',
        'Gather all required supporting documents'
      ],
      warnings: []
    }

    const formOptimization = {
      suggestedImprovements: [
        'Add more detailed financial information',
        'Include separation date if applicable',
        'Provide complete children information'
      ],
      missingInformation: [],
      complianceIssues: []
    }

    const legalGuidance = {
      nextSteps: [
        'Review generated forms',
        'File with court',
        'Serve papers to spouse'
      ],
      timeline: '3-6 months',
      estimatedCosts: {
        courtFees: 210,
        serviceFees: 75,
        total: 285
      }
    }

    return {
      eligibility,
      formOptimization,
      legalGuidance
    }
  }

  private async generateDocument(formData: AIFormData, formType: string): Promise<GeneratedDocument> {
    // Simulate AI document generation
    const templates = {
      summons: this.generateSummonsTemplate(formData),
      complaint: this.generateComplaintTemplate(formData),
      affidavit: this.generateAffidavitTemplate(formData),
      'financial-disclosure': this.generateFinancialDisclosureTemplate(formData),
      settlement: this.generateSettlementTemplate(formData),
      judgment: this.generateJudgmentTemplate(formData)
    }

    const content = templates[formType as keyof typeof templates] || ''
    
    return {
      id: `${formType}-${Date.now()}`,
      name: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Document`,
      type: formType as any,
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        compliance: ['NY State Law', 'Court Requirements']
      }
    }
  }

  private async performOptimization(document: GeneratedDocument): Promise<GeneratedDocument> {
    // Simulate AI optimization
    return {
      ...document,
      content: document.content + '\n\n[AI Optimized for better court acceptance]',
      metadata: {
        ...document.metadata,
        version: '1.1',
        compliance: [...document.metadata.compliance, 'AI Optimized']
      }
    }
  }

  private getFallbackAnalysis(formData: AIFormData): AIAnalysisResult {
    return {
      eligibility: {
        isEligible: true,
        score: 75,
        criteria: {
          residency: formData.personalInfo.address.state === 'NY',
          marriageDuration: true,
          noContestedIssues: true
        },
        recommendations: ['Please review all information carefully'],
        warnings: ['AI analysis unavailable - manual review recommended']
      },
      formOptimization: {
        suggestedImprovements: [],
        missingInformation: [],
        complianceIssues: []
      },
      legalGuidance: {
        nextSteps: ['Review forms manually'],
        timeline: '3-6 months',
        estimatedCosts: {
          courtFees: 210,
          serviceFees: 75,
          total: 285
        }
      }
    }
  }

  private getFallbackDocument(formData: AIFormData, formType: string): GeneratedDocument {
    return {
      id: `${formType}-fallback-${Date.now()}`,
      name: `${formType} Document (Fallback)`,
      type: formType as any,
      content: `[Fallback ${formType} document - please review manually]`,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: 'fallback',
        compliance: ['Manual Review Required']
      }
    }
  }

  private isValidSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
    return ssnRegex.test(ssn)
  }

  // Document template generators
  private generateSummonsTemplate(formData: AIFormData): string {
    return `SUMMONS WITH NOTICE

TO: ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName}

You are hereby summoned to answer the complaint in this action and to serve a copy of your answer, or, if the complaint is not served with this summons, to serve a notice of appearance, on the plaintiff's attorney within 20 days after the service of this summons.

Plaintiff: ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}
Defendant: ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName}

Date: ${new Date().toLocaleDateString()}
Court: Supreme Court of the State of New York`
  }

  private generateComplaintTemplate(formData: AIFormData): string {
    return `VERIFIED COMPLAINT FOR DIVORCE

Plaintiff: ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}
Defendant: ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName}

1. Plaintiff resides at ${formData.personalInfo.address.street}, ${formData.personalInfo.address.city}, ${formData.personalInfo.address.state} ${formData.personalInfo.address.zipCode}.

2. Defendant resides at ${formData.spouseInfo.address.street}, ${formData.spouseInfo.address.city}, ${formData.spouseInfo.address.state} ${formData.spouseInfo.address.zipCode}.

3. The parties were married on ${formData.marriageInfo.marriageDate} in ${formData.marriageInfo.marriageLocation}.

4. The grounds for divorce are: ${formData.marriageInfo.groundsForDivorce}.

5. ${formData.childrenInfo.hasChildren ? `The parties have ${formData.childrenInfo.children.length} child(ren).` : 'The parties have no children.'}

WHEREFORE, plaintiff demands judgment dissolving the marriage between the parties.`
  }

  private generateAffidavitTemplate(formData: AIFormData): string {
    return `AFFIDAVIT OF SERVICE

I, ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}, being duly sworn, depose and say:

1. I am the plaintiff in this action.

2. On [DATE], I served the Summons with Notice and Verified Complaint for Divorce upon ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName} by [METHOD OF SERVICE].

3. The service was made at [LOCATION] in [CITY], [STATE].

4. The person served appeared to be over the age of 18.

Sworn to before me this ___ day of _______, 20___.

Notary Public`
  }

  private generateFinancialDisclosureTemplate(formData: AIFormData): string {
    return `STATEMENT OF NET WORTH

Name: ${formData.personalInfo.firstName} ${formData.personalInfo.lastName}
Address: ${formData.personalInfo.address.street}, ${formData.personalInfo.address.city}, ${formData.personalInfo.address.state} ${formData.personalInfo.address.zipCode}

ASSETS:
${formData.financialInfo.assets.map(asset => `- ${asset.type}: ${asset.description} - $${asset.value.toLocaleString()}`).join('\n')}

LIABILITIES:
${formData.financialInfo.liabilities.map(liability => `- ${liability.type}: ${liability.description} - $${liability.amount.toLocaleString()}`).join('\n')}

Total Assets: $${formData.financialInfo.assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString()}
Total Liabilities: $${formData.financialInfo.liabilities.reduce((sum, liability) => sum + liability.amount, 0).toLocaleString()}
Net Worth: $${(formData.financialInfo.assets.reduce((sum, asset) => sum + asset.value, 0) - formData.financialInfo.liabilities.reduce((sum, liability) => sum + liability.amount, 0)).toLocaleString()}`
  }

  private generateSettlementTemplate(formData: AIFormData): string {
    return `SETTLEMENT AGREEMENT

This agreement is made between ${formData.personalInfo.firstName} ${formData.personalInfo.lastName} ("Plaintiff") and ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName} ("Defendant") on ${new Date().toLocaleDateString()}.

1. PROPERTY DIVISION:
   - Real Estate: [DETAILS TO BE FILLED]
   - Personal Property: [DETAILS TO BE FILLED]
   - Financial Accounts: [DETAILS TO BE FILLED]

2. CHILD CUSTODY: ${formData.childrenInfo.hasChildren ? `\n   - Custody arrangements for ${formData.childrenInfo.children.length} child(ren)` : '\n   - No children involved'}

3. SUPPORT: [DETAILS TO BE FILLED]

4. GENERAL PROVISIONS:
   - Each party waives any right to maintenance
   - Each party waives any right to inherit from the other
   - This agreement is binding and enforceable

Dated: ${new Date().toLocaleDateString()}

Plaintiff: _________________
Defendant: _________________`
  }

  private generateJudgmentTemplate(formData: AIFormData): string {
    return `JUDGMENT OF DIVORCE

IT IS ORDERED AND ADJUDGED that:

1. The marriage between ${formData.personalInfo.firstName} ${formData.personalInfo.lastName} and ${formData.spouseInfo.firstName} ${formData.spouseInfo.lastName} is hereby dissolved.

2. The parties were married on ${formData.marriageInfo.marriageDate} in ${formData.marriageInfo.marriageLocation}.

3. The grounds for divorce are: ${formData.marriageInfo.groundsForDivorce}.

4. All other relief requested is granted as set forth in the Settlement Agreement.

5. This judgment is effective immediately.

Dated: ${new Date().toLocaleDateString()}

Judge: _________________
Court: Supreme Court of the State of New York`
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export utility functions
export const validateFormData = (formData: AIFormData) => aiService.validateFormData(formData)
export const analyzeEligibility = (formData: AIFormData) => aiService.analyzeEligibility(formData)
export const generateFormContent = (formData: AIFormData, formType: string) => aiService.generateFormContent(formData, formType)
export const getLegalGuidance = (formData: AIFormData) => aiService.getLegalGuidance(formData)

export async function getAIQuestions(context: string = 'NY uncontested divorce') {
  const prompt = `You are a legal expert. Generate a JSON array of 3-7 eligibility questions (with id, text, type: 'yes-no'|'multiple-choice'|'text'|'date', and options if applicable) to determine if someone qualifies for an uncontested divorce in New York State. Be concise and clear.`;
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful legal assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    }),
  });
  const data = await response.json();
  // Try to parse the first code block as JSON
  const match = data.choices?.[0]?.message?.content.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  // Fallback: try to parse the whole content
  try {
    return JSON.parse(data.choices?.[0]?.message?.content);
  } catch {
    return [];
  }
}

export async function getAIReport(answers: Record<string, any>, questions: any[]) {
  const prompt = `You are a legal expert. Given these eligibility questions and answers for NY uncontested divorce, analyze eligibility, list which criteria are met, and provide a JSON report with: isEligible (boolean), eligibilityPercentage (0-100), criteria (object), recommendations (array), warnings (array), and a summary string.\nQuestions: ${JSON.stringify(questions)}\nAnswers: ${JSON.stringify(answers)}`;
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful legal assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    }),
  });
  const data = await response.json();
  // Try to parse the first code block as JSON
  const match = data.choices?.[0]?.message?.content.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  // Fallback: try to parse the whole content
  try {
    return JSON.parse(data.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
} 