/**
 * Weekly digest email template
 */

interface WeeklyDigestData {
  userName: string
  lessonsCompleted: number
  simulationsCompleted: number
  timeSpent: number // in minutes
  topCompetencies: Array<{ name: string; score: number }>
  recommendedContent: Array<{ title: string; type: 'lesson' | 'simulation'; url: string }>
}

export function generateWeeklyDigestHTML(data: WeeklyDigestData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Praxis Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Weekly Summary</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Keep up the momentum, ${data.userName}!</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">This Week's Achievements</h2>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #667eea; margin-bottom: 5px;">${data.lessonsCompleted}</div>
          <div style="color: #6b7280; font-size: 14px;">Lessons Completed</div>
        </div>
        
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 5px;">${data.simulationsCompleted}</div>
          <div style="color: #6b7280; font-size: 14px;">Simulations Completed</div>
        </div>
      </div>
      
      <div style="text-align: center; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin-top: 15px;">
        <div style="color: #1e40af; font-weight: 600; margin-bottom: 5px;">Time Invested</div>
        <div style="font-size: 24px; color: #3b82f6; font-weight: bold;">${data.timeSpent} minutes</div>
      </div>
    </div>
    
    ${data.topCompetencies.length > 0 ? `
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Your Top Competencies This Week</h2>
      ${data.topCompetencies.map(comp => `
        <div style="margin: 15px 0; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-weight: 600; color: #374151;">${comp.name}</span>
            <span style="color: #667eea; font-weight: bold;">${comp.score.toFixed(1)}/5</span>
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.recommendedContent.length > 0 ? `
    <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Recommended for Next Week</h2>
      ${data.recommendedContent.map(item => `
        <div style="margin: 12px 0; padding: 15px; background: #f9fafb; border-left: 3px solid #667eea; border-radius: 4px;">
          <div style="font-weight: 600; color: #1f2937; margin-bottom: 5px;">${item.title}</div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}${item.url}" 
             style="color: #667eea; text-decoration: none; font-size: 14px;">
            ${item.type === 'lesson' ? '📚 View Lesson' : '🎯 Start Simulation'} →
          </a>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Dashboard
      </a>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
      <p>You're receiving this email because you're an active member of Praxis Platform.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://praxisplatform.com'}/profile/settings" style="color: #667eea;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

