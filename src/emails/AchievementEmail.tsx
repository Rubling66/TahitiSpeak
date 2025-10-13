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

interface AchievementEmailProps {
  userName?: string;
  achievementTitle?: string;
  achievementDescription?: string;
  achievementIcon?: string;
  achievementType?: 'streak' | 'lesson' | 'quiz' | 'milestone' | 'special';
  pointsEarned?: number;
  totalPoints?: number;
  nextGoal?: string;
  shareUrl?: string;
  continueUrl?: string;
  unsubscribeUrl?: string;
}

export const AchievementEmail = ({
  userName = 'Tahitian Learner',
  achievementTitle = 'First Week Complete!',
  achievementDescription = 'You completed your first week of Tahitian learning',
  achievementIcon = '🏆',
  achievementType = 'milestone',
  pointsEarned = 100,
  totalPoints = 350,
  nextGoal = 'Complete 10 lessons',
  shareUrl = 'https://tahitispeak.com/share',
  continueUrl = 'https://tahitispeak.com/lessons',
  unsubscribeUrl = 'https://tahitispeak.com/unsubscribe',
}: AchievementEmailProps) => {
  const previewText = `🎉 Congratulations ${userName}! You've earned: ${achievementTitle}`;

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'streak': return '#f59e0b';
      case 'lesson': return '#10b981';
      case 'quiz': return '#8b5cf6';
      case 'milestone': return '#ef4444';
      case 'special': return '#f97316';
      default: return '#0ea5e9';
    }
  };

  const getAchievementGradient = (type: string) => {
    switch (type) {
      case 'streak': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'lesson': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'quiz': return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      case 'milestone': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'special': return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
      default: return 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=TahitiSpeak%20achievement%20celebration%20badge%20with%20golden%20trophy%20Tahitian%20cultural%20elements&image_size=square"
              width="100"
              height="100"
              alt="Achievement Badge"
              style={logo}
            />
          </Section>

          <Section style={{...heroSection, background: getAchievementGradient(achievementType)}}>
            <div style={celebrationEmoji}>🎉</div>
            <Heading style={h1}>Congratulations!</Heading>
            <Text style={heroText}>
              {userName}, you've unlocked a new achievement!
            </Text>
          </Section>

          <Section style={achievementSection}>
            <div style={achievementBadge}>
              <div style={achievementIconContainer}>
                <Text style={achievementIconText}>{achievementIcon}</Text>
              </div>
              <Heading style={achievementTitleStyle}>{achievementTitle}</Heading>
              <Text style={achievementDescriptionStyle}>{achievementDescription}</Text>
            </div>
          </Section>

          <Section style={pointsSection}>
            <div style={pointsCard}>
              <Text style={pointsEarned}>+{pointsEarned} Points</Text>
              <Text style={totalPointsText}>Total Points: {totalPoints}</Text>
              <div style={pointsBar}>
                <div style={{...pointsFill, width: `${Math.min((totalPoints % 1000) / 10, 100)}%`}}></div>
              </div>
              <Text style={nextLevelText}>
                {1000 - (totalPoints % 1000)} points to next level
              </Text>
            </div>
          </Section>

          <Section style={nextGoalSection}>
            <Heading style={h2}>Next Goal</Heading>
            <div style={goalCard}>
              <Text style={goalIcon}>🎯</Text>
              <Text style={goalText}>{nextGoal}</Text>
            </div>
          </Section>

          <Section style={ctaSection}>
            <Button style={primaryButton} href={continueUrl}>
              Continue Learning
            </Button>
            <Button style={secondaryButton} href={shareUrl}>
              Share Achievement
            </Button>
          </Section>

          <Section style={motivationSection}>
            <Heading style={h3}>Your Learning Journey</Heading>
            <div style={statsGrid}>
              <div style={statItem}>
                <Text style={statNumber}>7</Text>
                <Text style={statLabel}>Days Active</Text>
              </div>
              <div style={statItem}>
                <Text style={statNumber}>15</Text>
                <Text style={statLabel}>Lessons Completed</Text>
              </div>
              <div style={statItem}>
                <Text style={statNumber}>89%</Text>
                <Text style={statLabel}>Quiz Average</Text>
              </div>
            </div>
          </Section>

          <Section style={encouragementSection}>
            <Text style={encouragementText}>
              "E fa'aitoito! Keep going!" - You're making excellent progress in your Tahitian journey. 
              Every achievement brings you closer to fluency!
            </Text>
          </Section>

          <Section style={socialSection}>
            <Heading style={h3}>Share Your Success</Heading>
            <Text style={socialText}>
              Let your friends know about your Tahitian learning progress!
            </Text>
            <div style={socialButtons}>
              <Link href={`${shareUrl}?platform=facebook`} style={socialButton}>
                📘 Facebook
              </Link>
              <Link href={`${shareUrl}?platform=twitter`} style={socialButton}>
                🐦 Twitter
              </Link>
              <Link href={`${shareUrl}?platform=linkedin`} style={socialButton}>
                💼 LinkedIn
              </Link>
            </div>
          </Section>

          <Section style={tipsSection}>
            <Heading style={h3}>Keep the Momentum</Heading>
            <Text style={tipText}>
              🌺 Practice daily, even if just for 5 minutes
            </Text>
            <Text style={tipText}>
              🎵 Listen to Tahitian music to improve your ear
            </Text>
            <Text style={tipText}>
              📚 Try reading simple Tahitian texts
            </Text>
            <Text style={tipText}>
              💬 Join our community discussions
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Māuruuru roa (Thank you very much) for your dedication!
            </Text>
            <Text style={footerText}>
              The TahitiSpeak Team
            </Text>
            <Text style={footerSubtext}>
              Don't want achievement notifications? <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Manage your preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AchievementEmail;

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
  borderRadius: '50%',
  border: '4px solid #fbbf24',
};

const heroSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  color: '#ffffff',
  borderRadius: '12px',
  margin: '0 20px 32px',
  position: 'relative' as const,
};

