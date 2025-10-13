import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WeeklyStats {
  lessonsCompleted: number;
  timeSpent: number; // in minutes
  streakDays: number;
  pointsEarned: number;
  newWordsLearned: number;
  quizAccuracy: number;
}

interface WeeklyDigestEmailProps {
  userName?: string;
  weekStats?: WeeklyStats;
  weeklyGoal?: string;
  nextWeekGoal?: string;
  featuredLesson?: {
    title: string;
    description: string;
    url: string;
  };
  culturalTip?: string;
  continueUrl?: string;
  unsubscribeUrl?: string;
}

export const WeeklyDigestEmail = ({
  userName = 'Tahitian Learner',
  weekStats = {
    lessonsCompleted: 5,
    timeSpent: 120,
    streakDays: 6,
    pointsEarned: 350,
    newWordsLearned: 25,
    quizAccuracy: 87,
  },
  weeklyGoal = 'Complete 7 lessons',
  nextWeekGoal = 'Learn family vocabulary',
  featuredLesson = {
    title: 'Tahitian Family Terms',
    description: 'Learn how to talk about family members in Tahitian',
    url: 'https://tahitispeak.com/lessons/family',
  },
  culturalTip = 'In Tahitian culture, extended family (\'āiga) is extremely important. The concept of family extends beyond blood relations to include close friends and community members.',
  continueUrl = 'https://tahitispeak.com/dashboard',
  unsubscribeUrl = 'https://tahitispeak.com/unsubscribe',
}: WeeklyDigestEmailProps) => {
  const previewText = `Your weekly Tahitian learning summary - ${weekStats.lessonsCompleted} lessons completed!`;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=TahitiSpeak%20weekly%20summary%20calendar%20with%20Tahitian%20sunset%20colors&image_size=landscape_4_3"
              width="200"
              height="150"
              alt="Weekly Summary"
              style={logo}
            />
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Your Weekly Progress</Heading>
            <Text style={heroText}>
              Ia ora na {userName}! Here's how you did this week in your Tahitian learning journey.
            </Text>
          </Section>

          <Section style={statsSection}>
            <Heading style={h2}>This Week's Achievements</Heading>
            <div style={statsGrid}>
              <div style={statCard}>
                <Text style={statNumber}>{weekStats.lessonsCompleted}</Text>
                <Text style={statLabel}>Lessons Completed</Text>
              </div>
              <div style={statCard}>
                <Text style={statNumber}>{formatTime(weekStats.timeSpent)}</Text>
                <Text style={statLabel}>Time Spent Learning</Text>
              </div>
              <div style={statCard}>
                <Text style={statNumber}>{weekStats.streakDays}</Text>
                <Text style={statLabel}>Day Streak</Text>
              </div>
            </div>
            <div style={statsGrid}>
              <div style={statCard}>
                <Text style={statNumber}>{weekStats.pointsEarned}</Text>
                <Text style={statLabel}>Points Earned</Text>
              </div>
              <div style={statCard}>
                <Text style={statNumber}>{weekStats.newWordsLearned}</Text>
                <Text style={statLabel}>New Words</Text>
              </div>
              <div style={statCard}>
                <Text style={statNumber}>{weekStats.quizAccuracy}%</Text>
                <Text style={statLabel}>Quiz Accuracy</Text>
              </div>
            </div>
          </Section>

          <Section style={goalSection}>
            <Heading style={h2}>Goal Progress</Heading>
            <div style={goalCard}>
              <Text style={goalTitle}>This Week's Goal</Text>
              <Text style={goalText}>{weeklyGoal}</Text>
              <div style={progressContainer}>
                <div style={progressBar}>
                  <div style={{...progressFill, width: `${Math.min((weekStats.lessonsCompleted / 7) * 100, 100)}%`}}></div>
                </div>
                <Text style={progressText}>
                  {weekStats.lessonsCompleted >= 7 ? '✅ Goal Achieved!' : `${weekStats.lessonsCompleted}/7 completed`}
                </Text>
              </div>
            </div>
          </Section>

          <Section style={featuredSection}>
            <Heading style={h2}>Featured This Week</Heading>
            <div style={featuredCard}>
              <Text style={featuredTitle}>{featuredLesson.title}</Text>
              <Text style={featuredDescription}>{featuredLesson.description}</Text>
              <Button style={featuredButton} href={featuredLesson.url}>
                Start Lesson
              </Button>
            </div>
          </Section>

          <Section style={culturalSection}>
            <Heading style={h2}>Cultural Insight</Heading>
            <div style={culturalCard}>
              <Text style={culturalIcon}>🌺</Text>
              <Text style={culturalText}>{culturalTip}</Text>
            </div>
          </Section>

          <Section style={nextWeekSection}>
            <Heading style={h2}>Next Week's Focus</Heading>
            <div style={nextWeekCard}>
              <Text style={nextWeekGoalText}>{nextWeekGoal}</Text>
              <Text style={nextWeekDescription}>
                Continue building your Tahitian vocabulary and cultural understanding!
              </Text>
            </div>
          </Section>

          <Section style={motivationSection}>
            <div style={motivationCard}>
              <Text style={motivationQuote}>
                "E fa'aitoito! Te tauturu nei au ia oe."
              </Text>
              <Text style={motivationTranslation}>
                "Keep going! I'm here to help you."
              </Text>
              <Text style={motivationText}>
                You're making excellent progress! Every lesson brings you closer to fluency in this beautiful language.
              </Text>
            </div>
          </Section>

          <Section style={ctaSection}>
            <Button style={primaryButton} href={continueUrl}>
              Continue Learning
            </Button>
          </Section>

          <Section style={tipsSection}>
            <Heading style={h3}>Tips for Next Week</Heading>
            <Text style={tipText}>
              🎯 Set aside 15 minutes daily for consistent practice
            </Text>
            <Text style={tipText}>
              🎵 Listen to Tahitian music to improve pronunciation
            </Text>
            <Text style={tipText}>
              📱 Use the mobile app for quick practice sessions
            </Text>
            <Text style={tipText}>
              💬 Join community discussions to practice with others
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Māuruuru for your dedication to learning Tahitian!
            </Text>
            <Text style={footerText}>
              The TahitiSpeak Team
            </Text>
            <Text style={footerSubtext}>
              Don't want weekly summaries? <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Update your email preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyDigestEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoContainer = {
  padding: '20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  borderRadius: '8px',
};

const heroSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  borderRadius: '8px',
  margin: '0 20px 32px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const heroText = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const statsSection = {
  padding: '0 20px 32px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const statsGrid = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '16px',
  gap: '12px',
};

const statCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  flex: '1',
  border: '1px solid #e2e8f0',
};

const statNumber = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};

const statLabel = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const goalSection = {
  padding: '0 20px 32px',
};

const goalCard = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #fbbf24',
};

const goalTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
};

const goalText = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '500',
  margin: '0 0 16px',
};

const progressContainer = {
  marginTop: '12px',
};

const progressBar = {
  backgroundColor: '#fde68a',
  borderRadius: '4px',
  height: '8px',
  overflow: 'hidden',
  marginBottom: '8px',
};

const progressFill = {
  backgroundColor: '#f59e0b',
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};

const progressText = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
};

const featuredSection = {
  padding: '0 20px 32px',
};

const featuredCard = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #bfdbfe',
  textAlign: 'center' as const,
};

const featuredTitle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const featuredDescription = {
  color: '#3730a3',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const featuredButton = {
  backgroundColor: '#1e40af',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  border: 'none',
  cursor: 'pointer',
};

const culturalSection = {
  padding: '0 20px 32px',
};

const culturalCard = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #bbf7d0',
};

const culturalIcon = {
  fontSize: '24px',
  margin: '0 0 12px',
  textAlign: 'center' as const,
  display: 'block',
};

const culturalText = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
  fontStyle: 'italic',
};

const nextWeekSection = {
  padding: '0 20px 32px',
};

const nextWeekCard = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #fecaca',
  textAlign: 'center' as const,
};

const nextWeekGoalText = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const nextWeekDescription = {
  color: '#991b1b',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const motivationSection = {
  padding: '0 20px 32px',
};

const motivationCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid #e2e8f0',
  textAlign: 'center' as const,
};

const motivationQuote = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  fontStyle: 'italic',
};

const motivationTranslation = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 16px',
  fontStyle: 'italic',
};

const motivationText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const ctaSection = {
  padding: '0 20px 32px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
  cursor: 'pointer',
};

const tipsSection = {
  padding: '0 20px 32px',
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '0 20px 32px',
  padding: '24px 20px',
};

const tipText = {
  color: '#0c4a6e',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const footer = {
  padding: '0 20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  paddingTop: '24px',
};

const footerText = {
  color: '#1f2937',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const footerSubtext = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '16px 0 0',
};

const unsubscribeLink = {
  color: '#0ea5e9',
  textDecoration: 'underline',
};