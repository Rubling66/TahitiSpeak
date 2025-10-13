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

interface LessonReminderEmailProps {
  userName?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  streakCount?: number;
  nextLessonUrl?: string;
  unsubscribeUrl?: string;
  currentLevel?: string;
  progressPercentage?: number;
}

export const LessonReminderEmail = ({
  userName = 'Tahitian Learner',
  lessonTitle = 'Basic Greetings',
  lessonDescription = 'Learn essential Tahitian greetings and polite expressions',
  streakCount = 5,
  nextLessonUrl = 'https://tahitispeak.com/lessons/next',
  unsubscribeUrl = 'https://tahitispeak.com/unsubscribe',
  currentLevel = 'Beginner',
  progressPercentage = 25,
}: LessonReminderEmailProps) => {
  const previewText = `Time for your Tahitian lesson! Continue your ${streakCount}-day streak`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=TahitiSpeak%20reminder%20notification%20icon%20with%20Tahitian%20sunset%20colors%20orange%20pink%20purple&image_size=square"
              width="80"
              height="80"
              alt="TahitiSpeak Reminder"
              style={logo}
            />
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Ia ora na, {userName}!</Heading>
            <Text style={heroText}>
              Your daily Tahitian lesson is ready. Keep your learning momentum going!
            </Text>
          </Section>

          <Section style={streakSection}>
            <div style={streakBadge}>
              <Text style={streakNumber}>{streakCount}</Text>
              <Text style={streakLabel}>Day Streak</Text>
            </div>
            <Text style={streakText}>
              {streakCount > 1 
                ? `Amazing! You're on a ${streakCount}-day learning streak. Don't break it now!`
                : "Start building your learning streak today!"
              }
            </Text>
          </Section>

          <Section style={lessonSection}>
            <Heading style={h2}>Today's Lesson</Heading>
            <div style={lessonCard}>
              <Text style={lessonTitle}>{lessonTitle}</Text>
              <Text style={lessonDescription}>{lessonDescription}</Text>
              
              <div style={progressContainer}>
                <Text style={progressLabel}>Course Progress: {progressPercentage}%</Text>
                <div style={progressBar}>
                  <div style={{...progressFill, width: `${progressPercentage}%`}}></div>
                </div>
                <Text style={levelText}>Current Level: {currentLevel}</Text>
              </div>
            </div>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={nextLessonUrl}>
              Continue Learning
            </Button>
            <Text style={ctaSubtext}>
              Just 10-15 minutes to maintain your streak!
            </Text>
          </Section>

          <Section style={motivationSection}>
            <Heading style={h3}>Did You Know?</Heading>
            <Text style={factText}>
              🌺 "Ia ora na" is the most common Tahitian greeting, literally meaning "may you live"
            </Text>
            <Text style={factText}>
              🏝️ Tahitian is spoken by over 120,000 people across French Polynesia
            </Text>
            <Text style={factText}>
              🎵 The Tahitian language has a musical quality with only 13 letters in its alphabet
            </Text>
          </Section>

          <Section style={tipsSection}>
            <Heading style={h3}>Quick Learning Tip</Heading>
            <Text style={tipText}>
              Practice pronunciation by listening to native speakers. Pay attention to the rhythm 
              and flow of Tahitian - it's often described as having a "singing" quality!
            </Text>
          </Section>

          <Section style={socialSection}>
            <Text style={socialText}>
              Share your progress with the TahitiSpeak community!
            </Text>
            <div style={socialButtons}>
              <Link href="#" style={socialButton}>📱 Share on Social</Link>
              <Link href="#" style={socialButton}>💬 Join Discussion</Link>
            </div>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Keep up the great work on your Tahitian journey!
            </Text>
            <Text style={footerText}>
              Māuruuru,<br />
              The TahitiSpeak Team
            </Text>
            <Text style={footerSubtext}>
              Don't want daily reminders? <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Adjust your notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LessonReminderEmail;

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
};

const heroSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#f97316',
  color: '#ffffff',
  borderRadius: '8px',
  margin: '0 20px 24px',
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

const streakSection = {
  padding: '0 20px 24px',
  textAlign: 'center' as const,
};

const streakBadge = {
  display: 'inline-block',
  backgroundColor: '#10b981',
  borderRadius: '50%',
  width: '80px',
  height: '80px',
  textAlign: 'center' as const,
  marginBottom: '16px',
  padding: '16px',
  boxSizing: 'border-box' as const,
};

const streakNumber = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
};

const streakLabel = {
  color: '#ffffff',
  fontSize: '10px',
  margin: '4px 0 0',
  lineHeight: '1',
  textTransform: 'uppercase' as const,
};

const streakText = {
  color: '#1f2937',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0',
};

const lessonSection = {
  padding: '0 20px 24px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const lessonCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  border: '1px solid #e2e8f0',
};

const lessonTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const lessonDescription = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const progressContainer = {
  marginTop: '16px',
};

const progressLabel = {
  color: '#1f2937',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 8px',
};

const progressBar = {
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  height: '8px',
  overflow: 'hidden',
  marginBottom: '8px',
};

const progressFill = {
  backgroundColor: '#10b981',
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};

const levelText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

const ctaSection = {
  padding: '24px 20px',
  textAlign: 'center' as const,
};

const button = {
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
};

const ctaSubtext = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '12px 0 0',
};

const motivationSection = {
  padding: '0 20px 24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  margin: '0 20px 24px',
  padding: '20px',
};

const factText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const tipsSection = {
  padding: '0 20px 24px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '0 20px 24px',
  padding: '20px',
};

const tipText = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const socialSection = {
  padding: '0 20px 24px',
  textAlign: 'center' as const,
};

const socialText = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0 0 16px',
};

const socialButtons = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
};

const socialButton = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  fontSize: '12px',
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
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