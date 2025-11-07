import { prisma } from '@/lib/prisma/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Comprehensive seed function that creates ALL demo data from scratch
 * Creates: competencies, cases, articles, then user data
 */
export async function seedComprehensiveData(userId: string, email?: string) {
  const results: any = {
    competencies: 0,
    cases: 0,
    articles: 0,
    simulations: 0,
    debriefs: 0,
    articleProgress: 0,
    notifications: 0,
    errors: [] as string[],
  }

  try {
    // Verify profile exists
    let profileExists = false
    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    
    profileExists = !!existingProfile

    if (!profileExists) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (serviceRoleKey && supabaseUrl) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        const { data: { user: supabaseUser } } = await supabaseAdmin.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } }))
        
        const supabaseUserTyped = supabaseUser as any
        const usernameFromMetadata = supabaseUserTyped?.user_metadata?.username
        const emailPrefix = email?.split('@')[0] || 'user'
        let baseUsername = usernameFromMetadata || emailPrefix.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || `user_${userId.slice(0, 8)}`
        let username = baseUsername

        const { data: existingUsername } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle()

        if (existingUsername) {
          username = `${baseUsername}_${userId.slice(0, 8)}`
        }

        const fullName = supabaseUserTyped?.user_metadata?.full_name || 
                       supabaseUserTyped?.user_metadata?.fullName ||
                       emailPrefix || null

        await supabaseAdmin.from('profiles').insert({
          id: userId,
          username: username,
          full_name: fullName || username.charAt(0).toUpperCase() + username.slice(1),
          role: 'member',
        } as any)

        await new Promise(resolve => setTimeout(resolve, 300))
        try {
          profileExists = !!await prisma.profile.findUnique({
            where: { id: userId },
            select: { id: true },
          })
        } catch (error: any) {
          // Handle missing columns (P2022) or other schema issues
          if (error?.code === 'P2022' || error?.message?.includes('does not exist')) {
            try {
              profileExists = !!await prisma.profile.findUnique({
                where: { id: userId },
                select: { id: true },
              })
            } catch (fallbackError) {
              console.error('Error checking profile existence (fallback):', fallbackError)
              profileExists = false
            }
          } else {
            throw error
          }
        }
      }
    }

    if (!profileExists) {
      results.errors.push('Profile does not exist and could not be created')
      return results
    }

    // Ensure residency exists
    let existingResidency = await prisma.userResidency.findUnique({
      where: { userId },
    })

    if (!existingResidency) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await prisma.userResidency.create({
            data: { userId, currentResidency: 1 },
          })
          break
        } catch (residencyError: any) {
          if (residencyError?.code === 'P2003') {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
            existingResidency = await prisma.userResidency.findUnique({ where: { userId } })
            if (existingResidency) break
          } else {
            results.errors.push(`Failed to create residency: ${residencyError.message}`)
            break
          }
        }
      }
    }

    // STEP 1: CREATE COMPETENCIES (if they don't exist)
    const coreDomains = [
      { name: 'Financial Acumen', description: 'Understanding and applying financial principles to business decisions', level: 'domain' },
      { name: 'Strategic Thinking', description: 'Ability to formulate and execute long-term business strategy', level: 'domain' },
      { name: 'Market Awareness', description: 'Understanding market dynamics, competition, and customer needs', level: 'domain' },
      { name: 'Risk Management', description: 'Identifying, assessing, and mitigating business risks', level: 'domain' },
      { name: 'Leadership Judgment', description: 'Making sound decisions and leading teams effectively', level: 'domain' },
    ]

    const competencyMap = new Map<string, string>() // name -> id

    for (const domain of coreDomains) {
      try {
        const existing = await prisma.$queryRaw`
          SELECT id FROM competencies WHERE name = ${domain.name}::text AND level = ${domain.level}::text LIMIT 1
        ` as any[]
        
        if (existing && existing.length > 0) {
          competencyMap.set(domain.name, existing[0].id)
          continue
        }

        const newDomain = await prisma.$queryRaw`
          INSERT INTO competencies (id, name, description, parent_id, level, residency_year, display_order, created_at, updated_at)
          VALUES (gen_random_uuid(), ${domain.name}::text, ${domain.description}::text, NULL, ${domain.level}::text, NULL, 0, NOW(), NOW())
          RETURNING id
        ` as any[]
        
        if (newDomain && newDomain.length > 0) {
          competencyMap.set(domain.name, newDomain[0].id)
          results.competencies++
        }
      } catch (error: any) {
        results.errors.push(`Failed to create domain ${domain.name}: ${error.message}`)
      }
    }

    // STEP 2: CREATE CASES (if they don't exist)
    const caseData = [
      {
        title: "Tesla's Model 3 Production Crisis (2018)",
        description: "You are Elon Musk in Q2 2018. Tesla is burning cash while struggling to meet Model 3 production targets. Make strategic decisions to achieve manufacturing excellence.",
        difficulty: 'advanced',
        estimatedMinutes: 90,
        rubric: {
          strategic_thinking: { weight: 0.25, description: "Strategic approach to production scaling" },
          financial_acumen: { weight: 0.30, description: "Cash flow and capital allocation decisions" },
          operational_excellence: { weight: 0.30, description: "Manufacturing and supply chain optimization" },
          stakeholder_management: { weight: 0.15, description: "Communication with investors and employees" }
        },
        competencyName: 'Strategic Thinking',
      },
      {
        title: "Disney's Streaming Pivot (2017)",
        description: "Navigate Disney's strategic pivot from traditional media to direct-to-consumer streaming. Balance content investment with profitability.",
        difficulty: 'advanced',
        estimatedMinutes: 75,
        rubric: {
          strategic_thinking: { weight: 0.35, description: "Long-term strategic vision" },
          financial_acumen: { weight: 0.25, description: "Investment ROI analysis" },
          market_awareness: { weight: 0.25, description: "Understanding streaming market dynamics" },
          risk_management: { weight: 0.15, description: "Cannibalization risk assessment" }
        },
        competencyName: 'Strategic Thinking',
      },
      {
        title: "Airbnb's COVID Crisis Response (2020)",
        description: "Lead Airbnb through the 2020 travel collapse. Make decisions about layoffs, refunds, and strategic pivots.",
        difficulty: 'intermediate',
        estimatedMinutes: 60,
        rubric: {
          crisis_leadership: { weight: 0.30, description: "Decision-making under extreme uncertainty" },
          stakeholder_management: { weight: 0.25, description: "Balancing employee, host, and guest needs" },
          financial_acumen: { weight: 0.25, description: "Cash preservation and runway management" },
          strategic_thinking: { weight: 0.20, description: "Identifying pivot opportunities" }
        },
        competencyName: 'Leadership Judgment',
      },
      {
        title: "Netflix Content Strategy (2019)",
        description: "Optimize Netflix's content spending strategy. Balance original content vs. licensing, and regional vs. global content.",
        difficulty: 'intermediate',
        estimatedMinutes: 70,
        rubric: {
          strategic_thinking: { weight: 0.30, description: "Content strategy alignment" },
          financial_acumen: { weight: 0.30, description: "Budget allocation and ROI" },
          market_awareness: { weight: 0.25, description: "Content preferences and competition" },
          operational_excellence: { weight: 0.15, description: "Production pipeline efficiency" }
        },
        competencyName: 'Market Awareness',
      },
      {
        title: "Zoom Security Crisis (2020)",
        description: "Address Zoom's security vulnerabilities during rapid growth. Balance user trust with product velocity.",
        difficulty: 'beginner',
        estimatedMinutes: 45,
        rubric: {
          risk_management: { weight: 0.35, description: "Security risk assessment and mitigation" },
          stakeholder_communication: { weight: 0.30, description: "Transparent communication with users" },
          operational_excellence: { weight: 0.25, description: "Rapid engineering response" },
          strategic_thinking: { weight: 0.10, description: "Long-term trust building" }
        },
        competencyName: 'Risk Management',
      },
    ]

    const createdCaseIds: string[] = []

    for (const caseInfo of caseData) {
      try {
        // Check if case exists - use Prisma model for more reliable query
        const existingCase = await prisma.case.findFirst({
          where: { title: caseInfo.title },
          select: { id: true },
        })
        
        let caseId: string | undefined
        
        if (existingCase?.id) {
          caseId = existingCase.id
          // Case already exists - we'll use it for simulations (don't increment counter)
        } else {
          const competencyId = competencyMap.get(caseInfo.competencyName) || competencyMap.values().next().value
          
          const newCase = await prisma.$queryRaw`
            INSERT INTO cases (id, title, description, briefing_doc, datasets, rubric, status, difficulty, estimated_minutes, prerequisites, metadata, created_by, updated_by, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${caseInfo.title}::text,
              ${caseInfo.description}::text,
              ${`# ${caseInfo.title}\n\n${caseInfo.description}\n\n## Case Briefing\n\nThis simulation challenges you to make critical executive decisions under pressure. Use the provided data and frameworks to analyze the situation and make strategic choices.`}::text,
              NULL::jsonb,
              ${JSON.stringify(caseInfo.rubric)}::jsonb,
              'published'::text,
              ${caseInfo.difficulty}::text,
              ${caseInfo.estimatedMinutes}::integer,
              '[]'::jsonb,
              '{}'::jsonb,
              ${userId}::uuid,
              ${userId}::uuid,
              NOW(),
              NOW()
            )
            RETURNING id
          ` as any[]
          
          if (newCase && newCase.length > 0) {
            caseId = newCase[0].id
            
            // Link to competency
            if (competencyId) {
              await prisma.$executeRaw`
                INSERT INTO case_competencies (case_id, competency_id)
                VALUES (${caseId}::uuid, ${competencyId}::uuid)
                ON CONFLICT (case_id, competency_id) DO NOTHING
              `
            }
            
            results.cases++
          } else {
            continue
          }
        }
        
        if (caseId) {
          createdCaseIds.push(caseId)
        } else {
          results.errors.push(`Failed to get/create case ID for ${caseInfo.title}`)
        }
      } catch (error: any) {
        results.errors.push(`Failed to create case ${caseInfo.title}: ${error.message}`)
        // Continue to next case even if this one failed
      }
    }
    
    // Verify we have cases to work with
    if (createdCaseIds.length === 0) {
      // Fallback: try to get any published cases from the database
      try {
        const anyCases = await prisma.$queryRaw`
          SELECT id FROM cases 
          WHERE (status = 'published'::text OR status IS NULL) AND (published = true OR published IS NULL)
          LIMIT 5
        ` as any[]
        
        if (anyCases && anyCases.length > 0) {
          for (const c of anyCases) {
            if (c.id) createdCaseIds.push(c.id)
          }
          results.errors.push(`Could not find/create specific cases, but found ${anyCases.length} existing cases to use.`)
        } else {
          results.errors.push('WARNING: No cases were found or created. Cannot create simulations.')
        }
      } catch (fallbackError: any) {
        results.errors.push(`WARNING: No cases available and fallback query failed: ${fallbackError.message}`)
      }
    }

    // STEP 3: CREATE ARTICLES (if they don't exist)
    const articleData = [
      { title: 'Understanding Financial Statements', description: 'Learn to read P&L, Balance Sheet, and Cash Flow statements', competencyName: 'Financial Acumen' },
      { title: 'Strategic Planning Frameworks', description: 'SWOT analysis, Porter\'s Five Forces, and strategic positioning', competencyName: 'Strategic Thinking' },
      { title: 'Market Research Fundamentals', description: 'Customer segmentation and competitive analysis', competencyName: 'Market Awareness' },
      { title: 'Risk Assessment Models', description: 'Identifying and quantifying business risks', competencyName: 'Risk Management' },
      { title: 'Executive Decision-Making', description: 'Frameworks for making high-stakes business decisions', competencyName: 'Leadership Judgment' },
      { title: 'Capital Allocation Strategies', description: 'OPEX vs CAPEX and investment prioritization', competencyName: 'Financial Acumen' },
      { title: 'Go-to-Market Strategies', description: 'B2B vs B2C approaches and market entry tactics', competencyName: 'Market Awareness' },
      { title: 'Operational Excellence', description: 'Lean methodologies and process optimization', competencyName: 'Strategic Thinking' },
    ]

    const createdArticleIds: string[] = []

    for (const articleInfo of articleData) {
      try {
        // Check if article exists - use Prisma model for more reliable query
        const existingArticle = await prisma.article.findFirst({
          where: { title: articleInfo.title },
          select: { id: true },
        })
        
        let articleId: string | undefined
        
        if (existingArticle?.id) {
          articleId = existingArticle.id
          // Article already exists, use it (don't increment counter)
        } else {
          const competencyId = competencyMap.get(articleInfo.competencyName) || competencyMap.values().next().value
          
          if (!competencyId) {
            results.errors.push(`No competency found for article ${articleInfo.title}`)
            continue
          }
          
          const newArticle = await prisma.$queryRaw`
            INSERT INTO articles (id, competency_id, title, description, content, status, published, metadata, created_by, updated_by, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${competencyId}::uuid,
              ${articleInfo.title}::text,
              ${articleInfo.description}::text,
              ${`# ${articleInfo.title}\n\n${articleInfo.description}\n\n## Overview\n\nThis article covers fundamental concepts in ${articleInfo.competencyName.toLowerCase()}. You'll learn key frameworks and mental models used by top executives.\n\n## Key Concepts\n\n- Core principles and frameworks\n- Real-world applications\n- Common pitfalls to avoid\n- Strategic implications\n\n## Practice Exercises\n\nApply these concepts in the case simulations to develop your executive decision-making skills.`}::text,
              'published'::text,
              true::boolean,
              '{}'::jsonb,
              ${userId}::uuid,
              ${userId}::uuid,
              NOW(),
              NOW()
            )
            RETURNING id
          ` as any[]
          
          if (newArticle && newArticle.length > 0) {
            articleId = newArticle[0].id
            results.articles++
          } else {
            continue
          }
        }
        
        if (articleId) {
          createdArticleIds.push(articleId)
        } else {
          results.errors.push(`Failed to get/create article ID for ${articleInfo.title}`)
        }
      } catch (error: any) {
        // Connection errors can occur - log but continue
        if (error.message?.includes('closed the connection')) {
          results.errors.push(`Database connection closed while creating article ${articleInfo.title}. This may indicate the seed operation is taking too long.`)
          // Don't break - try to continue with what we have
        } else {
          results.errors.push(`Failed to create article ${articleInfo.title}: ${error.message}`)
        }
      }
    }
    
    // Verify we have articles to work with
    if (createdArticleIds.length === 0) {
      // Fallback: try to get any published articles from the database
      try {
        const anyArticles = await prisma.$queryRaw`
          SELECT id FROM articles 
          WHERE (status = 'published'::text OR status IS NULL) AND (published = true OR published IS NULL)
          LIMIT 8
        ` as any[]
        
        if (anyArticles && anyArticles.length > 0) {
          for (const a of anyArticles) {
            if (a.id) createdArticleIds.push(a.id)
          }
          results.errors.push(`Could not find/create specific articles, but found ${anyArticles.length} existing articles to use.`)
        } else {
          results.errors.push('WARNING: No articles were found or created. Cannot create article progress.')
        }
      } catch (fallbackError: any) {
        results.errors.push(`WARNING: No articles available and fallback query failed: ${fallbackError.message}`)
      }
    }

    // STEP 4: CREATE SIMULATIONS for the user
    if (createdCaseIds.length === 0) {
      results.errors.push('No case IDs available for creating simulations. Cases may not have been found or created.')
      // Try the fallback query here too
      try {
        const fallbackCases = await prisma.case.findMany({
          where: {
            status: undefined as any,
          },
          // Get cases regardless of status
          take: 5,
          select: { id: true },
        })
        if (fallbackCases.length > 0) {
          createdCaseIds.push(...fallbackCases.map(c => c.id))
          results.errors.push(`Used fallback: found ${fallbackCases.length} existing cases.`)
        }
      } catch (fallbackErr: any) {
        results.errors.push(`Fallback case query failed: ${fallbackErr.message}`)
      }
    }
    
    for (let i = 0; i < Math.min(createdCaseIds.length, 4); i++) {
      const caseId = createdCaseIds[i]
      if (!caseId) continue

      try {
        const existingSim = await prisma.$queryRaw`
          SELECT id FROM simulations 
          WHERE user_id = ${userId}::uuid AND case_id = ${caseId}::uuid LIMIT 1
        ` as any[]
        
        if (existingSim && existingSim.length > 0) continue

        const isCompleted = i < 2
        const status = isCompleted ? 'completed' : 'in_progress'

        const simulationResult = await prisma.$queryRaw`
          INSERT INTO simulations (id, user_id, case_id, status, user_inputs, started_at, completed_at, created_at, updated_at)
          VALUES (
            gen_random_uuid(), 
            ${userId}::uuid, 
            ${caseId}::uuid, 
            ${status}::text,
            ${JSON.stringify({
              stage1: { decision: 'Option A', reasoning: 'Based on financial constraints and strategic alignment' },
              stage2: { decision: 'Option B', reasoning: 'Long-term strategic value outweighs short-term costs' },
              stage3: { decision: 'Option C', reasoning: 'Balanced approach considering stakeholder needs' },
            })}::jsonb,
            ${new Date(Date.now() - (i + 1) * 86400000)}::timestamptz,
            ${isCompleted ? new Date(Date.now() - i * 86400000) : null}::timestamptz,
            NOW(),
            NOW()
          )
          RETURNING id
        ` as any[]
        
        if (!simulationResult || simulationResult.length === 0) continue
        
        const simulationId = simulationResult[0].id
        results.simulations++

        if (isCompleted) {
          try {
            await prisma.$executeRaw`
              INSERT INTO debriefs (id, simulation_id, scores, summary_text, radar_chart_data, created_at, updated_at)
              VALUES (
                gen_random_uuid(),
                ${simulationId}::uuid,
                ${JSON.stringify({
                  strategic_thinking: 85 + Math.floor(Math.random() * 10),
                  financial_acumen: 80 + Math.floor(Math.random() * 15),
                  operational_excellence: 75 + Math.floor(Math.random() * 20),
                  stakeholder_management: 82 + Math.floor(Math.random() * 13),
                  communication: 88 + Math.floor(Math.random() * 7),
                })}::jsonb,
                ${`Your performance demonstrates strong strategic thinking and solid financial analysis. Your decisions showed good understanding of business fundamentals, though there's room for improvement in operational planning and stakeholder communication. Overall, this simulation showcases your growing competency in executive decision-making.`}::text,
                ${JSON.stringify({
                  strategic_thinking: 87,
                  financial_acumen: 83,
                  operational_excellence: 78,
                  stakeholder_management: 85,
                  communication: 89,
                })}::jsonb,
                NOW(),
                NOW()
              )
            `
            results.debriefs++
          } catch (debriefError: any) {
            results.errors.push(`Failed to create debrief: ${debriefError.message}`)
          }
        }
      } catch (simError: any) {
        results.errors.push(`Failed to create simulation: ${simError.message}`)
      }
    }

    // STEP 6: CREATE ARTICLE PROGRESS
    if (createdArticleIds.length === 0) {
      results.errors.push('No article IDs available for creating progress. Articles may not have been found or created.')
      // Try the fallback query here too
      try {
        const fallbackArticles = await prisma.article.findMany({
          where: {
            status: undefined as any,
          },
          // Get articles regardless of status
          take: 8,
          select: { id: true },
        })
        if (fallbackArticles.length > 0) {
          createdArticleIds.push(...fallbackArticles.map(a => a.id))
          results.errors.push(`Used fallback: found ${fallbackArticles.length} existing articles.`)
        }
      } catch (fallbackErr: any) {
        results.errors.push(`Fallback article query failed: ${fallbackErr.message}`)
      }
    }
    
    for (let i = 0; i < Math.min(createdArticleIds.length, 8); i++) {
      const articleId = createdArticleIds[i]
      if (!articleId) continue

      try {
        const existingProgress = await prisma.userArticleProgress.findUnique({
          where: { userId_articleId: { userId, articleId } },
        })

        if (existingProgress) continue

        await prisma.userArticleProgress.create({
          data: {
            userId,
            articleId,
            status: i < 5 ? 'completed' : 'in_progress',
            completedAt: i < 5 ? new Date(Date.now() - (i + 1) * 86400000) : null,
          },
        })
        results.articleProgress++
      } catch (progressError: any) {
        results.errors.push(`Failed to create article progress: ${progressError.message}`)
      }
    }

    // STEP 7: CREATE NOTIFICATIONS
    const completedSimResult = await prisma.$queryRaw`
      SELECT id FROM simulations 
      WHERE user_id = ${userId}::uuid AND status = 'completed'::text LIMIT 1
    ` as any[]
    const completedSimulation = completedSimResult && completedSimResult.length > 0 ? { id: completedSimResult[0].id } : null

    const notifications = [
      {
        type: 'simulation_complete',
        title: 'Simulation Completed',
        message: `You've completed a simulation. Review your debrief to see detailed feedback on your strategic decision-making.`,
        link: completedSimulation ? `/debrief/${completedSimulation.id}` : undefined,
      },
      {
        type: 'weekly_summary',
        title: 'Weekly Progress Summary',
        message: `You completed ${results.articleProgress} articles and ${results.simulations} simulations this week. Keep up the momentum!`,
        link: '/dashboard',
      },
      {
        type: 'general',
        title: 'Welcome to Execemy',
        message: 'Your account is ready. Start exploring the curriculum and case simulations to build your executive skills.',
        link: '/library',
      },
    ]

    for (const notif of notifications) {
      try {
        await prisma.$executeRaw`
          INSERT INTO notifications (id, user_id, type, title, message, link, read, metadata, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${userId}::uuid,
            ${notif.type}::text,
            ${notif.title}::text,
            ${notif.message}::text,
            ${notif.link || null}::text,
            false,
            '{}'::jsonb,
            NOW(),
            NOW()
          )
        `
        results.notifications++
      } catch (notifError: any) {
        results.errors.push(`Failed to create notification: ${notifError.message}`)
      }
    }

    return results
  } catch (error: any) {
    results.errors.push(`Fatal error: ${error.message}`)
    return results
  }
}
