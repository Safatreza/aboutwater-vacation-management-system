/**
 * Email Service for AboutWater GmbH
 * Supports multiple email providers: SMTP, SendGrid, AWS SES
 * Professional email templates with AboutWater branding
 */

import nodemailer from 'nodemailer'

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses'
  smtp?: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  sendgrid?: {
    apiKey: string
  }
  ses?: {
    region: string
    accessKey: string
    secretKey: string
  }
}

export interface BackupEmailData {
  recipientEmail: string
  backupDate: string
  employeeCount: number
  vacationCount: number
  holidayCount: number
  fileSize: string
}

export class EmailService {
  private config: EmailConfig
  
  constructor() {
    // Auto-detect email provider based on environment variables
    this.config = this.detectEmailProvider()
  }
  
  private detectEmailProvider(): EmailConfig {
    // Check for SendGrid
    if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.includes('your-')) {
      return {
        provider: 'sendgrid',
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY
        }
      }
    }
    
    // Check for AWS SES
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && 
        !process.env.AWS_ACCESS_KEY_ID.includes('your-')) {
      return {
        provider: 'ses',
        ses: {
          region: process.env.AWS_REGION || 'eu-central-1',
          accessKey: process.env.AWS_ACCESS_KEY_ID,
          secretKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      }
    }
    
    // Default to SMTP
    return {
      provider: 'smtp',
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    }
  }
  
  /**
   * Send backup notification email with professional AboutWater branding
   */
  async sendBackupEmail(buffer: Buffer, data: BackupEmailData): Promise<boolean> {
    try {
      console.log(`[EmailService] Sending backup email via ${this.config.provider}`)
      
      switch (this.config.provider) {
        case 'smtp':
          return await this.sendViaSMTP(buffer, data)
        case 'sendgrid':
          return await this.sendViaSendGrid(buffer, data)
        case 'ses':
          return await this.sendViaSES(buffer, data)
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error)
      return false
    }
  }
  
  private async sendViaSMTP(buffer: Buffer, data: BackupEmailData): Promise<boolean> {
    if (!this.config.smtp?.user || !this.config.smtp?.pass || 
        this.config.smtp.user.includes('your-') || this.config.smtp.pass.includes('your-')) {
      console.log('[EmailService] SMTP not properly configured')
      return false
    }
    
    const transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: {
        user: this.config.smtp.user,
        pass: this.config.smtp.pass
      }
    })
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@aboutwater.de',
      to: data.recipientEmail,
      subject: `AboutWater GmbH - Vacation Data Backup - ${data.backupDate}`,
      html: this.generateEmailTemplate(data),
      attachments: [{
        filename: `aboutwater-vacation-backup-${data.backupDate.replace(/\\./g, '-')}.xlsx`,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }]
    }
    
    await transporter.sendMail(mailOptions)
    console.log('[EmailService] Backup email sent successfully via SMTP')
    return true
  }
  
  private async sendViaSendGrid(buffer: Buffer, data: BackupEmailData): Promise<boolean> {
    // SendGrid implementation
    console.log('[EmailService] SendGrid integration not implemented yet')
    return false
  }
  
  private async sendViaSES(buffer: Buffer, data: BackupEmailData): Promise<boolean> {
    // AWS SES implementation  
    console.log('[EmailService] AWS SES integration not implemented yet')
    return false
  }
  
  /**
   * Generate professional AboutWater email template
   */
  private generateEmailTemplate(data: BackupEmailData): string {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AboutWater Vacation Data Backup</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=ASAP:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'ASAP', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f7fa;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1c5975 0%, #2a7da2 100%);
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 400;
    }
    
    .content {
      padding: 40px;
    }
    
    .greeting {
      font-size: 18px;
      color: #1c5975;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: 700;
      color: #1c5975;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .attachment-info {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 6px;
      padding: 20px;
      margin: 30px 0;
    }
    
    .attachment-icon {
      color: #0ea5e9;
      font-size: 24px;
      margin-bottom: 10px;
    }
    
    .attachment-title {
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 5px;
    }
    
    .attachment-desc {
      font-size: 14px;
      color: #0369a1;
    }
    
    .footer {
      background: #f8fafc;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-text {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 10px;
    }
    
    .company-info {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .security-notice {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .security-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 5px;
    }
    
    .security-text {
      font-size: 14px;
      color: #b45309;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">AboutWater GmbH</div>
      <div class="subtitle">Vacation Management System</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">Guten Tag!</div>
      
      <div class="message">
        Ihr automatisches Backup der Urlaubsdaten wurde erfolgreich erstellt. 
        Dieser Bericht enthält alle aktuellen Mitarbeiter- und Urlaubsdaten Stand ${data.backupDate}.
      </div>
      
      <!-- Statistics -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${data.employeeCount}</div>
          <div class="stat-label">Mitarbeiter</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.vacationCount}</div>
          <div class="stat-label">Urlaubsanträge</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.holidayCount}</div>
          <div class="stat-label">Feiertage</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.fileSize}</div>
          <div class="stat-label">Dateigröße</div>
        </div>
      </div>
      
      <!-- Attachment Info -->
      <div class="attachment-info">
        <div class="attachment-icon">📎</div>
        <div class="attachment-title">Excel-Backup im Anhang</div>
        <div class="attachment-desc">
          Die vollständige Excel-Datei mit allen Daten ist dieser E-Mail angehängt. 
          Bewahren Sie diese sicher auf für Ihre Unterlagen.
        </div>
      </div>
      
      <!-- Security Notice -->
      <div class="security-notice">
        <div class="security-title">🔒 Sicherheitshinweis</div>
        <div class="security-text">
          Diese E-Mail enthält vertrauliche Unternehmensdaten. Bitte behandeln Sie sie entsprechend 
          und leiten Sie sie nicht an unbefugte Personen weiter.
        </div>
      </div>
      
      <div class="message">
        Das Backup wird automatisch alle 7 Tage erstellt. Bei Fragen wenden Sie sich bitte 
        an das IT-Team oder besuchen Sie das Vacation Management Dashboard.
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        Diese E-Mail wurde automatisch vom AboutWater Vacation Management System generiert.
      </div>
      <div class="company-info">
        AboutWater GmbH | Vacation Management System<br>
        Automatisches Backup-System | ${new Date().toLocaleDateString('de-DE', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  </div>
</body>
</html>
    `
  }
  
  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.config.provider === 'smtp') {
        if (!this.config.smtp?.user || this.config.smtp.user.includes('your-')) {
          return { success: false, message: 'SMTP configuration is incomplete' }
        }
        
        const transporter = nodemailer.createTransport({
          host: this.config.smtp.host,
          port: this.config.smtp.port,
          secure: this.config.smtp.secure,
          auth: {
            user: this.config.smtp.user,
            pass: this.config.smtp.pass
          }
        })
        
        await transporter.verify()
        return { success: true, message: 'SMTP connection successful' }
      }
      
      return { success: false, message: `Provider ${this.config.provider} not implemented` }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()