const celebrationEmoji = {
  fontSize: '48px',
  marginBottom: '16px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 12px',
  textAlign: 'center' as const,
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const heroText = {
  color: '#ffffff',
  fontSize: '18px',
  lineHeight: '1.5',
  margin: '0',
  opacity: 0.95,
};

const achievementSection = {
  padding: '0 20px 32px',
  textAlign: 'center' as const,
};

const achievementBadge = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '32px 20px',
  border: '3px solid #fbbf24',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const achievementIconContainer = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#fef3c7',
  margin: '0 auto 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const achievementIconText = {
  fontSize: '40px',
  margin: '0',
};

const achievementTitleStyle = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const achievementDescriptionStyle = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const pointsSection = {
  padding: '0 20px 32px',
};

const pointsCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
};

const pointsEarned = {
  color: '#10b981',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const totalPointsText = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '0 0 16px',
};

const pointsBar = {
  backgroundColor: '#e5e7eb',
  borderRadius: '8px',
  height: '12px',
  overflow: 'hidden',
  marginBottom: '12px',
};

const pointsFill = {
  backgroundColor: '#10b981',
  height: '100%',
  borderRadius: '8px',
  transition: 'width 0.3s ease',
};

const nextLevelText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const nextGoalSection = {
  padding: '0 20px 32px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const goalCard = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  border: '1px solid #bfdbfe',
};

const goalIcon = {
  fontSize: '24px',
  margin: '0 0 8px',
};

const goalText = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
};

const ctaSection = {
  padding: '0 20px 32px',
  textAlign: 'center' as const,
};

const primaryButton = {
  backgroundColor: '#0ea5e9',
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
  marginRight: '12px',
  marginBottom: '12px',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  color: '#0ea5e9',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: '2px solid #0ea5e9',
  cursor: 'pointer',
  marginLeft: '12px',
  marginBottom: '12px',
};

const motivationSection = {
  padding: '0 20px 32px',
};

const statsGrid = {
  display: 'flex',
  justifyContent: 'space-around',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #e2e8f0',
};

const statItem = {
  textAlign: 'center' as const,
  flex: '1',
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

const encouragementSection = {
  padding: '0 20px 32px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '0 20px 32px',
  padding: '24px 20px',
};

const encouragementText = {
  color: '#92400e',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  fontStyle: 'italic',
  textAlign: 'center' as const,
};

const socialSection = {
  padding: '0 20px 32px',
};

const socialText = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const socialButtons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap' as const,
};

const socialButton = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  fontSize: '14px',
  textDecoration: 'none',
  padding: '10px 16px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  display: 'inline-block',
};

const tipsSection = {
  padding: '0 20px 32px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '0 20px 32px',
  padding: '24px 20px',
};

const tipText = {
  color: '#166534',
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