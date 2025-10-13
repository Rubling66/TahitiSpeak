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

interface WelcomeEmailProps {
  userName?: string;
  userEmail?: string;
  loginUrl?: string;
  supportUrl?: string;
}

export const WelcomeEmail = ({
  userName = 'Tahitian Learner',
  userEmail = 'user@example.com',
  loginUrl = 'https://tahitispeak.com/login',
  supportUrl = 'https://tahitispeak.com/support',
}: WelcomeEmailProps) => {
  const previewText = `Ia ora na ${userName}! Welcome to TahitiSpeak - Your Tahitian Language Learning Journey Begins`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=TahitiSpeak%20logo%20with%20tropical%20Tahitian%20design%20elements%20palm%20trees%20ocean%20waves%20modern%20typography&image_size=landscape_4_3"
              width="200"
              height="150"
              alt="TahitiSpeak"
              style={logo}
            />
          </Section>

          <Section style={heroSection}>
            <Heading style={h1}>Ia ora na, {userName}!</Heading>
            <Text style={heroText}>
              Welcome to TahitiSpeak, your gateway to learning the beautiful Tahitian language. 
              We're excited to have you join our community of language learners!
            </Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h2}>What's Next?</Heading>
            
            <Section style={featureSection}>
              <Text style={featureTitle}>🌺 Start Your First Lesson</Text>
              <Text style={featureDescription}>
                Begin with basic greetings and essential phrases to get comfortable with Tahitian pronunciation.
              </Text>
            </Section>

            <Section style={featureSection}>
              <Text style={featureTitle}>🎯 Set Your Learning Goals</Text>
              <Text style={featureDescription}>
                Customize your learning experience by setting daily goals and tracking your progress.
              </Text>
            </Section>

            <Section style={featureSection}>
              <Text style={featureTitle}>🏆 Earn Achievements</Text>
              <Text style={featureDescription}>
                Complete lessons, practice daily, and unlock badges as you advance through your Tahitian journey.
              </Text>
            </Section>

            <Section style={featureSection}>
              <Text style={featureTitle}>🌊 Immerse in Culture</Text>
              <Text style={featureDescription}>
                Learn not just the language, but also about Tahitian culture, traditions, and way of life.
              </Text>
            </Section>
          </Section>

          <Section style={ctaSection}>
            <Button style={button} href={loginUrl}>
              Start Learning Tahitian
            </Button>
          </Section>

          <Section style={tipsSection}>
            <Heading style={h3}>Quick Tips for Success:</Heading>
            <Text style={tipText}>
              • Practice for just 10-15 minutes daily for best results
            </Text>
            <Text style={tipText}>
              • Use the pronunciation guide to master Tahitian sounds
            </Text>
            <Text style={tipText}>
              • Join our community discussions to practice with other learners
            </Text>
            <Text style={tipText}>
              • Don't be afraid to make mistakes - they're part of learning!
            </Text>
          </Section>

          <Section style={supportSection}>
            <Text style={supportText}>
              Need help getting started? Our support team is here to assist you.
            </Text>
            <Link href={supportUrl} style={supportLink}>
              Contact Support
            </Link>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Māuruuru (Thank you) for choosing TahitiSpeak!
            </Text>
            <Text style={footerText}>
              The TahitiSpeak Team
            </Text>
            <Text style={footerSubtext}>
              You're receiving this email because you signed up for TahitiSpeak with {userEmail}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
  borderRadius: '8px',
};

const heroSection = {
  padding: '0 20px',
  textAlign: 'center' as const,
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  borderRadius: '8px',
  margin: '0 20px 32px',
  padding: '32px 20px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
};

const heroText = {
  color: '#ffffff',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0',
};

const contentSection = {
  padding: '0 20px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
};

const h3 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const featureSection = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
};

const featureTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const featureDescription = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const ctaSection = {
  padding: '32px 20px',
  textAlign: 'center' as const,
};

const button = {
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  margin: '0 20px 32px',
  padding: '24px 20px',
};

const tipText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const supportSection = {
  padding: '0 20px 32px',
  textAlign: 'center' as const,
};

const supportText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 16px',
};

const supportLink = {
  color: '#0ea5e9',
  fontSize: '14px',
  textDecoration: 'underline',
};

const footer = {
  padding: '0 20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
  paddingTop: '32px',
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